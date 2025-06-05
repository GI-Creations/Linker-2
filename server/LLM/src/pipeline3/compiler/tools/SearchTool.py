import os
import asyncio
from pydantic import BaseModel
from langchain_community.tools.tavily_search import TavilySearchResults
from ..base import StructuredTool


class SearchTool:
    def __init__(self, api_manager):
        # Fetch the API key using the provided api_manager
        self.api_key = api_manager.get_key("TAVILY_API_KEY")
        os.environ["TAVILY_API_KEY"] = self.api_key 

        # Instantiate the search engine with a limit on max results
        self.search_engine = TavilySearchResults(max_results=1,include_domains=["economictimes.indiatimes.com","reuters.com","business-standard.com"])

    class SearchInput(BaseModel):
        query: str

    async def search(self, query: str) -> str:
        """Perform a search based on the query asynchronously."""
        return await asyncio.to_thread(self.search_engine.invoke, {"query": query})

    def get_tool(self):
        """Method to create and return the StructuredTool"""
        search_tool = StructuredTool.from_function(
            func=self.search,
            name="search",
            description=(
                "search(entity: str) -> str:\n"
                " - Executes an exact search for the entity on Web Search Engine.\n"
                " - Returns related data from web.\n"
                " - Always include the company name or ticker name into the entity so that search data retrived from web is accurate.\n"
            ),
            args_schema=self.SearchInput,
        )
        return search_tool
