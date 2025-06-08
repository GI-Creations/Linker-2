import os
import sys

# Add the src directory to Python path
src_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if src_path not in sys.path:
    sys.path.append(src_path)

from flask import Blueprint, request, jsonify, Flask
from flask_cors import CORS
from datetime import datetime
import uuid
import json
import logging
from pipeline3.LLmHandler import LLmHandler
from pipeline3.apiManager import ApiManager

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask blueprint
chat_bp = Blueprint('chat', __name__)
CORS(chat_bp)  # Enable CORS for all routes in this blueprint

# Initialize API and LLM handlers
api_manager = ApiManager()
llm_handler = LLmHandler(api_manager)

# File path for storing chat threads
CHAT_THREADS_FILE = os.path.join(os.path.dirname(__file__), 'data', 'chat_threads.json')

# Ensure data directory exists
os.makedirs(os.path.dirname(CHAT_THREADS_FILE), exist_ok=True)

def load_threads():
    """Load chat threads from JSON file"""
    if os.path.exists(CHAT_THREADS_FILE):
        with open(CHAT_THREADS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_threads(threads):
    """Save chat threads to JSON file"""
    with open(CHAT_THREADS_FILE, 'w') as f:
        json.dump(threads, f, indent=2)

@chat_bp.route('/api/chat/suggestions', methods=['GET'])
def get_suggestions():
    """Get chat suggestions based on recent threads"""
    try:
        # Get recent threads for context
        threads = load_threads()
        recent_threads = threads[:5]  # Get last 5 threads for context
        
        # Create context from recent threads
        context = "\n".join([
            f"Thread: {t['title']}\nLast message: {t['lastMessage']}"
            for t in recent_threads
        ])
        
        # Get LLM suggestions
        llm = llm_handler.get_llm('planner')
        response = llm.invoke(
            f"""Based on these recent chat threads:
            {context}
            
            Generate 4 relevant suggestions for starting a new chat. Return ONLY a JSON array with exactly 4 objects, each with 'id', 'text', and 'category' fields.
            Example format:
            [
                {{"id": "1", "text": "Start a new chat", "category": "suggested"}},
                {{"id": "2", "text": "Ask about features", "category": "suggested"}}
            ]"""
        )
        
        try:
            suggestions = json.loads(response)
            # Ensure each suggestion has a unique ID
            for suggestion in suggestions:
                if 'id' not in suggestion:
                    suggestion['id'] = str(uuid.uuid4())
            return jsonify(suggestions)
        except json.JSONDecodeError:
            # If LLM response isn't valid JSON, return fallback suggestions
            return jsonify([
                {"id": str(uuid.uuid4()), "text": "Start a new chat", "category": "suggested"},
                {"id": str(uuid.uuid4()), "text": "Ask about features", "category": "suggested"},
                {"id": str(uuid.uuid4()), "text": "Get help with something", "category": "suggested"},
                {"id": str(uuid.uuid4()), "text": "Learn more about the platform", "category": "suggested"}
            ])
    except Exception as e:
        print(f"Error generating suggestions: {str(e)}")
        return jsonify([
            {"id": str(uuid.uuid4()), "text": "Start a new chat", "category": "suggested"},
            {"id": str(uuid.uuid4()), "text": "Ask about features", "category": "suggested"},
            {"id": str(uuid.uuid4()), "text": "Get help with something", "category": "suggested"},
            {"id": str(uuid.uuid4()), "text": "Learn more about the platform", "category": "suggested"}
        ])

@chat_bp.route('/api/chat/threads', methods=['GET'])
def get_threads():
    """Get all chat threads"""
    return jsonify(load_threads())

@chat_bp.route('/api/chat/thread/<thread_id>', methods=['GET'])
def get_thread(thread_id):
    """Get a specific chat thread"""
    threads = load_threads()
    thread = next((t for t in threads if t['id'] == thread_id), None)
    if thread:
        return jsonify(thread)
    return jsonify({"error": "Thread not found"}), 404

@chat_bp.route('/api/chat/thread', methods=['POST'])
def create_thread():
    """Create a new chat thread"""
    data = request.json
    threads = load_threads()
    
    new_thread = {
        'id': str(uuid.uuid4()),
        'title': data.get('title', 'New Chat'),
        'lastMessage': data.get('initialMessage', ''),
        'time': datetime.now().strftime('%H:%M'),
        'messages': []
    }
    
    if data.get('initialMessage'):
        new_thread['messages'].append({
            'id': str(uuid.uuid4()),
            'text': data['initialMessage'],
            'timestamp': datetime.now().isoformat(),
            'isUser': True
        })
    
    threads.insert(0, new_thread)
    save_threads(threads)
    return jsonify(new_thread)

@chat_bp.route('/api/chat/message', methods=['POST'])
def send_message():
    """Send a message in a chat thread"""
    try:
        data = request.json
        logger.debug(f"Received message request: {data}")
        
        thread_id = data.get('threadId')
        message = data.get('message')
        
        if not thread_id or not message:
            logger.error("Missing threadId or message")
            return jsonify({"error": "Missing threadId or message"}), 400
        
        threads = load_threads()
        thread = next((t for t in threads if t['id'] == thread_id), None)
        
        if not thread:
            logger.error(f"Thread not found: {thread_id}")
            return jsonify({"error": "Thread not found"}), 404
        
        # Add user message
        user_message = {
            'id': str(uuid.uuid4()),
            'text': message,
            'timestamp': datetime.now().isoformat(),
            'isUser': True
        }
        thread['messages'].append(user_message)
        thread['lastMessage'] = message
        thread['time'] = datetime.now().strftime('%H:%M')
        
        # Get AI response
        try:
            # Get last 5 messages for context
            recent_messages = thread['messages'][-5:]
            context = "\n".join([
                f"{'User' if m['isUser'] else 'AI'}: {m['text']}"
                for m in recent_messages
            ])
            
            logger.debug(f"Sending context to LLM: {context}")
            
            llm = llm_handler.get_llm('joiner')
            response = llm.invoke(
                f"""Based on this conversation:
                {context}
                
                Generate a helpful response. Keep it concise and relevant."""
            )
            
            logger.debug(f"Received LLM response: {response}")
            
            ai_message = {
                'id': str(uuid.uuid4()),
                'text': response,
                'timestamp': datetime.now().isoformat(),
                'isUser': False
            }
            thread['messages'].append(ai_message)
            thread['lastMessage'] = response
        except Exception as e:
            logger.error(f"Error generating AI response: {str(e)}")
            ai_message = {
                'id': str(uuid.uuid4()),
                'text': "I apologize, but I'm having trouble generating a response right now. Please try again.",
                'timestamp': datetime.now().isoformat(),
                'isUser': False
            }
            thread['messages'].append(ai_message)
            thread['lastMessage'] = ai_message['text']
        
        save_threads(threads)
        logger.debug(f"Updated thread: {thread}")
        return jsonify(thread)
    except Exception as e:
        logger.error(f"Unexpected error in send_message: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# Initialize Flask app
app = Flask(__name__)
app.register_blueprint(chat_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000) 