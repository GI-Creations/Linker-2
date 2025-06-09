import React, { useState, useEffect, useRef, forwardRef } from 'react';
import {
  Send,
  Paperclip,
  AtSign,
  Mail,
  Github,
  Triangle,
  Database,
  Search,
  Microscope,
  Users,
  FileText,
  Globe,
  Monitor
} from 'lucide-react';

interface Mention {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  loading?: boolean;
}

const apps: Mention[] = [
  { id: 'gmail', name: 'Gmail', icon: Mail, color: 'text-red-500' },
  { id: 'github', name: 'GitHub', icon: Github, color: 'text-gray-800' },
  { id: 'ycombinator', name: 'Y Combinator', icon: Triangle, color: 'text-orange-500' },
  { id: 'den', name: 'Den', icon: Database, color: 'text-purple-500' },
  { id: 'company-search', name: 'Company Search', icon: Search, color: 'text-blue-500' },
  { id: 'deep-research', name: 'Deep Research', icon: Microscope, color: 'text-green-500' },
  { id: 'leads-search', name: 'Leads Search', icon: Users, color: 'text-indigo-500' },
  { id: 'read-pdf', name: 'Read PDF', icon: FileText, color: 'text-red-400' },
  { id: 'web-scrape', name: 'Web Scrape', icon: Monitor, color: 'text-teal-500' },
  { id: 'web-search', name: 'Web Search', icon: Globe, color: 'text-blue-600' },
];

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(({
  value,
  onChange,
  onSend,
  loading = false
}, ref) => {
  const [showMentions, setShowMentions] = useState(false);
  const [filteredMentions, setFilteredMentions] = useState<Mention[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (showMentions) {
      setSelectedIndex(0);
    }
  }, [filteredMentions, showMentions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    const lastWord = newValue.split(/\s+/).pop() || '';
    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1).toLowerCase();
      const results = apps.filter(app =>
        app.name.toLowerCase().includes(query)
      );
      setFilteredMentions(results);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredMentions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredMentions.length - 1 ? prev + 1 : 0
          );
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredMentions.length - 1
          );
          return;
        case 'Enter':
          e.preventDefault();
          handleMentionSelect(filteredMentions[selectedIndex]);
          return;
        case 'Escape':
          e.preventDefault();
          setShowMentions(false);
          return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (typeof onSend === 'function') {
        onSend();
      }
    }
  };

  const handleMentionSelect = (mention: Mention) => {
    if (!ref || !('current' in ref) || !ref.current) return;
    const parts = value.split(/\s+/);
    parts[parts.length - 1] = `@${mention.name}`;
    const updated = parts.join(' ') + ' ';
    onChange(updated);
    setShowMentions(false);
    setTimeout(() => ref.current?.focus(), 50);
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type @ to mention agents, knowledge bases, or tools..."
            className="w-full bg-white/90 border border-gray-200/60 hover:border-gray-300/80 focus:border-blue-400 text-gray-900 placeholder:text-gray-500 rounded-2xl p-5 pr-20 resize-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 min-h-[80px] font-medium shadow-lg shadow-gray-900/5 transition-all duration-200 backdrop-blur-sm"
            rows={2}
          />

          {/* Input Actions */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 hover:shadow-sm">
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 hover:shadow-sm"
              onClick={() => {
                if (ref && 'current' in ref && ref.current) {
                  ref.current.focus();
                  const newValue = value.trimEnd() + ' @';
                  onChange(newValue);
                  setShowMentions(true);
                }
              }}
            >
              <AtSign className="w-4 h-4" />
            </button>
          </div>

          {/* Send Button */}
          <button
            onClick={onSend}
            disabled={!value.trim() || loading}
            className={`absolute bottom-4 right-4 p-3 rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed
              ${!value.trim() || loading
                ? 'bg-gray-100 text-gray-400 shadow-gray-200/50'
                : 'bg-blue-600 text-white shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-700/30'
              }`}
          >
            <Send className="w-4 h-4" />
          </button>

          {/* Mentions Dropdown */}
          {showMentions && filteredMentions.length > 0 && (
            <div className="w-[300px] absolute bottom-full left-0 right-0 mb-2 z-50">
              <div className="bg-white border border-gray-200 rounded-xl shadow-lg py-2 max-h-64 overflow-y-auto backdrop-blur-sm bg-white/95">
                {filteredMentions.map((mention, index) => {
                  const Icon = mention.icon;
                  return (
                    <div
                      key={mention.id}
                      className={`flex items-center  gap-3 px-4 py-2.5 cursor-pointer transition-all duration-150 ${
                        index === selectedIndex
                          ? 'bg-blue-50 border-l-2 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleMentionSelect(mention)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <Icon className={`w-5 h-5 ${mention.color}`} />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {mention.name}
                      </span>
                      {index === selectedIndex && (
                        <div className="ml-auto">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
