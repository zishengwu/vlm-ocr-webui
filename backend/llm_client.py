from openai import AsyncOpenAI
import asyncio
from typing import List, Dict, Any

PROMPT = """
# Instruction
    Extract content from the image according to the following rules:

    - text: Please output the text content from the image.,
    - formula: Please write out the expression of the formula in the image using LaTeX format.,
    - table: Please output the table in the image in LaTeX format.
    
"""

async def process_single_api(img: str, api_config: dict) -> Dict[str, Any]:
    """Processes a single API request."""
    try:
        api_key = api_config.get("apiKey")
        url = api_config.get("endpoint")
        name = api_config.get("name", "")

        client = AsyncOpenAI(
            api_key=api_key,
            base_url=url
        )
        model = api_config.get("model")

        response = await client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{img}"}
                        },
                        {
                            "type": "text", 
                            "text": PROMPT
                        }
                    ],
                }
            ],
        )
        return {
            "name": name,
            "content": response.choices[0].message.content,
            "success": True
        }
    except Exception as e:
        return {
            "name": api_config.get("name", "Unnamed API"),
            "content": f"Processing failed: {str(e)}",
            "success": False
        }

async def Vlm_client(img: str, api_configs: List[dict]) -> str:
    """Processes multiple API requests and returns the results."""
    import logging
    logger = logging.getLogger("vlm_ocr")
    
    if not api_configs or len(api_configs) == 0:
        logger.error("Error: No API configuration provided")
        return "Error: No API configuration provided"
    
    start_time = asyncio.get_event_loop().time()
    tasks = [process_single_api(img, config) for config in api_configs]
    results = await asyncio.gather(*tasks)
    end_time = asyncio.get_event_loop().time()
    
    logger.info(f"All API requests processed, time taken: {end_time - start_time:.2f} seconds")

    formatted_results = ""
    for result in results:
        logger.info(f"API '{result['name']}' processed {'successfully' if result['success'] else 'failed'}")
        formatted_results += f"## {result['name']} Results\n\n"
        formatted_results += result["content"]
        formatted_results += "\n\n---\n\n"
    
    return formatted_results
