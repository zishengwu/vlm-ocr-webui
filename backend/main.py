import asyncio
import base64
import json
import logging
import time
from typing import List
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import fitz
from llm_client import Vlm_client

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

async def mock_vlm_ocr(image_base64: str, api_configs: List[dict]) -> str:
    """
    A mock VLM OCR function that returns a predefined Markdown string.
    In a real application, this would call the actual VLM OCR API.
    """
    response = await Vlm_client(image_base64, api_configs)
    return response

@app.post("/api/ocr")
async def ocr_pdf(file: UploadFile = File(...), api_configs: str = Form(None)):
    """
    This endpoint receives a PDF file, splits it into pages,
    simulates OCR on each page, and returns the results.
    """
    logger.info(f"Received OCR request for file: {file.filename}")
    pdf_bytes = await file.read()
    pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
    logger.info(f"PDF has {len(pdf_document)} pages")
    
    # 解析API配置
    configs = None
    try:
        if api_configs:
            configs = json.loads(api_configs)
            logger.info(f"Parsed API configs: {configs}")
    except Exception as e:
        logger.error(f"Error parsing API configs: {e}")

    # 创建OCR任务列表
    ocr_tasks = []
    
    # 预处理所有页面以获取base64编码的图像
    logger.info(f"开始处理PDF文件，共 {len(pdf_document)} 页")
  
    base64_images = []
    for page_number in range(len(pdf_document)):
        page = pdf_document.load_page(page_number)
        pix = page.get_pixmap()
        img_bytes = pix.tobytes("png")
        base64_img = base64.b64encode(img_bytes).decode('utf-8')
        base64_images.append(base64_img)
        logger.info(f"预处理完成: 第 {page_number+1} 页")
 
    ocr_tasks = [mock_vlm_ocr(img, configs) for img in base64_images]
    ocr_results = await asyncio.gather(*ocr_tasks)
    return {"results": ocr_results}

@app.get("/")
def read_root():
    return {"Hello": "World"}