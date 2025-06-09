import axios from 'axios';
import { suggestions } from '../data/chatData';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL + '/api/v1' || 'http://localhost:8000/api/v1';

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
  ticker: string;
  user_id: string;
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

export interface ChatResponse {
  user_id: string;
  ticker: string;
  query: string;
  result: string;
  timestamp: string;
}

class ChatService {
  private async handleResponse<T>(response: any): Promise<T> {
    if (response.data) {
      return response.data;
    }
    throw new Error('Invalid response format');
  }

  async getThreads(user_id: string = 'user1'): Promise<ChatThread[]> {
    try {
      console.log('Fetching chat history...');
      const response = await axios.get(`${API_BASE_URL}/chats`, {
        params: { user_id }
      });
      console.log('Chat history response:', response.data);
      
      // Convert chat history to threads format
      const chats = response.data.chats || [];
      const threads: ChatThread[] = [];
      const threadMap = new Map<string, ChatThread>();

      chats.forEach((chat: ChatResponse) => {
        if (!threadMap.has(chat.ticker)) {
          threadMap.set(chat.ticker, {
            id: chat.ticker,
            title: chat.ticker,
            lastMessage: chat.result,
            time: new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            messages: [],
            ticker: chat.ticker,
            user_id: chat.user_id
          });
        }
        const thread = threadMap.get(chat.ticker)!;
        thread.messages.push(
          {
            id: `user-${chat.timestamp}`,
            text: chat.query,
            timestamp: chat.timestamp,
            isUser: true
          },
          {
            id: `ai-${chat.timestamp}`,
            text: chat.result,
            timestamp: chat.timestamp,
            isUser: false
          }
        );
      });

      return Array.from(threadMap.values());
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  }

  async getThread(threadId: string, user_id: string = 'user1'): Promise<ChatThread | null> {
    try {
      console.log('Fetching thread:', threadId);
      const response = await axios.get(`${API_BASE_URL}/chats`, {
        params: { user_id, ticker: threadId }
      });
      console.log('Thread response:', response.data);
      
      const chats = response.data.chats || [];
      if (chats.length === 0) return null;

      const messages: Message[] = [];
      chats.forEach((chat: ChatResponse) => {
        messages.push(
          {
            id: `user-${chat.timestamp}`,
            text: chat.query,
            timestamp: chat.timestamp,
            isUser: true
          },
          {
            id: `ai-${chat.timestamp}`,
            text: chat.result,
            timestamp: chat.timestamp,
            isUser: false
          }
        );
      });

      return {
        id: threadId,
        title: threadId,
        lastMessage: messages[messages.length - 1].text,
        time: new Date(messages[messages.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages,
        ticker: threadId,
        user_id
      };
    } catch (error) {
      console.error('Error fetching thread:', error);
      return null;
    }
  }

  async createThread(ticker: string = 'AAPL', user_id: string = 'user1'): Promise<ChatThread> {
    return {
      id: ticker,
      title: ticker,
      lastMessage: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: [],
      ticker,
      user_id
    };
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
      const response = await axios.post(`${API_BASE_URL}/query`, {
        ticker,
        user_id,
        history,
        query: message,
        mentioned_companies,
      });

      // Save the chat to history
      await axios.post(`${API_BASE_URL}/save_chat`, {
        ticker,
        user_id,
        query: message,
        result: response.data.result,
        timestamp: new Date().toISOString()
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
    // Return suggestions from chatData.ts
    return suggestions;
  }
}

export const chatService = new ChatService(); 