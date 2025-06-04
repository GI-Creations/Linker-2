import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ChatHistorySidebar from '../components/ChatHistorySidebar';
import WelcomeScreen from '../components/WelcomeScreen';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import { suggestions as actions } from '../data/chatData';
import { MessageCircle as BubbleIcon } from 'lucide-react';

function Chat() {
  interface ChatThread {
    id: string;
    title: string;
    lastMessage: string;
    time: string;
    messages: {
      id: string;
      text: string;
      timestamp: Date;
      isUser: boolean;
    }[];
  }

  const STORAGE_KEY = 'linker_chat_threads';
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load threads from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setThreads(JSON.parse(saved));
    }
  }, []);

  // Save threads to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads]);

  // Find current thread object
  const currentThread = useMemo(() => {
    return threads.find(t => t.id === activeThreadId) || null;
  }, [threads, activeThreadId]);

  // Handle AI response simulation
  const handleAIResponse = useCallback((threadId: string, userMessage: string) => {
    const aiResponse = 'Thank you for your message. How can I assist you further?';
    setThreads(prev => prev.map(t =>
      t.id === threadId
        ? {
          ...t,
          messages: [
            ...t.messages,
            { id: `msg-${Date.now()}`, text: aiResponse, timestamp: new Date(), isUser: false }
          ],
          lastMessage: aiResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        : t
    ));
    setLoading(false);
  }, []);

  // Start a new thread (with optional initial message)
  const handleStartThread = useCallback((action?: any) => {
    const newId = `thread-${Date.now()}`;
    const now = new Date();
    const title = action?.text ? action.text.slice(0, 24) : 'New Chat';
    const newThread = {
      id: newId,
      title,
      lastMessage: action?.text || '',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: action?.text ? [{ id: `msg-${Date.now()}`, text: action.text, timestamp: now, isUser: true }] : []
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newId);
    setInput('');

    // If starting with a message, simulate AI response
    if (action?.text) {
      setLoading(true);
      setTimeout(() => {
        handleAIResponse(newId, action.text);
      }, 800);
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [handleAIResponse]);

  // Send a message in current thread
  const handleSendMessage = useCallback(() => {
    if (!input.trim() || !currentThread) return;
    setLoading(true);
    const now = new Date();
    setThreads(prev => prev.map(t =>
      t.id === currentThread.id
        ? {
          ...t,
          messages: [
            ...t.messages,
            { id: `msg-${Date.now()}`, text: input, timestamp: now, isUser: true }
          ],
          lastMessage: input,
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        : t
    ));
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      handleAIResponse(currentThread.id, input);
    }, 800);
  }, [input, currentThread, handleAIResponse]);

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
              chatHistory={threads}
              isVisible={isSidebarVisible}
              onToggle={() => setIsSidebarVisible(false)}
              onNewChat={handleNewChat}
              onSelectChat={id => setActiveThreadId(id)}
              activeThreadId={activeThreadId}
            />
          </aside>
        ) : (
          <div className="w-12 bg-white/90 border-r border-gray-200/60 h-full flex flex-col items-center transition-all duration-300 ease-in-out relative">
            <button
              className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl shadow-md transition-all duration-200 absolute left-1/2 -translate-x-1/2 top-4"
              onClick={() => setIsSidebarVisible(true)}
              title="Expand Chat Threads"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
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
                  showMentions={false}
                  filteredMentions={[]}
                  onMentionClick={() => { }}
                  isLoading={loading}
                />
              </footer>
            </>
          ) : (
            /* Welcome Screen */
            <WelcomeScreen
              suggestions={actions}
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