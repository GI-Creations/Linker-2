import uvicorn
from typing import List, Optional, Dict, Any
import os
import sys
import glob
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Depends, Request, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from datetime import datetime, timezone
import asyncio
import aiofiles
from typing import List, Optional, Dict, Any

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.pipeline3.chain_run import QAGraph
from src.pipeline3.apiManager import ApiManager
from src.components.CreateDatabase import vectorize

# Create a FastAPI instance
app = FastAPI()
api_manager = ApiManager()

# Store active WebSocket connections
active_connections: Dict[str, WebSocket] = {}

class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}

    def setClientId(self, client_id: str):
        self.client_id = client_id

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.connections:
            del self.connections[client_id]

    async def send_message(self, message: str):
        websocket = self.connections.get(self.client_id)
        if websocket:
            await websocket.send_text(message)

    async def broadcast(self, message: str):
        for websocket in self.connections.values():
            await websocket.send_text(message)

manager = ConnectionManager()

# Database setup
DATABASE_URL = "sqlite:///./chats.db"
FILE_DIR = Path("../data/userData/raw")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class FileInfo:
    def __init__(self, path: Path):
        stats = path.stat()
        self.name = path.name
        self.size = stats.st_size
        self.modified = datetime.fromtimestamp(stats.st_mtime)
        self.type = path.suffix
        self.path = str(path)

# Define Pydantic models for input validation
class TickerRequest(BaseModel):
    ticker: str
    user_id: str


class ChatHistory(BaseModel):
    label: str
    content: str
    chatId: str


class QueryRequest(BaseModel):
    ticker: str
    user_id: str
    history: List[ChatHistory]
    query: str
    mentioned_companies: List[str]


class Chat(Base):
    __tablename__ = "chats"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    query = Column(Text)
    result = Column(Text)
    ticker = Column(String)
    timestamp = Column(DateTime, default=datetime.now(timezone.utc))


class ChatCreate(BaseModel):
    ticker: str
    user_id: str
    query: str
    result: str
    timestamp: datetime = datetime.now(timezone.utc)


class Ticker(Base):
    __tablename__ = "tickers"
    ticker = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)


# Function to create database tables
def create_tables():
    Base.metadata.create_all(bind=engine)


# Call this function at the start of your application
create_tables()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://linker-2-smoky.vercel.app",  # Vercel frontend
        "https://linker-2.vercel.app"  # Alternative Vercel domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Asynchronously save the uploaded file to disk
async def save_file(file: UploadFile, file_path: str):
    """Saves the uploaded file asynchronously to the given file path."""
    async with aiofiles.open(file_path, "wb") as buffer:
        content = await file.read()
        await buffer.write(content)

@app.websocket("/api/v1/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(client_id)

# Root endpoint for health check
@app.get("/api/v1/")
async def health():
    """
    Health check endpoint to verify the service status.
    Returns:
        dict: A message indicating the service is ready.
    """
    return {"result": "Service is ready to run"}

static_dir = os.path.abspath("../static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory="../static"), name="static")


# Endpoint to process a query using the QA chain
@app.post("/api/v1/query")
async def process_query(request: QueryRequest):
    """
    Processes a query using the QA chain based on the user's request.

    Args:
        request (QueryRequest): Contains the ticker, user ID, query, and chat history.

    Returns:
        dict: The result of the QA chain query.
    """
    try:
        manager.setClientId(request.user_id)
        qa_chain = QAGraph(
            ticker_name=request.ticker,
            other_mentioned_ticker_names=request.mentioned_companies,
            user_id=request.user_id,
            memory=request.history,
            api_manager=api_manager,
            message_manager=manager,
            verbose=True,
        )
        result = await qa_chain.run(request.query)
        return {"result": result}
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        print(error_msg)  # This will show in Docker logs
        raise HTTPException(status_code=500, detail=str(error_msg)) from e

# Frontend-friendly task model
class TaskResponse(BaseModel):
    idx: int
    name: str
    tool_name: str  # Instead of the actual tool callable
    args: List[Any]  # Simplified args
    dependencies: List[int]
    thought: Optional[str]
    observation: Optional[str]
    is_join: bool
    status: str  # Add status to track execution state

def convert_task_to_response(task) -> TaskResponse:
    """Convert a Task object to a frontend-friendly TaskResponse"""
    return TaskResponse(
        idx=task.idx,
        name=task.name,
        tool_name=task.tool.__name__,  # Get the name of the tool function
        args=[str(arg) for arg in task.args],  # Convert args to strings
        dependencies=list(task.dependencies),
        thought=task.thought,
        observation=task.observation,
        is_join=task.is_join,
        status="pending"
    )

def convert_tasks_to_response(tasks: Dict[int, Any]) -> List[TaskResponse]:
    """Convert a dictionary of Task objects to a list of TaskResponse objects"""
    return [convert_task_to_response(task) for task in tasks.values()]

@app.post("/api/v1/getTasks")
async def get_tasks(request: QueryRequest):
    try:
        manager.setClientId(request.user_id)
        qa_chain = QAGraph(
            ticker_name=request.ticker,
            other_mentioned_ticker_names=request.mentioned_companies,
            user_id=request.user_id,
            memory=request.history,
            api_manager=api_manager,
            message_manager=manager,
            verbose=True,
        )
        tasks = await qa_chain.get_tasks(request.query)
        return {"result": convert_tasks_to_response(tasks)}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e)) from e

# Endpoint to upload files and vectorize them
@app.post("/api/v1/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    folder: str = Form(...),
    userId: str = Form(...),
):
    """
    Uploads and saves files for a specific user and folder, then vectorizes the files.

    Args:
        files (List[UploadFile]): List of files to upload.
        folder (str): Folder name where the files will be saved.
        userId (str): User ID associated with the files.

    Returns:
        dict: A success message after the files are uploaded.
    """
    os.makedirs(f"../data/userData/raw/{userId}/{folder}", exist_ok=True)
    tasks = []

    for file in files:
        file_path = f"../data/userData/raw/{userId}/{folder}/{file.filename}"
        tasks.append(save_file(file, file_path))

    await asyncio.gather(*tasks)
    vectorize(f"../data/userData/raw/{userId}/{folder}", api_manager)

    return {"message": "Files uploaded successfully"}


@app.get("/api/v1/files")
async def list_files(user_id: str = None, ticker: str = None) -> List[dict]:
    """
    List all files in the directory with their metadata.
    Optionally filter by user_id and ticker.
    """
    try:
        base_dir = FILE_DIR
        
        # If user_id is provided, append it to path
        if user_id:
            base_dir = base_dir / user_id
            # If ticker is provided, append it to path
            if ticker:
                base_dir = base_dir / ticker

        print(f"Searching in directory: {base_dir}")  # Debug print

        files = []
        # Handle case where directory doesn't exist
        if not base_dir.exists():
            return files

        # Recursively get all files if no filters provided
        pattern = "**/*" if not (user_id and ticker) else "*"
        
        for file_path in base_dir.glob(pattern):
            if file_path.is_file():
                file_info = FileInfo(file_path)
                relative_path = file_path.relative_to(FILE_DIR)
                files.append({
                    "name": file_info.name,
                    "size": file_info.size,
                    "modified": file_info.modified.isoformat(),
                    "type": file_info.type,
                    "path": str(relative_path),
                    "user_id": relative_path.parts[0] if len(relative_path.parts) > 0 else None,
                    "ticker": relative_path.parts[1] if len(relative_path.parts) > 1 else None
                })
        return files
    except Exception as e:
        print(f"Error: {str(e)}")  # Debug print
        raise HTTPException(status_code=500, detail=str(e))

# Add endpoint to get files for specific user/ticker combination
@app.get("/api/v1/files/{user_id}/{ticker}")
async def get_ticker_files(user_id: str, ticker: str):
    """
    Get files for a specific user and ticker combination
    """
    return await list_files(user_id=user_id, ticker=ticker)

@app.get("/api/v1/files/{filepath:path}")
async def download_file(filepath: str):
    """
    Download a specific file using its full path
    Example: /api/v1/files/user@email.com/TICKER/file.pdf
    """
    file_path = FILE_DIR / filepath
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Security check to prevent directory traversal
    try:
        file_path.relative_to(FILE_DIR)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/octet-stream"
    )


# Endpoint to save chat history in the database
@app.post("/api/v1/save_chat")
async def save_chat(chat: ChatCreate, db: Session = Depends(get_db)):
    """
    Saves chat history to the database.

    Args:
        chat (ChatCreate): The chat data to save.
        db (Session): Database session.

    Returns:
        dict: A message indicating the chat was saved successfully.
    """
    try:
        db_chat = Chat(
            user_id=chat.user_id,
            ticker=chat.ticker,
            query=chat.query,
            result=chat.result,
            timestamp=chat.timestamp,
        )
        db.add(db_chat)
        db.commit()
        db.refresh(db_chat)
        return {"message": "Chat saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


# Endpoint to get chat history for a specific user and/or ticker
@app.get("/api/v1/chats")
async def get_chats(
    user_id: str = None, ticker: Optional[str] = None, db: Session = Depends(get_db)
):
    """
    Retrieves chat history from the database based on user ID and/or ticker.

    Args:
        user_id (str, optional): The user ID to filter chats.
        ticker (str, optional): The ticker symbol to filter chats.
        db (Session): Database session.

    Returns:
        dict: The list of chats that match the filter.
    """
    try:
        query = db.query(Chat)

        if user_id is not None:
            query = query.filter(Chat.user_id == user_id)
        if ticker is not None:
            query = query.filter(Chat.ticker == ticker)

        chats = query.order_by(Chat.timestamp).all()

        if not chats:
            return {"chats": []}

        serialized_chats = [
            {
                "user_id": chat.user_id,
                "ticker": chat.ticker,
                "query": chat.query,
                "result": chat.result,
                "timestamp": chat.timestamp,
            }
            for chat in chats
        ]

        return {"chats": serialized_chats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


# Endpoint to get tickers associated with a user
@app.get("/api/v1/tickers/{user_id}")
async def get_tickers(user_id: str, db: Session = Depends(get_db)):
    """
    Retrieves the list of tickers associated with a specific user.

    Args:
        user_id (str): The user ID.
        db (Session): Database session.

    Returns:
        dict: The list of tickers for the user.
    """
    try:
        tickers = db.query(Ticker).filter(Ticker.user_id == user_id).all()
        return {"tickers": [ticker.ticker for ticker in tickers]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


# Endpoint to save a new ticker for a user
@app.post("/api/v1/save_ticker")
async def save_ticker(request: TickerRequest, db: Session = Depends(get_db)):
    """
    Saves a ticker for a specific user.

    Args:
        request (TickerRequest): The ticker and user ID to save.
        db (Session): Database session.

    Returns:
        dict: A message indicating the ticker was saved.
    """
    try:
        db_ticker = Ticker(ticker=request.ticker, user_id=request.user_id)
        db.add(db_ticker)
        db.commit()
        db.refresh(db_ticker)
        return {"message": "Ticker saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


# Endpoint to delete a ticker and its associated chats
@app.delete("/api/v1/delete_ticker")
async def delete_ticker(request: TickerRequest, db: Session = Depends(get_db)):
    """
    Deletes a specific ticker and its associated chats for a user.

    Args:
        request (TickerRequest): The ticker and user ID to delete.
        db (Session): Database session.

    Returns:
        dict: A message indicating the ticker and chats were deleted.
    """
    try:
        db.query(Ticker).filter(
            Ticker.ticker == request.ticker, Ticker.user_id == request.user_id
        ).delete()
        db.commit()

        db.query(Chat).filter(
            Chat.ticker == request.ticker, Chat.user_id == request.user_id
        ).delete()
        db.commit()

        return {"message": "Ticker and associated chats deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


# Endpoint to delete all tickers and chats for a user
@app.delete("/api/v1/delete_tickers/{user_id}")
async def delete_tickers(user_id: str, db: Session = Depends(get_db)):
    """
    Deletes all tickers and associated chats for a specific user.

    Args:
        user_id (str): The user ID.
        db (Session): Database session.

    Returns:
        dict: A message indicating all tickers and chats were deleted.
    """
    try:
        db.query(Ticker).filter(Ticker.user_id == user_id).delete()
        db.commit()

        db.query(Chat).filter(Chat.user_id == user_id).delete()
        db.commit()

        return {"message": "Tickers and chats deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

templates = Jinja2Templates(directory="templates")

# Paths to the JSON files
workflow_json_path = Path("../src/pipeline3/workflow-config.json")
llm_json_path = Path("../src/pipeline3/llm-config.json")
llm_options_file_path = Path("../src/pipeline3/llm-options.json")

# Load workflow data
def load_json(file_path: Path) -> Dict[str, Any]:
    with open(file_path, "r") as f:
        return json.load(f)

# Save updated data to the JSON file
def save_json(file_path: Path, data: Dict[str, Any]):
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)

# Load LLM options from llm-options.json
def load_llm_options() -> Dict[str, Any]:
    with open(llm_options_file_path, "r") as f:
        return json.load(f)

# Serve the webpage
@app.get("/api/v1/configurations")
async def get_form(request: Request):
    # Load the current values from the JSON file
    data = load_json(workflow_json_path)
    llm_data = load_json(llm_json_path)
    llm_options = load_llm_options()
    
    return templates.TemplateResponse("index.html", {
        "request": request,
        "data": data,
        "llm_data": llm_data,
        "llm_options": llm_options
    })

# Endpoint to update general configuration
@app.post("/api/v1/update_general")
async def update_general_values(request: Request):
    data = load_json(workflow_json_path)
    form_data = await request.form()
    for key, config in data.items():
        # Check if the key is in the form data
        if key in form_data:
            value = form_data.get(key)
            # Update the value based on the type specified in the config
            if config['type'] == 'switch':
                config['value'] = value == "on"  # Switch is a boolean
            elif config['type'] == 'slider':
                # Convert the value to float if it's a slider
                config['value'] = float(value)
            elif config['type'] == 'number':
                # Convert the value to float if it's a number
                config['value'] = int(float(value))
            elif config['type'] == 'dropdown':
                config['value'] = str(value)
            else:
                config['value'] = value  # Default case for text
        else:
            # If the key is not present in form data, it means the switch is off
            if config['type'] == 'switch':
                config['value'] = False  # Set to False if unchecked
            
    # Save the updated data to the JSON file
    save_json(workflow_json_path, data)

    # Redirect back to the homepage
    return RedirectResponse("/api/v1/configurations", status_code=303)

# Endpoint to update LLM configuration
@app.post("/api/v1/update_llm")
async def update_llm_values(request: Request):
    llm_data = load_json(llm_json_path)
    llm_options = load_llm_options()
    form_data = await request.form()

    for agent in ['planner', 'joiner', 'pandas_agent']:
        selected_llm = form_data.get(f"{agent}_llm")
        selected_model = form_data.get(f"{agent}_model")
        temperature_value = float(form_data.get(f"{agent}_temperature", 0))

        llm_data[agent]['llm'] = selected_llm
        llm_data[agent]['model'] = selected_model
        llm_data[agent]['temperature'] = temperature_value

        # Set the API key based on selected LLM
        if selected_llm in llm_options:
            llm_data[agent]['api_key_name'] = llm_options[selected_llm]['api_key_name']
            if selected_llm == "AzureChatOpenAI":
                llm_data[agent]['openai_api_version'] = llm_options[selected_llm]['openai_api_version']
                llm_data[agent]['openai_api_base'] = llm_options[selected_llm]['openai_api_base']
                llm_data[agent]['openai_api_type'] = llm_options[selected_llm]['openai_api_type']
                llm_data[agent]['deployment_name'] = llm_options[selected_llm]['deployment_name']

    # Save the updated data to the JSON file
    save_json(llm_json_path, llm_data)

    # Redirect back to the homepage
    return RedirectResponse("/api/v1/configurations", status_code=303)

@app.get("/api/v1/logviewer", response_class=HTMLResponse)
async def log_viewer_page(request: Request):
    """
    Renders the log viewer page with logs
    """
    logs = []
    LOG_DIR = os.path.abspath(os.path.join(os.getcwd(), "..", "logs"))

    # Fetch logs and filter them based on query parameters
    for log_file in glob.glob(f"{LOG_DIR}/*.json"):
        with open(log_file, 'r') as file:
            log = json.load(file)
            logs.append({
                    "timestamp": log.get("timestamp"),
                    "user_id": log.get("user_id"),
                    "chat_profile": log.get("chat_profile"),
                    "link": f"/api/v1/log/{os.path.basename(log_file)}"
                })
    sorted_logs = sorted(logs, key=lambda x: x["timestamp"], reverse=True)
    # Render the log viewer page with the logs
    return templates.TemplateResponse("logviewer.html", {"request": request, "logs": sorted_logs})


@app.get("/api/v1/logs")
async def get_logs(
    user_id: str = Query(None),
    chat_profile: str = Query(None),
    start_time: str = Query(None),
    end_time: str = Query(None)
):
    """
    Filters and retrieves logs based on the query parameters.
    """
    logs = []
    LOG_DIR = os.path.abspath(os.path.join(os.getcwd(), "..", "logs"))
    try:
        for log_file in glob.glob(f"{LOG_DIR}/*.json"):
            with open(log_file, 'r') as file:
                log = json.load(file)
                if (user_id is None or log["user_id"] == user_id) and \
                   (chat_profile is None or log["chat_profile"] == chat_profile) and \
                   (start_time is None or log["timestamp"] >= start_time) and \
                   (end_time is None or log["timestamp"] <= end_time):
                    logs.append({
                        "timestamp": log["timestamp"],
                        "user_id": log["user_id"],
                        "chat_profile": log["chat_profile"],
                        "link": f"/api/v1/log/{os.path.basename(log_file)}"
                    })
    except Exception as e:
        return {"error": str(e)}
    sorted_logs = sorted(logs, key=lambda x: x["timestamp"], reverse=True)
    return sorted_logs

@app.get("/api/v1/log/{log_file}", response_class=HTMLResponse)
async def get_log_details(request: Request, log_file: str):
    """
    Renders details of a specific log file.
    """
    LOG_DIR = os.path.abspath(os.path.join(os.getcwd(), "..", "logs"))
    file_path = os.path.join(LOG_DIR, log_file)
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            log_data = json.load(file)
        return templates.TemplateResponse(
            "logdetails.html",
            {"request": request, "log_data": log_data}
        ) 
    return templates.TemplateResponse(
        "error.html",
        {"request": request, "message": "Log file not found."}
    )   
 
# Run the API with Uvicorn
if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[
            project_root,
        ],
        reload_includes=["*.py", "*/llm-config.json", "*/workflow-config.json"]
    )
