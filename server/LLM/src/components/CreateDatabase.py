import os
import sys
import json
sys.path.append('../../')
from src.pipeline3.apiManager import ApiManager
from src.components.retrievers.PDFDatabaseCreator import PDFDatabaseCreator
from src.components.retrievers.VectorDB import VectorDB

def vectorize(dirPath, api_manager):
    pdf_creator = PDFDatabaseCreator(dirPath)
    database = pdf_creator.create_database()
    pdf_creator.save_database_as_json(database)


    vectorDbBase = dirPath.replace("/raw/", "/vectorDb/")
    os.makedirs(vectorDbBase, exist_ok=True)
    vectorDbPath = os.path.join(vectorDbBase, f"{os.path.basename(dirPath)}.pkl")
    
    vectorDB = VectorDB(api_manager)
    vectorDB.save_data(database, vectorDbPath)


if __name__ == "__main__":
    api_manager = ApiManager()
    dirPath = "../../data/macroData/raw/data"
    vectorize(dirPath, api_manager)
