import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Search as Magnifier, Plus as NewIcon, MessageCircle as BubbleIcon } from 'lucide-react';
import { Input as SearchBox } from '@/components/ui/input';
import { Button as IconBtn } from '@/components/ui/button';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import WelcomeScreen from '@/components/WelcomeScreen';
import { suggestions as actions } from '@/data/chatData';
import Sidebar from '@/components/Sidebar';

function Dial() {
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
  const [query, setQuery] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load threads from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setThreads(JSON.parse(saved));
    } else {
      setThreads([]);
    }
  }, []);

  // Save threads to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads]);

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
    const q = query.toLowerCase();
    return threads.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.lastMessage.toLowerCase().includes(q)
    );
  }, [threads, query]);

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
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

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
      const aiResponse = 'Thank you for your message. How can I assist you further?';
      setThreads(prev => prev.map(t =>
        t.id === currentThread.id
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
    }, 1000);
  }, [input, currentThread]);

  // Chat log for current thread
  const chatLog = currentThread?.messages || [];

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 flex overflow-hidden">
          {/* Thread List */}
          {isSidebarVisible ? (
            <aside className="w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200/60 flex flex-col transition-all duration-300 ease-in-out">
              <header className="p-4 border-b border-gray-200/60">
                <div className="flex items-center justify-between ">
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
                    <IconBtn
                      size="sm"
                      onClick={handleStartThread}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all duration-200 hover:shadow-md"
                    >
                      <NewIcon className="w-5 h-2  " />
                    </IconBtn>
                    <span className="text-lg font-semibold text-gray-900">New Chat </span>
                  </div>

                </div>

              </header>
              <ChatHistorySidebar
                isVisible={isSidebarVisible}
                onToggle={() => setIsSidebarVisible(false)}
                activeThreadId={activeThreadId}
                chatHistory={filteredThreads.map(thread => ({
                  id: thread.id,
                  title: thread.title,
                  lastMessage: thread.lastMessage,
                  time: thread.time
                }))}
                onNewChat={handleStartThread}
                onSelectChat={(id) => setActiveThreadId(id)}
              />
            </aside>
          ) : (
            <div className="w-10 bg-white/90 border-r border-gray-200/60 h-full flex flex-col items-center transition-all duration-300 ease-in-out relative">
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
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-br from-gray-50/50 to-white/50">
                  {chatLog.map(msg => (
                    <ChatMessage
                      key={msg.id}
                      id={msg.id}
                      text={msg.text}
                      timestamp={new Date(msg.timestamp)}
                      isUser={msg.isUser}
                    />
                  ))}
                  {loading && (
                    <div className="flex items-center gap-3 text-gray-500 bg-white/80 p-3 rounded-xl border border-gray-200/60 shadow-sm max-w-md mx-auto">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                      <span className="text-sm font-medium">AI is thinking...</span>
                    </div>
                  )}
                </div>
                <footer className="border-t border-gray-200/60 bg-white/80 backdrop-blur-sm">
                  <ChatInput
                    message={input}
                    onMessageChange={(e) => setInput(e.target.value)}
                    onSendMessage={handleSendMessage}
                    onKeyDown={(e) => {
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
              <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50/50 to-white/50">
                <WelcomeScreen suggestions={actions} onSuggestionClick={handleStartThread} onUserMessage={msg => handleStartThread({ text: msg })} />
              </div>
            )}
          </section>
        </main>
      </div>
    </section>
  );
}

export default Dial;
