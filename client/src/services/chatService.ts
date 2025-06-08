import axios from 'axios';

const isDevelopment = process.env.NODE_ENV === 'development';
const CHAT_BASE_URL = isDevelopment ? 'http://localhost:5000' : 'https://linker-2.onrender.com/';
const QUERY_BASE_URL = isDevelopment ? 'http://localhost:8000' : 'https://backend-app-6uva.onrender.com/';

const API_BASE_URL = `${CHAT_BASE_URL}/api/chat`;
const QUERY_API_URL = `${QUERY_BASE_URL}/api/v1/query`;

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  isUser: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  lastMessage: string;
  time: string;
  messages: Message[];
}

export interface Suggestion {
  id: string;
  text: string;
  category: string;
}

export interface HistoryItem {
  label: string;
  content: string;
  chatId: string;
}

class ChatService {
  private async handleResponse<T>(response: any): Promise<T> {
    if (response.data) {
      return response.data;
    }
    throw new Error('Invalid response format');
  }

  async getThreads(): Promise<ChatThread[]> {
    try {
      console.log('Fetching threads...');
      const response = await axios.get(`${API_BASE_URL}/threads`);
      console.log('Threads response:', response.data);
      return this.handleResponse<ChatThread[]>(response);
    } catch (error) {
      console.error('Error fetching threads:', error);
      return [];
    }
  }

  async getThread(threadId: string): Promise<ChatThread | null> {
    try {
      console.log('Fetching thread:', threadId);
      const response = await axios.get(`${API_BASE_URL}/thread/${threadId}`);
      console.log('Thread response:', response.data);
      return this.handleResponse<ChatThread>(response);
    } catch (error) {
      console.error('Error fetching thread:', error);
      return null;
    }
  }

  async createThread(initialMessage?: string): Promise<ChatThread | null> {
    try {
      console.log('Creating thread with message:', initialMessage);
      const response = await axios.post(`${API_BASE_URL}/thread`, {
        initialMessage,
        title: initialMessage ? initialMessage.slice(0, 24) : 'New Chat'
      });
      console.log('Create thread response:', response.data);
      return this.handleResponse<ChatThread>(response);
    } catch (error) {
      console.error('Error creating thread:', error);
      return null;
    }
  }

  async sendMessage(
    threadId: string,
    message: string,
    history: HistoryItem[] = [],
    ticker: string = 'AAPL',
    user_id: string = 'user1',
    mentioned_companies: string[] = []
  ): Promise<string | null> {
    try {
      console.log('Sending message:', { threadId, message });
      const response = await axios.post(QUERY_API_URL, {
        ticker,
        user_id,
        history,
        query: message,
        mentioned_companies,
      });
      if (response.data && response.data.result) {
        return response.data.result;
      }
      return "I apologize, but I couldn't generate a complete response. Please try rephrasing your question or breaking it into smaller parts.";
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (error.response?.data?.detail?.includes('Reached max replan limit')) {
        return "I apologize, but I need more specific information to answer your question. Could you please break it down into smaller, more focused questions?";
      }
      return "I apologize, but I'm having trouble processing your request right now. Please try again.";
    }
  }

  async getSuggestions(): Promise<Suggestion[]> {
    try {
      console.log('Fetching suggestions...');
      const response = await axios.get(`${API_BASE_URL}/suggestions`);
      console.log('Suggestions response:', response.data);
      return this.handleResponse<Suggestion[]>(response);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  }
}

export const chatService = new ChatService(); 