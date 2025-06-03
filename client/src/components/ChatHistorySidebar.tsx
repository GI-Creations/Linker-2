import React from 'react';

interface ChatHistorySidebarProps {
  chatHistory: {
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
  chatHistory,
  isVisible,
  onToggle,
  onNewChat,
  onSelectChat,
  activeThreadId,
}) => {
  return (
    <div className={`flex flex-col h-full w-80 bg-white/90 border-r border-gray-200/60 transition-all duration-300 ${isVisible ? '' : 'hidden'}`}>
      {/* <header className="p-4 border-b border-gray-200/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggle}
              className="p-2 hover:bg-blue-50 rounded-xl transition-all duration-200 text-gray-600 hover:text-blue-600 hover:shadow-sm"
              title="Collapse Chat Threads"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-semibold text-gray-900">Chat History</span>
          </div>
          <button
            onClick={onNewChat}
            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all duration-200 hover:shadow-md"
            title="New Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </header> */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-2">
        {chatHistory.length === 0 ? (
          <div className="text-gray-400 text-center mt-8">No chat threads yet.</div>
        ) : (
          chatHistory.map(thread => (
            <div
              key={thread.id}
              className={`rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 shadow-sm ${activeThreadId === thread.id ? 'bg-blue-50 text-[#1677FF]' : 'hover:bg-blue-50'}`}
              onClick={() => onSelectChat(thread.id)}
            >
              <div className="flex items-center justify-between ">
                <span className="font-medium  truncate max-w-[140px]">{thread.title}</span>
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
