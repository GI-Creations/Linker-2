import React from 'react';
import { MessageCircle } from 'lucide-react';

interface ChatHistorySidebarProps {
  threads: {
    id: string;
    title: string;
    lastMessage: string;
    time: string;
  }[];
  isVisible: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  activeThreadId?: string;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  threads,
  isVisible,
  onToggle,
  onNewChat,
  onSelectChat,
  activeThreadId,
}) => {
  return (
    <div className={`flex flex-col h-full w-80 bg-white/90 border-r border-gray-200/60 transition-all duration-300 ${isVisible ? '' : 'hidden'}`}>
      {/* <header className="p-4 border-b border-gray-200/60">
        <button
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
        >
          New Chatttt
        </button>
      </header> */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-2">
        {threads.length === 0 ? (
          <div className="text-gray-400 text-center mt-8">No chat threads yet.</div>
        ) : (
          threads.map(thread => (
            <div
              key={thread.id}
              className={`rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 shadow-sm ${activeThreadId === thread.id ? 'bg-blue-50 text-[#1677FF]' : 'hover:bg-blue-50'}`}
              onClick={() => onSelectChat(thread.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium truncate max-w-[140px]">{thread.title}</span>
                <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{thread.time}</span>
              </div>
              <div className="text-xs text-gray-500 truncate mt-1">{thread.lastMessage}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatHistorySidebar;
