import base64
import json
import logging
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import fitz
from llm_client import  process_single_api_stream

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.post("/api/ocr/stream")
async def ocr_pdf_stream_concurrent(file: UploadFile = File(...), api_configs: str = Form(None)):
    """
    This endpoint receives a PDF file and API configurations,
    processes each page and returns results as a stream.
    Each result is returned immediately after processing.
    
    Features:
    1. Parses PDF into individual page images
    2. Processes multiple APIs concurrently
    3. Each API processes pages sequentially
    4. Returns results as Server-Sent Events (SSE) stream
    """
    logger.info(f"Received streaming OCR request for file: {file.filename}")
    
    # Read and parse PDF outside of the generator
    pdf_document = None
    base64_images = []
    configs = []
    
    try:
        # Read and parse PDF
        pdf_bytes = await file.read()
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        logger.info(f"PDF has {len(pdf_document)} pages")
        
        # Parse API configurations
        try:
            if api_configs:
                configs = json.loads(api_configs)
                logger.info(f"Parsed {len(configs)} API configs")
            else:
                raise ValueError("No API configurations provided")
        except Exception as e:
            logger.error(f"Error parsing API configs: {e}")
            raise ValueError(f"Invalid API configuration: {str(e)}")
        
        # Convert all PDF pages to base64 images
        for page_number in range(len(pdf_document)):
            page = pdf_document.load_page(page_number)
            pix = page.get_pixmap()
            img_bytes = pix.tobytes("png")
            base64_img = base64.b64encode(img_bytes).decode('utf-8')
            base64_images.append(base64_img)
            logger.info(f"Converted page {page_number + 1} to base64")
        
        # Close PDF document after extracting all images
        pdf_document.close()
        pdf_document = None
        logger.info("PDF document closed after image extraction")
        
    except Exception as e:
        if pdf_document:
            pdf_document.close()
        logger.error(f"Error preparing PDF: {e}")
        # Return error response directly
        async def error_stream():
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        return StreamingResponse(
            error_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )
    
    async def generate_stream():
        try:
            # Send initial info
            initial_info = {
                "type": "info",
                "total_pages": len(base64_images),
                "total_apis": len(configs),
                "message": "Starting concurrent processing"
            }
            yield f"data: {json.dumps(initial_info)}\n\n"
            
            # Create concurrent tasks for each API
            api_tasks = []
            for config in configs:
                task = process_single_api_stream(base64_images, config)
                api_tasks.append(task)
            
            logger.info(f"Starting concurrent streaming with {len(api_tasks)} APIs")
            
            # Process results as they come in
            async def process_api_stream(api_generator, api_index):
                async for result in api_generator:
                    stream_result = {
                        "type": "result",
                        "api_index": api_index,
                        "result": result
                    }
                    yield f"data: {json.dumps(stream_result)}\n\n"
            
            # Create tasks for streaming each API
            stream_tasks = []
            for i, api_task in enumerate(api_tasks):
                stream_task = process_api_stream(api_task, i)
                stream_tasks.append(stream_task)
            
            # Merge all streams
            import asyncio
            from asyncio import Queue
            
            result_queue = Queue()
            
            async def stream_to_queue(stream_gen, queue):
                async for item in stream_gen:
                    await queue.put(item)
            
            # Start all streaming tasks
            queue_tasks = []
            for stream_task in stream_tasks:
                queue_task = asyncio.create_task(stream_to_queue(stream_task, result_queue))
                queue_tasks.append(queue_task)
            
            # Signal completion task
            async def signal_completion():
                await asyncio.gather(*queue_tasks)
                await result_queue.put(None)  # Signal completion
            
            completion_task = asyncio.create_task(signal_completion())
            
            # Yield results as they arrive
            while True:
                try:
                    result = await asyncio.wait_for(result_queue.get(), timeout=1.0)
                    if result is None:  # Completion signal
                        break
                    yield result
                except asyncio.TimeoutError:
                    # Send heartbeat to keep connection alive
                    yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
            
            # Send completion signal
            completion_info = {
                "type": "complete",
                "message": "All processing completed"
            }
            yield f"data: {json.dumps(completion_info)}\n\n"
            
        except Exception as e:
            logger.error(f"Error in streaming OCR processing: {e}")
            error_result = {
                "type": "error",
                "error": f"Processing failed: {str(e)}"
            }
            yield f"data: {json.dumps(error_result)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

@app.get("/")
def read_root():
    return {"Hello": "World"}