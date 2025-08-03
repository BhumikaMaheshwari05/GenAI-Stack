# backend/app/services/openai_service.py
import os
from openai import OpenAI
from ..core.config import settings
from typing import Optional # Make sure Optional is imported

def get_llm_response(prompt: str, user_query: str, context: Optional[str] = None, model: str = "gpt-4o-mini") -> str:
    """
    Sends a request to the OpenAI API.
    - If context is provided, it acts as a strict RAG bot.
    - If context is NOT provided, it acts as a general chatbot.
    """
    if not settings.OPENAI_API_KEY:
        return "Error: OPENAI_API_KEY is not set in the environment."

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        system_persona = prompt # This is the base personality from the UI
        system_prompt = system_persona

        # --- NEW CONDITIONAL LOGIC ---
        # If context exists, add strict RAG instructions
        if context:
            rag_instruction = (
                "You must answer the user's question based ONLY on the context provided below. "
                "If the context does not contain the answer, you must state that the information is not available in the provided document. "
                "Do not use your general knowledge."
            )
            system_prompt = (
                f"{system_persona}\n\n"
                f"{rag_instruction}\n\n"
                f"Context: {context}"
            )
        # If no context, the system_prompt remains just the persona, allowing general chat.

        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query}
            ]
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return f"Error: Could not get a response from OpenAI. Details: {e}"