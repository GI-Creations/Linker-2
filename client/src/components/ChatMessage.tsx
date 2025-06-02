
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
}

const formatMessageText = (text: string) => {
  // Split by newlines and process each line
  return text.split('\n').map((line, index) => {
    // Handle bold text
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle bullet points
    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      return (
        <div key={index} className="ml-4 mb-1">
          <span dangerouslySetInnerHTML={{ __html: line }} />
        </div>
      );
    }
    
    // Handle empty lines
    if (line.trim() === '') {
      return <br key={index} />;
    }
    
    // Regular lines
    return (
      <div key={index} className="mb-1">
        <span dangerouslySetInnerHTML={{ __html: line }} />
      </div>
    );
  });
};

const ChatMessage = ({ text, timestamp, isUser }: ChatMessageProps) => {
  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 shadow-md border border-blue-100">
          <Bot className="w-4 h-4 text-[#1677FF]" />
        </div>
      )}
      <div className={`max-w-3xl p-4 rounded-2xl shadow-md border ${
        isUser 
          ? 'bg-blue-50 text-[#1677FF] ml-12 border-blue-100' 
          : 'bg-white/90 text-gray-800 border-gray-200/60 mr-12'
      }`}>
        <div className="text-sm leading-relaxed">
          {isUser ? (
            <p>{text}</p>
          ) : (
            <div>{formatMessageText(text)}</div>
          )}
        </div>
        <span className={`text-xs mt-2 block ${
          isUser ? 'text-blue-400' : 'text-blue-300'
        }`}>
          {timestamp.toLocaleTimeString()}
        </span>
      </div>
      {isUser && (
        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 shadow-md border border-blue-100">
          <User className="w-4 h-4 text-[#1677FF]" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
