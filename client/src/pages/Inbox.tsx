import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Search as Magnifier, Plus as NewIcon, MessageCircle as BubbleIcon } from 'lucide-react';
import { Input as SearchBox } from '@/components/ui/input';
import { Button as IconBtn } from '@/components/ui/Button';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import WelcomeScreen from '@/components/WelcomeScreen';
import Sidebar from '@/components/Sidebar';
import { chatService, ChatThread, Suggestion } from '../services/chatService';

function Dial() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
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
        setThreads([]);
        setSuggestions([]);
      }
    };
    loadData();
  }, []);

  // Handle pending chat query from global new chat
  useEffect(() => {
    const pending = window.localStorage.getItem('pendingChatQuery');
    if (pending) {
      window.localStorage.removeItem('pendingChatQuery');
      handleStartThread({ text: pending });
    }
  }, []);

  // Find current thread object
  const currentThread = useMemo(() => {
    return threads.find(t => t.id === activeThreadId) || null;
  }, [threads, activeThreadId]);

  // Filter threads by search
  const filteredThreads = useMemo(() => {
    if (!query.trim()) return threads;
    const q = query.toLowerCase();
    return threads.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.lastMessage.toLowerCase().includes(q)
    );
  }, [threads, query]);

  // Start a new thread (with optional initial message)
  const handleStartThread = useCallback(async (action?: any) => {
    setLoading(true);
    try {
      const newThread = await chatService.createThread(action?.text);
      if (newThread) {
        setThreads(prev => [newThread, ...prev]);
        setActiveThreadId(newThread.id);
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (error) {
      console.error('Error creating thread:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message in current thread
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !currentThread) return;
    setLoading(true);
    
    // Add user message immediately
    const userMessage = {
      id: `msg-${Date.now()}`,
      text: input,
      timestamp: new Date().toISOString(),
      isUser: true
    };
    
    setThreads(prev => prev.map(t =>
      t.id === currentThread.id 
        ? {
            ...t,
            messages: [...t.messages, userMessage],
            lastMessage: input,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        : t
    ));
    
    const currentInput = input;
    setInput('');
    
    try {
      const response = await chatService.sendMessage(
        currentThread.id,
        currentInput,
        currentThread.messages.map(m => ({
          label: m.isUser ? 'user' : 'ai',
          content: m.text,
          chatId: currentThread.id
        }))
      );
      
      if (response) {
        // Add AI response
        const aiMessage = {
          id: `msg-${Date.now()}-ai`,
          text: response,
          timestamp: new Date().toISOString(),
          isUser: false
        };
        
        setThreads(prev => prev.map(t =>
          t.id === currentThread.id 
            ? {
                ...t,
                messages: [...t.messages, aiMessage],
                lastMessage: response,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            : t
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: "I apologize, but I'm having trouble generating a response right now. Please try again.",
        timestamp: new Date().toISOString(),
        isUser: false
      };
      
      setThreads(prev => prev.map(t =>
        t.id === currentThread.id 
          ? {
              ...t,
              messages: [...t.messages, errorMessage],
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
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 flex overflow-hidden">
          {/* Thread List Sidebar */}
          {isSidebarVisible ? (
            <aside className="w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200/60 flex flex-col transition-all duration-300 ease-in-out">
              <header className="p-4 border-b border-gray-200/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSidebarVisible(false)}
                      className="p-2 hover:bg-blue-50 rounded-xl transition-all duration-200 text-gray-600 hover:text-blue-600 hover:shadow-sm"
                      title="Collapse Chat Threads"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button 
                      onClick={handleNewChat} 
                      className="btn-primary"
                    >
                      + New Chat
                    </button>
                  </div>
                </div>
              </header>
              <ChatHistorySidebar
                isVisible={isSidebarVisible}
                onToggle={() => setIsSidebarVisible(false)}
                activeThreadId={activeThreadId}
                threads={filteredThreads.map(thread => ({
                  id: thread.id,
                  title: thread.title,
                  lastMessage: thread.lastMessage,
                  time: thread.time
                }))}
                onNewChat={handleNewChat}
                onSelectChat={(id) => setActiveThreadId(id)}
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
                      <span className="block text-sm text-gray-500">Active thread </span>
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
                    value={input}
                    onChange={setInput}
                    onSend={handleSendMessage}
                    loading={loading}
                  />
                </footer>
              </>
            ) : (
              /* Welcome Screen */
              <WelcomeScreen
                suggestions={suggestions}
                onStartChat={handleStartThread}
              />
            )}
          </section>
        </main>
      </div>
    </section>
  );
}

export default Dial;