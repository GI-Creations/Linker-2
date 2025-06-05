import os
import json
from typing import List, Dict
import hashlib
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, UnstructuredAPIFileLoader

class PDFDatabaseCreator:
    def __init__(self, dir_path: str, api_manager=None, use_unstructured: bool = False, chunk_size: int = 3500, chunk_overlap: int = 200):
        """
        Initialize the PDFDatabaseCreator.
        
        :param dir_path: Directory path containing PDF files.
        :param api_manager: API manager to fetch the Unstructured API key (optional).
        :param use_unstructured: Whether to use Unstructured API for parsing PDFs.
        :param chunk_size: Maximum size of each chunk.
        :param chunk_overlap: Overlap size between chunks.
        """
        self.dir_path = dir_path
        self.api_manager = api_manager
        self.use_unstructured = use_unstructured
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = CharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            add_start_index=True
        )

    def _load_pdf(self, file_path: str):
        """
        Load and split a single PDF file into pages using the selected loader.
        
        :param file_path: Path to the PDF file.
        :return: List of document objects.
        """
        if self.use_unstructured and self.api_manager:
            loader = UnstructuredAPIFileLoader(
                file_path,
                strategy="hi_res",
                api_key=self.api_manager.get_key('UNSTRUCTURED_API_KEY'),
                hi_res_model_name="chipper",
                mode="elements"
            )
        else:
            loader = PyPDFLoader(file_path)
        
        return loader.load_and_split()

    def _generate_uuid(self, content: str) -> str:
        """
        Generate a unique UUID for a document chunk using SHA-256 hash.
        
        :param content: The content of the chunk.
        :return: Unique UUID as a hexadecimal string.
        """
        return hashlib.sha256(content.encode()).hexdigest()

    def create_database(self) -> List[Dict]:
        """
        Create a structured database from the PDFs in the directory.
        
        :return: List of dictionaries representing the document chunks.
        """
        database_list = []
        list_dir = os.listdir(self.dir_path)
        
        for i, file_name in enumerate(list_dir, 1):
            if file_name.endswith(".pdf"):
                file_path = os.path.join(self.dir_path, file_name)
                try:
                    # Use _load_pdf to load the content of the PDF
                    pages = self._load_pdf(file_path)
                    content = "\n\n".join(page.page_content for page in pages) 
                    
                    # Generate UUID for the entire document
                    doc_uuid = self._generate_uuid(content)
                    doc_id = f"doc_{i}"

                    # Split the content into chunks
                    chunks = self.text_splitter.split_text(content)
                   
                    # Create the document entry with chunks
                    doc_entry = {
                        "doc_id": doc_id,
                        "original_uuid": doc_uuid,
                        "content": content,
                        "chunks": [
                            {
                                "chunk_id": f"{doc_id}_chunk_{chunk_idx}",
                                "original_index": chunk_idx,
                                "content": chunk
                            } for chunk_idx, chunk in enumerate(chunks)
                        ]
                    }

                    database_list.append(doc_entry)

                except Exception as e:
                    print(f"Failed to process {file_name}: {e}")
        
        return database_list

    def save_database_as_json(self, database: List[Dict]):
        """
        Save the processed database as a JSON file in the structured path derived from `self.dir_path`.
        
        :param database: The processed database list.
        """
        # Derive the base path for the processed data
        processed_base = self.dir_path.replace("/raw/", "/processed/")
        
        # Construct the save path for the JSON file
        os.makedirs(processed_base, exist_ok=True)
        save_path = os.path.join(processed_base, f"{os.path.basename(self.dir_path)}.json")
        
        with open(save_path, "w") as json_file:
            json.dump(database, json_file, indent=4)
        
        print(f"Database saved at: {save_path}")


# Usage example
# dir_path = '/home/bhanu/Desktop/firmi/FermiLLM/LLM/data/userData/raw/pebbetibhanu2017@gmail.com/BPCL'
# pdf_creator = PDFDatabaseCreator(dir_path)
# database = pdf_creator.create_database()
# pdf_creator.save_database_as_json(database)
