from openai import AsyncOpenAI
from typing import List

PROMPT = """
Extract all meaningful content from the image and format it strictly as Markdown, following these rules:

1. **Text**: Extract and output all readable text in its original form. Do not add extra symbols, headers, or summaries.

2. **Formulas**: If there are mathematical formulas, extract them and write them using LaTeX syntax. Wrap each formula in double dollar signs (`$$`) for display mode in Markdown.

3. **Tables**: If the image contains tables, extract them and convert them into LaTeX `tabular` environments. Do not add captions, labels, or any additional description.

**Output rules**:
- Do not add any extra explanations, headers, code blocks, or comments.
- Output only the extracted content in Markdown-compatible syntax.
- Preserve the order and formatting as shown in the image.
- If the image contains multiple sections, ensure each section is clearly separated in the Markdown output.
"""

def get_provider_config(provider_name: str, img: str, prompt: str) -> dict:
    """
    Get the provider configuration for a given provider name.
    """
    
    provider_configs = {
        "OpenAI": {
            "message_format": {
                "role": "user",
                "content": [
                    {
                        "type": "input_image",
                        "image_url": {"url": f"data:image/jpeg;base64,{img}"}
                    },
                    {
                        "type": "input_text", 
                        "text": prompt
                    }
                ]
            }
        },
        
        "siliconflow": {
            "message_format": {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{img}"}
                    },
                    {
                        "type": "text", 
                        "text": prompt
                    }
                ]
            }
        },
        
        "Ollama": {
            "message_format": {
                "role": "user",
                "content": prompt,
                "images": [img]
            }
        },
        
        "anthropic": {
            "message_format": {
                "role": "user",
                "content": prompt,
                "images":[img]
            }
        }
    }
    return provider_configs.get(provider_name)

async def process_single_api_stream(images: List[str], api_config: dict):
    """
    Processes multiple images sequentially for a single API.
    Yields results as they are processed.
    """
    import logging
    logger = logging.getLogger("vlm_ocr")
    
    api_name = api_config.get("name", "Unnamed API")
    
    try:
        api_key = api_config.get("apiKey")
        url = api_config.get("endpoint")
        model = api_config.get("model")
        
        provider = api_config.get("provider", "OpenAI")
        if not api_key:
            logger.error(f"API key not provided for {api_name}")
            yield {"name": api_name, "page": 0, "content": "API initialization failed: API key not provided", "success": False}
            return
        
        client = AsyncOpenAI(
            api_key=api_key,
            base_url=url
        )
        
        for i, img in enumerate(images):
            try:
                provider_config = get_provider_config(provider, img, PROMPT)
                message_format = provider_config["message_format"]

                response = await client.chat.completions.create(
                    model=model,
                    messages=[message_format]
                )
                
                result = {
                    "name": api_name,
                    "page": i + 1,
                    "content": response.choices[0].message.content,
                    "success": True
                }
                yield result
                logger.info(f"Successfully processed page {i+1} with API {api_name}")
                
            except Exception as e:
                logger.error(f"Error processing page {i+1} with API {api_name}: {str(e)}")
                result = {
                    "name": api_name,
                    "page": i + 1,
                    "content": f"Processing failed: {str(e)}",
                    "success": False
                }
                yield result
                
    except Exception as e:
        logger.error(f"Error initializing API {api_name}: {str(e)}")
        yield {"name": api_name, "page": 0, "content": f"API initialization failed: {str(e)}", "success": False}
