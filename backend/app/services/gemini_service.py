# backend/app/services/gemini_service.py
import os
from ..core.config import settings
import google.generativeai as genai
from typing import Optional

def get_gemini_response(prompt: str, user_query: str, context: Optional[str] = None, web_context: Optional[str] = None, model_name: str = "gemini-1.5-flash-latest") -> str:
    if not settings.GOOGLE_API_KEY:
        return "Error: GOOGLE_API_KEY is not set in the environment."
    
    try:
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        model = genai.GenerativeModel(model_name)

        # Build the final prompt that will be sent to the AI
        final_prompt_parts = [prompt] # Start with the base persona/prompt from the UI

        if context:
            final_prompt_parts.append("\n\nUse the following document context to answer the user's question. If the answer is not in the context, say so.")
            final_prompt_parts.append(f"\n--- DOCUMENT CONTEXT START ---\n{context}\n--- DOCUMENT CONTEXT END ---")
        
        if web_context:
            final_prompt_parts.append("\n\nYou may also use these web search results.")
            final_prompt_parts.append(f"\n--- WEB SEARCH RESULTS START ---\n{web_context}\n--- WEB SEARCH RESULTS END ---")

        final_prompt_parts.append(f"\n\nUser Question: {user_query}")
        
        final_prompt = "".join(final_prompt_parts)

        response = model.generate_content(final_prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        return f"Error: Could not get a response from Gemini. Details: {e}"