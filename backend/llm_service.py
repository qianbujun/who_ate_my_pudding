import os
from openai import AsyncOpenAI
import json

LLM_API_KEY = os.getenv("DASHSCOPE_API_KEY", os.getenv("LLM_API_KEY", "your_key"))
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
MODEL_NAME = os.getenv("MODEL_NAME", "deepseek-v4-flash")

client = AsyncOpenAI(api_key=LLM_API_KEY, base_url=LLM_BASE_URL)

async def ask_llm(character_name: str, system_prompt: str, user_question: str, history: list = None):
    messages = [{"role": "system", "content": system_prompt}]
    
    if history:
        for msg in history:
            messages.append({"role": "user", "content": msg["question"]})
            messages.append({"role": "assistant", "content": msg["answer"]})
            
    messages.append({"role": "user", "content": user_question})
    
    try:
        response = await client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"({character_name} 陷入了沉默，似乎什么也没听到... 错误: {str(e)})"

async def evaluate_marisa_presence(answer_text: str) -> bool:
    prompt = "判断以下角色的回答是否明确承认了她看见、碰见或知道魔理沙来过红魔馆。如果她只是说没见过魔理沙、不知道魔理沙在哪，或者否认见过，请返回 FALSE。如果她具体描述了魔理沙的行动、承认见到了魔理沙，或者说魔理沙来过，请返回 TRUE。只能回答 TRUE 或 FALSE。"
    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": answer_text}
    ]
    try:
        response = await client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.0,
            max_tokens=10
        )
        return "TRUE" in response.choices[0].message.content.upper()
    except Exception:
        return False

async def ask_llm_stream(character_name: str, system_prompt: str, user_question: str, history: list = None):
    messages = [{"role": "system", "content": system_prompt}]
    
    if history:
        for msg in history:
            messages.append({"role": "user", "content": msg["question"]})
            messages.append({"role": "assistant", "content": msg["answer"]})
            
    messages.append({"role": "user", "content": user_question})
    
    try:
        completion = await client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            extra_body={"enable_thinking": True},
            stream=True,
            stream_options={"include_usage": True}
        )
        
        async for chunk in completion:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            
            # reasoning
            if hasattr(delta, "reasoning_content") and delta.reasoning_content is not None:
                yield {"type": "reasoning", "content": delta.reasoning_content}
                
            # answer content
            if hasattr(delta, "content") and delta.content is not None:
                yield {"type": "content", "content": delta.content}
                
    except Exception as e:
        yield {"type": "error", "content": f"\n({character_name} 陷入了沉默... 错误: {str(e)})"}
