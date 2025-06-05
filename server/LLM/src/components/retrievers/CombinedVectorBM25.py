from .ElasticsearchBM25 import ElasticsearchBM25
from .VectorDB import VectorDB
from typing import List, Dict, Any
import os
import asyncio

class CombinedVectorBM25:
    def __init__(self, api_manager=None, threshold=0.8, k=5, semantic_weight: float = 0.8):
        """
        Combines VectorDB and ElasticsearchBM25 for hybrid search.
        
        Args:
            api_manager: API manager for the vector database.
            threshold (float): Similarity threshold for vector search.
            k (int): Number of results to retrieve from each method.
            semantic_weight (float): Weight for semantic search results.
        """
        self.api_manager = api_manager
        self.threshold = threshold
        self.k = k
        self.semantic_weight = semantic_weight
        self.bm25_weight = 1 - self.semantic_weight
        self.vectordb = VectorDB(self.api_manager, self.threshold, self.k)
        self.bm25db = ElasticsearchBM25(self.k)

    async def load_db(self, load_dir):
        """
        Load databases for VectorDB and BM25.
        
        Args:
            load_dir (str): Directory path to load the databases from.
        """
        self.vectordb.load_db(load_dir)
        await self.bm25db.create_elasticsearch_bm25_index(self.vectordb, os.path.basename(os.path.dirname(load_dir)))

    async def _fetch_semantic_results(self, query: str, recall_chunks: int):
        """Fetch semantic results if semantic weight > 0."""
        return await self.vectordb.ainvoke(query, recall_chunks=recall_chunks)

    async def _fetch_bm25_results(self, query: str, recall_chunks: int):
        """Fetch BM25 results if BM25 weight > 0."""
        return await self.bm25db.ainvoke(query, recall_chunks=recall_chunks)

    async def ainvoke(self, query: str, k: int = 20, recall_chunks: int = 150) -> List[Dict[str, Any]]:
        """
        Perform a combined search using both VectorDB and BM25.

        Args:
            query (str): Search query.
            k (int): Number of top results to return.
            recall_chunks (int): Number of chunks to recall from each method for scoring.

        Returns:
            List[Dict[str, Any]]: Combined search results with scores.
        """
        semantic_results, bm25_results = [], []
        tasks = []

        # Add tasks for semantic and BM25 search based on weights
        if self.semantic_weight > 0:
            tasks.append(self._fetch_semantic_results(query, recall_chunks))
        if self.bm25_weight > 0:
            tasks.append(self._fetch_bm25_results(query, recall_chunks))

        # Execute tasks concurrently
        results = await asyncio.gather(*tasks)

        if self.semantic_weight > 0:
            semantic_results = results[0]
        if self.bm25_weight > 0:
            bm25_results = results[-1]

        # Prepare combined results
        semantic_chunk_ids = [
            (result["metadata"]["doc_id"], result["metadata"]["original_index"]) for result in semantic_results
        ] if semantic_results else []

        bm25_chunk_ids = [
            (result["doc_id"], result["original_index"]) for result in bm25_results
        ] if bm25_results else []

        all_chunk_ids = set(semantic_chunk_ids + bm25_chunk_ids)
        chunk_scores = {}

        # Compute scores
        for chunk_id in all_chunk_ids:
            score = 0
            if chunk_id in semantic_chunk_ids:
                index = semantic_chunk_ids.index(chunk_id)
                score += self.semantic_weight * (1 / (index + 1))
            if chunk_id in bm25_chunk_ids:
                index = bm25_chunk_ids.index(chunk_id)
                score += self.bm25_weight * (1 / (index + 1))
            chunk_scores[chunk_id] = score

        # Sort combined results by score
        sorted_chunk_ids = sorted(chunk_scores.keys(), key=lambda x: chunk_scores[x], reverse=True)

        # Prepare final results
        final_results = []
        for chunk_id in sorted_chunk_ids[:k]:
            # Retrieve metadata from either database
            chunk_metadata = next(
                (meta for meta in semantic_results if meta["metadata"]["doc_id"] == chunk_id[0] and meta["metadata"]["original_index"] == chunk_id[1]),
                None
            )
            if chunk_metadata is None and bm25_results:
                chunk_metadata = next(
                    (meta for meta in bm25_results if meta["doc_id"] == chunk_id[0] and meta["original_index"] == chunk_id[1]),
                    None
                )
            final_results.append({
                "chunk": chunk_metadata,
                "score": chunk_scores[chunk_id],
                "from_semantic": chunk_id in semantic_chunk_ids,
                "from_bm25": chunk_id in bm25_chunk_ids,
            })

        return final_results
