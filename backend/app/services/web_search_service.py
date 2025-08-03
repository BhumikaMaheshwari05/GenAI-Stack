# backend/app/services/web_search_service.py
from serpapi import GoogleSearch
from ..core.config import settings

def perform_search(query: str) -> str:
    """
    Performs a Google search using SerpAPI and returns formatted results.
    """
    if not settings.SERPAPI_API_KEY:
        return "Error: SERPAPI_API_KEY is not set."

    params = {
        "api_key": settings.SERPAPI_API_KEY,
        "engine": "google",
        "q": query,
    }

    try:
        search = GoogleSearch(params)
        results = search.get_dict()

        # Format the top results into a readable string
        output = ""
        if "organic_results" in results:
            for result in results["organic_results"][:3]: # Get top 3 results
                output += f"Title: {result.get('title', 'N/A')}\n"
                output += f"Snippet: {result.get('snippet', 'N/A')}\n\n"

        return output if output else "No web search results found."
    except Exception as e:
        print(f"SerpAPI Error: {e}")
        return f"Error performing web search: {e}"