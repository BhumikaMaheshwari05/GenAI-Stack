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
    def __init__(self, api_key: str, model_name: str = "models/text-embedding-004"):
        if not api_key:
            raise ValueError("Google API key is required for Gemini Embedding Function.")
        self.model_name = model_name
        genai.configure(api_key=api_key)

    def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
        response = genai.embed_content(model=self.model_name,
                                       content=input,
                                       task_type="retrieval_document")
        return response['embedding']

CHROMA_DB_PATH = "./chroma_db_gemini"
client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

gemini_ef = None
if settings.GOOGLE_API_KEY:
    gemini_ef = GeminiEmbeddingFunction(api_key=settings.GOOGLE_API_KEY)
else:
    print("WARNING: GOOGLE_API_KEY not found. Knowledge Base will not function.")

def sanitize_collection_name(filename: str) -> str:
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
        collection = client.get_or_create_collection(
            name=safe_collection_name,
            embedding_function=gemini_ef
        )
        ids = [f"{safe_collection_name}_{i}" for i, _ in enumerate(text_chunks)]
        collection.upsert(documents=text_chunks, ids=ids)
        print(f"Successfully processed PDF with Gemini and stored in collection '{safe_collection_name}'")
    except Exception as e:
        print(f"Error processing PDF with Gemini: {e}")
        raise e

def query_knowledge_base(query: str, collection_name: str) -> str:
    print("\n--- DEBUGGING KNOWLEDGE BASE QUERY ---")
    if not settings.GOOGLE_API_KEY:
        print("[DEBUG] FAILURE: Google API key is missing.")
        return ""
    try:
        safe_collection_name = sanitize_collection_name(collection_name)
        print(f"[DEBUG] Attempting to query collection: '{safe_collection_name}'")

        collection = client.get_collection(name=safe_collection_name)
        print(f"[DEBUG] Successfully retrieved collection. It contains {collection.count()} documents.")
        
        query_embedding_response = genai.embed_content(
            model='models/text-embedding-004',
            content=query,
            task_type="retrieval_query"
        )
        query_embedding = query_embedding_response['embedding']
        print("[DEBUG] Successfully created embedding for the user's query.")

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=3
        )
        print(f"[DEBUG] ChromaDB query results: {results['documents']}")
        
        if not results['documents'] or not results['documents'][0]:
            print("[DEBUG] !!! FAILURE: ChromaDB returned NO documents for this query. Context will be empty.")
            return ""
        
        context = "\n".join(results['documents'][0])
        print("[DEBUG] --- SUCCESSFULLY FOUND CONTEXT ---")
        return context
    except Exception as e:
        print(f"[DEBUG] !!! CRITICAL FAILURE: An exception occurred in query_knowledge_base: {e}")
        return ""