# backend/app/services/knowledge_base_service.py
import chromadb
import fitz
import os
import re
from typing import List
from ..core.config import settings
import google.generativeai as genai
import chromadb.utils.embedding_functions as embedding_functions

class GeminiEmbeddingFunction(chromadb.EmbeddingFunction):
    # ... (class code remains the same as before)
    def __init__(self, api_key: str, model_name: str = "models/text-embedding-004"):
        if not api_key:
            raise ValueError("Google API key is required for Gemini Embedding Function.")
        self.model_name = model_name
        genai.configure(api_key=api_key)

    def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
        response = genai.embed_content(model=self.model_name, content=input, task_type="retrieval_document")
        return response['embedding']

CHROMA_DB_PATH = "./chroma_db_gemini"
client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

gemini_ef = None
if settings.GOOGLE_API_KEY:
    gemini_ef = GeminiEmbeddingFunction(api_key=settings.GOOGLE_API_KEY)
else:
    print("WARNING: GOOGLE_API_KEY not found. Knowledge Base will not function.")

def sanitize_collection_name(filename: str) -> str:
    # ... (function code remains the same as before)
    sanitized_name = filename.replace(" ", "_")
    sanitized_name = re.sub(r'[^\w.-]', '', sanitized_name)
    if len(sanitized_name) < 3:
        sanitized_name = "collection_" + sanitized_name
    return sanitized_name[:63]

def process_pdf(file_path: str, collection_name: str) -> None:
    if not gemini_ef:
        raise ValueError("Cannot process PDF: Gemini embedding function is not initialized. Check GOOGLE_API_KEY.")
    
    try:
        doc = fitz.open(file_path)
        text_chunks = [page.get_text() for page in doc]
        if not text_chunks:
            raise ValueError("Could not extract text from PDF.")

        safe_collection_name = sanitize_collection_name(collection_name)
        collection = client.get_or_create_collection(name=safe_collection_name, embedding_function=gemini_ef)
        ids = [f"{safe_collection_name}_{i}" for i, _ in enumerate(text_chunks)]
        collection.upsert(documents=text_chunks, ids=ids)
        print(f"Successfully processed PDF with Gemini and stored in collection '{safe_collection_name}'")
    except Exception as e:
        print(f"Error processing PDF with Gemini: {e}")
        # --- THIS IS THE CHANGE: Re-raise the exception to report it ---
        raise e

def query_knowledge_base(query: str, collection_name: str) -> str:
    # ... (function code remains the same as before)
    if not settings.GOOGLE_API_KEY:
        print("Error: Cannot query without Google API key.")
        return ""
    try:
        safe_collection_name = sanitize_collection_name(collection_name)
        collection = client.get_collection(name=safe_collection_name)
        query_embedding = genai.embed_content(model='models/text-embedding-004', content=query, task_type="retrieval_query")['embedding']
        results = collection.query(query_embeddings=[query_embedding], n_results=3)
        if not results['documents'] or not results['documents'][0]:
            return ""
        context = "\n".join(results['documents'][0])
        return context
    except Exception as e:
        print(f"Error querying ChromaDB with Gemini: {e}")
        return ""