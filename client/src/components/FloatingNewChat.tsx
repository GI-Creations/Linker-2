
import { useState } from 'react';
import { Plus, Send, X, MessageCircle, Minus } from 'lucide-react';

interface FloatingNewChatProps {
  onNewChat: (query: string) => void;
  isLoading?: boolean;
  onClose?: () => void;
}

const FloatingNewChat = ({ onNewChat, isLoading = false, onClose }: FloatingNewChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState('');

  const handleSubmit = async () => {
    if (query.trim()) {
      try {
        await onNewChat(query.trim());
        setQuery('');
        if (onClose) {
          onClose();
        } else {
          setIsOpen(false);
          setIsMinimized(false);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsMinimized(false);
    }
  };

  const toggleChat = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else {
      setIsOpen(false);
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 group"
        >
          <div className="relative w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 ease-out hover:scale-110 active:scale-95 flex items-center justify-center">
            <Plus className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" />
            
            {/* Pulse animation ring */}
            <div className="absolute inset-0 rounded-full bg-blue-600/20 animate-ping"></div>
            
            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
              New chat
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
            </div>
          </div>
        </button>
      )}

      {/* Chat Window - Bottom Right */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/80 transition-all duration-300 ease-out ${
          isMinimized ? 'h-14' : 'h-96'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">New Chat</h3>
                <p className="text-xs text-gray-500">Ask me anything</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMinimize}
                className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white border border-gray-200/50 hover:border-gray-300/50 flex items-center justify-center transition-all duration-200 hover:scale-105"
              >
                <Minus className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white border border-gray-200/50 hover:border-gray-300/50 flex items-center justify-center transition-all duration-200 hover:scale-105"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <div className="flex flex-col h-80">
              {/* Messages Area */}
              <div className="flex-1 p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-gray-600 text-sm">What can I help you with today?</p>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-100">
                <div className="relative">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="w-full bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-blue-400 text-gray-900 placeholder:text-gray-500 rounded-xl p-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-sm"
                    rows={2}
                    autoFocus
                  />
                  
                  <button
                    onClick={handleSubmit}
                    disabled={!query.trim() || isLoading}
                    className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white p-2 rounded-lg shadow-sm hover:shadow-md disabled:shadow-none transition-all duration-200 hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingNewChat;
