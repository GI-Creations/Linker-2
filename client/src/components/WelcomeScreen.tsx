
import { Bot, Sparkles, Zap, Brain, Target } from 'lucide-react';
import { Button } from './ui/button';
import ChatInput from './ChatInput';

interface Suggestion {
  id: string;
  text: string;
  category: 'suggested';
}

interface WelcomeScreenProps {
  suggestions: Suggestion[];
  onSuggestionClick: (suggestion: Suggestion) => void;
  onUserMessage?: (text: string) => void;
}

import { useState } from 'react';

const WelcomeScreen = ({ suggestions, onSuggestionClick, onUserMessage }: WelcomeScreenProps) => {
  const [message, setMessage] = useState('');
  const suggestionIcons = [Zap, Brain, Target, Sparkles];

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full p-8 flex flex-col justify-center">
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="relative">
           
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">How can I help you today?</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Create agents, analyze data, or get insights from your knowledge bases and tools
            </p>
          </div>
          {/* Primary Try now Button */}
          {/* <div className="flex justify-center mt-6">
            <button className=" btn-primary">
              Try now
            </button>
          </div> */}
        </div>

        {/* Suggestions Grid */}
        <div >
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">Quick actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto pb-10">
            {suggestions.map((suggestion, index) => {
              const IconComponent = suggestionIcons[index % suggestionIcons.length];
              return (
                <button
                  key={suggestion.id}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="group p-4 bg-white/90 backdrop-blur-sm border border-gray-200/60 hover:border-[#1677FF] rounded-xl text-left text-gray-700 hover:text-gray-900 transition-all duration-200 hover:shadow-md hover:bg-white/95 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    {/* <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:shadow-md shadow-sm">
                      <IconComponent className="w-6 h-6 text-blue-600 group-hover:text-blue-700" />
                    </div> */}
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

        {/* Features Preview */}
        {/* <div className="text-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm border border-gray-200/60">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span>24/7 Available</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm border border-gray-200/60">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>14+ Integrations</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm border border-gray-200/60">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Smart Automation</span>
            </div>
          </div>
        </div> */}

      </div>
      {/* Chat input at the bottom of WelcomeScreen */}
      <div >
        <ChatInput
          message={message}
          onMessageChange={e => setMessage(e.target.value)}
          onSendMessage={() => {
            if (message.trim()) {
              onUserMessage?.(message);
              setMessage('');
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (message.trim()) {
                onUserMessage?.(message);
                setMessage('');
              }
            }
          }}
          showMentions={false}
          filteredMentions={[]}
          onMentionClick={() => { }}
        />
      </div>
    </div>
  );
};

export default WelcomeScreen;
