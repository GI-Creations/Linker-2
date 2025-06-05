from typing import List, Dict, Any
from elasticsearch import AsyncElasticsearch
from elasticsearch.helpers import async_bulk
from .VectorDB import VectorDB

class ElasticsearchBM25:
    def __init__(self, k, es_host: str = "http://elasticsearch:9200"):
        self.k = k
        self.es_client = AsyncElasticsearch(es_host)
        self.current_index = None

    async def create_index(self, index_name: str):
        index_name = index_name.lower()
        index_settings = {
            "settings": {
                "analysis": {"analyzer": {"default": {"type": "english"}}},
                "similarity": {"default": {"type": "BM25"}},
                "index.queries.cache.enabled": False  # Disable query cache
            },
            "mappings": {
                "properties": {
                    "content": {"type": "text", "analyzer": "english"},
                    "doc_id": {"type": "keyword", "index": False},
                    "chunk_id": {"type": "keyword", "index": False},
                    "original_index": {"type": "integer", "index": False},
                }
            }
        }

        if not await self.es_client.indices.exists(index=index_name):
            await self.es_client.indices.create(index=index_name, body=index_settings)
            print(f"Created index: {index_name}")
        else:
            print(f"Index already exists: {index_name}")
        
        self.current_index = index_name

    async def load_index(self, index_name: str):
        """Load an existing index or create a new one if it doesn't exist."""
        index_name = index_name.lower()
        if not await self.es_client.indices.exists(index=index_name):
            await self.create_index(index_name)
        else:
            print(f"Loaded existing index: {index_name}")
        
        self.current_index = index_name

    async def index_documents(self, documents: List[Dict[str, Any]]):
        if not self.current_index:
            raise ValueError("No index selected. Use `load_index` first.")

        actions = [
            {
                "_index": self.current_index,
                "_source": {
                    "content": doc["content"],
                    "doc_id": doc["doc_id"],
                    "chunk_id": doc["chunk_id"],
                    "original_index": doc["original_index"],
                },
            }
            for doc in documents
        ]

        success, _ = await async_bulk(self.es_client, actions)
        await self.es_client.indices.refresh(index=self.current_index)
        return success

    async def ainvoke(self, query: str, recall_chunks: int = None) -> List[Dict[str, Any]]:
        if not self.current_index:
            raise ValueError("No index selected. Use `load_index` first.")

        await self.es_client.indices.refresh(index=self.current_index)  # Force refresh before each search

        search_body = {
            "query": {
                "multi_match": {
                    "query": query,
                    "fields": ["content"],
                }
            },
            "size": self.k if recall_chunks is None else recall_chunks,
        }

        response = await self.es_client.search(index=self.current_index, body=search_body)
        return [
            {
                "doc_id": hit["_source"]["doc_id"],
                "original_index": hit["_source"]["original_index"],
                "content": hit["_source"]["content"],
                "score": hit["_score"],
            }
            for hit in response["hits"]["hits"]
        ]

    async def create_elasticsearch_bm25_index(self, db: VectorDB, index_name: str):
        """Create a BM25 index and populate it with data from VectorDB."""
        index_name = index_name.lower()
        await self.load_index(index_name)
        await self.index_documents(db.metadata)

    async def close(self):
        """Close the Elasticsearch client connection."""
        await self.es_client.close()