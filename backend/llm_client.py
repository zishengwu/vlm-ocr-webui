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
    """处理单个API请求"""
    try:
        api_key = api_config.get("apiKey")
        url = api_config.get("endpoint")
        name = api_config.get("name", "未命名API")

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
            "name": api_config.get("name", "未命名API"),
            "content": f"处理失败: {str(e)}",
            "success": False
        }

async def Vlm_client(img: str, api_configs: List[dict]) -> str:
    """处理多个API请求并返回结果"""
    import logging
    logger = logging.getLogger("vlm_ocr")
    
    if not api_configs or len(api_configs) == 0:
        logger.error("错误: 未提供API配置")
        return "错误: 未提供API配置"
    
    start_time = asyncio.get_event_loop().time()
    tasks = [process_single_api(img, config) for config in api_configs]
    results = await asyncio.gather(*tasks)
    end_time = asyncio.get_event_loop().time()
    
    logger.info(f"所有API请求处理完成，耗时: {end_time - start_time:.2f}秒")

    formatted_results = ""
    for result in results:
        logger.info(f"API '{result['name']}' 处理{'成功' if result['success'] else '失败'}")
        formatted_results += f"## {result['name']} 结果\n\n"
        formatted_results += result["content"]
        formatted_results += "\n\n---\n\n"
    
    return formatted_results
