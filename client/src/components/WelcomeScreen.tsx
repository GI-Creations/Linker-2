import { Bot, Sparkles, Zap, Brain, Target } from 'lucide-react';
import { Button } from './ui/button';
import ChatInput from './ChatInput';
import { useState } from 'react';

interface Suggestion {
  id: string;
  text: string;
  category: string;
}

interface WelcomeScreenProps {
  suggestions: Suggestion[];
  onStartChat: (ticker?: string) => void;
}

const WelcomeScreen = ({ suggestions, onStartChat }: WelcomeScreenProps) => {
  const [message, setMessage] = useState('');
  const suggestionIcons = [Zap, Brain, Target, Sparkles];

  const handleSend = () => {
    if (message.trim()) {
      onStartChat(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto w-full space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">How can I help you today?</h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Create agents, analyze data, or get insights from your knowledge bases and tools
              </p>
            </div>
          </div>

          {/* Suggestions Grid */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">Quick actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {suggestions.map((suggestion, index) => {
                const IconComponent = suggestionIcons[index % suggestionIcons.length];
                return (
                  <button
                    key={suggestion.id}
                    onClick={() => onStartChat(suggestion.text)}
                    className="group p-4 bg-white/90 backdrop-blur-sm border border-gray-200/60 hover:border-[#1677FF] rounded-xl text-left text-gray-700 hover:text-gray-900 transition-all duration-200 hover:shadow-md hover:bg-white/95 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 group-hover:text-[#1677FF] transition-colors duration-200">
                          {suggestion.text}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer with ChatInput */}
      <footer className="border-t border-gray-200/60 bg-white/80 backdrop-blur-sm">
        <ChatInput
          value={message}
          onChange={setMessage}
          onSend={handleSend}
          loading={false}
        />
      </footer>
    </div>
  );
};

export default WelcomeScreen;