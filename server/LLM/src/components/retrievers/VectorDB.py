import os
import pickle
import json
import numpy as np
import cohere 
import asyncio
from typing import List, Dict, Any
from tqdm import tqdm

class VectorDB:
    def __init__(self, api_manager = None, threshold = 0.8, k = 5):
        self.api_manager = api_manager
        self.threshold = threshold
        self.k = k
        self.client = cohere.Client(api_key=api_manager.get_key('COHERE_API_KEY'))
        self.embeddings = []
        self.metadata = []
        self.query_cache = {}

    def save_data(self, dataset: List[Dict[str, Any]], save_dir: str):
        texts_to_embed = []
        metadata = []
        total_chunks = sum(len(doc['chunks']) for doc in dataset)
        
        with tqdm(total=total_chunks, desc="Processing chunks") as pbar:
            for doc in dataset:
                for chunk in doc['chunks']:
                    texts_to_embed.append(chunk['content'])
                    metadata.append({
                        'doc_id': doc['doc_id'],
                        'original_uuid': doc['original_uuid'],
                        'chunk_id': chunk['chunk_id'],
                        'original_index': chunk['original_index'],
                        'content': chunk['content']
                    })
                    pbar.update(1)

        self._embed_and_store(texts_to_embed, metadata)
        self.save_db(save_dir)
        
        print(f"Vector database loaded and saved. Total chunks processed: {len(texts_to_embed)}")

    def _embed_and_store(self, texts: List[str], data: List[Dict[str, Any]]):
        batch_size = 128
        with tqdm(total=len(texts), desc="Embedding chunks") as pbar:
            result = []
            for i in range(0, len(texts), batch_size):
                batch = texts[i : i + batch_size]
                batch_result = self.client.embed(texts=batch, model="embed-multilingual-v3.0", input_type='search_document').embeddings
                result.extend(batch_result)
                pbar.update(len(batch))
        
        self.embeddings = result
        self.metadata = data

    async def async_dot_product(self, embeddings_chunk: np.ndarray, query_embedding: np.ndarray):
        """Compute dot product for a chunk of embeddings asynchronously."""
        return np.dot(embeddings_chunk, query_embedding)

    async def ainvoke(self, query: str,  recall_chunks: int = None) -> List[Dict[str, Any]]:
        """Asynchronous search method."""
        if query in self.query_cache:
            query_embedding = self.query_cache[query]
        else:
            query_embedding = self.client.embed(texts=[query], model="embed-multilingual-v3.0", input_type="search_query").embeddings[0]
            self.query_cache[query] = query_embedding

        if not self.embeddings:
            raise ValueError("No data loaded in the vector database.")
        
        # Split embeddings into manageable chunks for parallel processing
        chunk_size = 1000  # Adjust based on your system's capabilities
        tasks = [
            self.async_dot_product(np.array(self.embeddings[i:i + chunk_size]), query_embedding)
            for i in range(0, len(self.embeddings), chunk_size)
        ]

        # Compute dot products in parallel
        chunk_similarities = await asyncio.gather(*tasks)
        
        # Concatenate results
        similarities = np.concatenate(chunk_similarities)
        
        # Sort and filter results
        top_indices = np.argsort(similarities)[::-1][:self.k if recall_chunks is None else recall_chunks]
        
        top_results = []
        for idx in top_indices:
            if float(similarities[idx]) >= self.threshold:
                result = {
                    "metadata": self.metadata[idx],
                    "similarity": float(similarities[idx]),
                }
                top_results.append(result)

        return top_results

    def save_db(self, save_dir):
        data = {
            "embeddings": self.embeddings,
            "metadata": self.metadata,
            "query_cache": json.dumps(self.query_cache),
        }
        os.makedirs(os.path.dirname(save_dir), exist_ok=True)
        with open(save_dir, "wb") as file:
            pickle.dump(data, file)

    def load_db(self, load_dir):
        if not os.path.exists(load_dir):
            raise ValueError("Vector database file not found. Use load_data to create a new database.")
        with open(load_dir, "rb") as file:
            data = pickle.load(file)
        self.embeddings = data["embeddings"]
        self.metadata = data["metadata"]
        self.query_cache = json.loads(data["query_cache"])

    def validate_embedded_chunks(self):
        unique_contents = set()
        for meta in self.metadata:
            unique_contents.add(meta['content'])
    
        print(f"Validation results:")
        print(f"Total embedded chunks: {len(self.metadata)}")
        print(f"Unique embedded contents: {len(unique_contents)}")
    
        if len(self.metadata) != len(unique_contents):
            print("Warning: There may be duplicate chunks in the embedded data.")
        else:
            print("All embedded chunks are unique.")
