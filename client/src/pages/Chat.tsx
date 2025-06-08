import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ChatHistorySidebar from '../components/ChatHistorySidebar';
import WelcomeScreen from '../components/WelcomeScreen';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import { MessageCircle as BubbleIcon } from 'lucide-react';
import { chatService, ChatThread, Message, Suggestion } from '../services/chatService';

// Utility to ensure all messages are Message objects
function normalizeMessages(messages: any[]): Message[] {
  return messages
    .filter(m => typeof m === 'object' && m !== null && 'text' in m)
    .map(m => ({
      id: String(m.id),
      text: String(m.text),
      timestamp: String(m.timestamp),
      isUser: Boolean(m.isUser)
    }));
}

function Chat() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load threads and suggestions from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedThreads, fetchedSuggestions] = await Promise.all([
          chatService.getThreads(),
          chatService.getSuggestions()
        ]);
        setThreads(fetchedThreads);
        setSuggestions(fetchedSuggestions);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to empty data if API fails
        setThreads([]);
        setSuggestions([]);
      }
    };
    loadData();
  }, []);

  // Find current thread object
  const currentThread = useMemo(() => {
    return threads.find(t => t.id === activeThreadId) || null;
  }, [threads, activeThreadId]);

  // Handle AI response
  const handleAIResponse = useCallback(async (threadId: string, userMessage: string) => {
    try {
      const response = await chatService.sendMessage(threadId, userMessage);
      setThreads(prev => prev.map(t =>
        t.id === threadId
          ? {
            ...t,
            messages: normalizeMessages([...t.messages, {
              id: `msg-${Date.now()}-ai`,
              text: response || "Sorry, I couldn't generate a response.",
              timestamp: new Date().toISOString(),
              isUser: false
            }]),
            lastMessage: response || "Sorry, I couldn't generate a response.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
          : t
      ));
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  }, []);

  // Start a new thread
  const handleStartThread = useCallback(async (action?: any) => {
    try {
      setLoading(true);
      const newThread = await chatService.createThread(action?.text);
      setThreads(prev => [newThread, ...prev]);
      setActiveThreadId(newThread.id);
      setInput('');

      if (action?.text) {
        await handleAIResponse(newThread.id, action.text);
      }

      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      console.error('Error creating thread:', error);
      setLoading(false);
    }
  }, [handleAIResponse]);

  // Send a message in current thread
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !currentThread) return;
    setLoading(true);
    const now = new Date();
    // Add user message to UI
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text: input,
      timestamp: now.toISOString(),
      isUser: true
    };
    setThreads(prev => prev.map(t =>
      t.id === currentThread.id
        ? {
            ...t,
            messages: normalizeMessages([...t.messages, userMessage]),
            lastMessage: input,
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        : t
    ));
    setInput('');
    try {
      // Build history array from currentThread.messages
      const history = currentThread.messages
        .filter((m): m is Message => typeof m === 'object' && m !== null && 'text' in m)
        .map(m => ({
          label: m.isUser ? 'user' : 'ai',
          content: m.text,
          chatId: currentThread.id
        }));
      // Call the API with the full request body
      const aiResponse = await chatService.sendMessage(
        currentThread.id,
        input,
        history,
        'AAPL',
        'user1',
        []
      );
      // Always add the AI response as a message, whether it's a success or error message
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        text: aiResponse || "I apologize, but I'm having trouble generating a response right now. Please try again.",
        timestamp: new Date().toISOString(),
        isUser: false
      };
      setThreads(prev => prev.map(t =>
        t.id === currentThread.id
          ? {
              ...t,
              messages: normalizeMessages([...t.messages, aiMessage]),
              lastMessage: aiMessage.text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          : t
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to the chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "I apologize, but I'm having trouble connecting to the server. Please check your connection and try again.",
        timestamp: new Date().toISOString(),
        isUser: false
      };
      setThreads(prev => prev.map(t =>
        t.id === currentThread.id
          ? {
              ...t,
              messages: normalizeMessages([...t.messages, errorMessage]),
              lastMessage: errorMessage.text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          : t
      ));
    } finally {
      setLoading(false);
    }
  }, [input, currentThread]);

  // Reset to welcome screen
  const handleNewChat = useCallback(() => {
    setActiveThreadId(null);
    setInput('');
  }, []);

  return (
    <section className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="flex-1 flex overflow-hidden">
        {/* Chat History Sidebar */}
        {isSidebarVisible ? (
          <aside className="w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200/60 flex flex-col transition-all duration-300 ease-in-out">
            <ChatHistorySidebar
              threads={threads}
              isVisible={isSidebarVisible}
              onToggle={() => setIsSidebarVisible(false)}
              onNewChat={handleNewChat}
              onSelectChat={(id) => setActiveThreadId(id)}
              activeThreadId={activeThreadId || ''}
            />
          </aside>
        ) : (
          <button
            onClick={() => setIsSidebarVisible(true)}
            className="fixed top-4 left-20 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            <BubbleIcon className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Main Chat Area */}
        <section className="flex-1 flex flex-col bg-white/50 backdrop-blur-sm">
          {currentThread ? (
            <>
              {/* Chat Header */}
              <header className="p-4 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                    <BubbleIcon className="w-4 h-4 text-[#1677FF]" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">{currentThread.title}</span>
                    <span className="block text-sm text-gray-500">Active thread</span>
                  </div>
                </div>
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-br from-gray-50/50 to-white/50">
                {currentThread.messages.map(msg => (
                  <ChatMessage
                    key={msg.id}
                    id={msg.id}
                    text={msg.text}
                    timestamp={new Date(msg.timestamp)}
                    isUser={msg.isUser}
                  />
                ))}
                {loading && (
                  <div className="flex items-center gap-3 text-gray-500 bg-white/80 p-3 rounded-xl border border-gray-200/60 shadow-sm max-w-md">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                    <span className="text-sm font-medium">AI is thinking...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <footer className="border-t border-gray-200/60 bg-white/80 backdrop-blur-sm">
                <ChatInput
                  message={input}
                  onMessageChange={e => setInput(e.target.value)}
                  onSendMessage={handleSendMessage}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  isLoading={loading}
                />
              </footer>
            </>
          ) : (
            /* Welcome Screen */
            <WelcomeScreen
              suggestions={suggestions}
              onSuggestionClick={handleStartThread}
              onUserMessage={msg => handleStartThread({ text: msg })}
            />
          )}
        </section>
      </div>
    </section>
  );
}

export default Chat;