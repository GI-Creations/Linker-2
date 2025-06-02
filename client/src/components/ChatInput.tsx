
import { Send, Paperclip, AtSign } from 'lucide-react';
import MentionsDropdown from './MentionsDropdown';

interface Mention {
  id: string;
  name: string;
  type: 'agent' | 'knowledge-base' | 'tool';
  icon: string;
}

interface ChatInputProps {
  message: string;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  showMentions: boolean;
  filteredMentions: Mention[];
  onMentionClick: (mention: Mention) => void;
  isLoading?: boolean;
}

const ChatInput = ({
  message,
  onMessageChange,
  onSendMessage,
  onKeyDown,
  showMentions,
  filteredMentions,
  onMentionClick,
  isLoading = false
}: ChatInputProps) => {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <div className="relative">
            <textarea
              value={message}
              onChange={onMessageChange}
              onKeyDown={onKeyDown}
              placeholder="Type @ to mention agents, knowledge bases, or tools..."
              className="w-full bg-white/90 border border-gray-200/60 hover:border-gray-300/80 focus:border-blue-400 text-gray-900 placeholder:text-gray-500 rounded-2xl p-5 pr-20 resize-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 min-h-[80px] font-medium shadow-lg shadow-gray-900/5 transition-all duration-200 backdrop-blur-sm"
              rows={2}
            />
            
            {/* Input Actions */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-blue-600 transition-all duration-200 rounded-xl hover:bg-blue-50 hover:shadow-sm">
                <Paperclip className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-blue-600 transition-all duration-200 rounded-xl hover:bg-blue-50 hover:shadow-sm">
                <AtSign className="w-4 h-4" />
              </button>
            </div>

            <button 
              onClick={onSendMessage}
              disabled={!message.trim() || isLoading}
              className={`absolute bottom-4 right-4 p-3 rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:cursor-not-allowed 
                ${!message.trim() || isLoading ? 'btn-secondary' : 'btn-primary'}
              `}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Mentions Dropdown */}
          {showMentions && (
            <MentionsDropdown
              filteredMentions={filteredMentions}
              onMentionClick={onMentionClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
