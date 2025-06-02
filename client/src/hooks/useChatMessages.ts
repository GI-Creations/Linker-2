
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
  agentPlan?: any;
}

export const useChatMessages = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const getSimulatedResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('@omkar_notion') || lowerMessage.includes('notion')) {
      return "📝 **Searching Omkar's Notion workspace...**\n\nFound 24 documents in your portfolio database:\n- Q4 Performance Reviews (8 companies)\n- Due Diligence Reports (3 active deals)\n- Investment Committee Notes (last 30 days)\n- Market Analysis Documents (Fintech sector)\n\nWould you like me to summarize any specific documents?";
    }
    
    if (lowerMessage.includes('@linear') || lowerMessage.includes('linear')) {
      return "📋 **Connecting to Linear workspace...**\n\n**Recent Engineering Updates:**\n- Sprint 23 completed (85% velocity)\n- 12 tickets moved to Done this week\n- 3 high-priority bugs resolved\n- Portfolio company integrations on track\n\n**Current Focus Areas:**\n- API improvements for portfolio tracking\n- Due diligence automation tools";
    }
    
    if (lowerMessage.includes('@gmail') || lowerMessage.includes('email')) {
      return "✉️ **Analyzing Gmail inbox...**\n\n**Deal Flow Summary (Last 7 days):**\n- 23 new founder outreach emails\n- 5 warm introductions received\n- 3 follow-up meetings scheduled\n- 2 term sheet discussions initiated\n\n**Top Priority Emails:**\n- Series B discussion with TechCorp (urgent)\n- LP quarterly report due Friday\n- Due diligence request from Startup XYZ";
    }
    
    if (lowerMessage.includes('@linkedin') || lowerMessage.includes('linkedin')) {
      return "💼 **LinkedIn network analysis...**\n\n**This Week's Activity:**\n- 18 new connection requests (12 founders, 6 VCs)\n- 45 post engagements on your investment thesis\n- 7 warm introduction opportunities identified\n\n**Notable Connections:**\n- 3 unicorn founders in your extended network\n- 12 portfolio company executives active\n- 5 co-investment opportunities flagged";
    }
    
    if (lowerMessage.includes('@google_docs') || lowerMessage.includes('docs')) {
      return "📄 **Scanning Google Docs...**\n\n**Recent Investment Documents:**\n- \"Fintech Market Analysis Q4 2024\" (updated 2 days ago)\n- \"Portfolio Company KPI Dashboard\" (weekly update)\n- \"Investment Committee Memo - Series B\" (needs review)\n- \"Market Research: AI/ML Startups\" (collaborative doc)\n\n**Action Items:**\n- 2 documents pending your review\n- 1 memo ready for IC presentation";
    }
    
    if (lowerMessage.includes('create') && lowerMessage.includes('agent')) {
      return "🤖 **Agent Creation Assistant**\n\nI can help you create a new agent! What would you like this agent to do?\n\nPopular options for PE/VC:\n- Automated deal sourcing\n- Portfolio company monitoring\n- Market research compilation\n- LP communication automation\n- Due diligence workflow\n\nJust describe the workflow and I'll help you build it!";
    }
    
    return "I understand you're looking for help with your PE/VC workflows. I can assist with:\n\n• **Deal Flow Management** - Track and analyze potential investments\n• **Portfolio Monitoring** - Keep tabs on your portfolio companies\n• **Market Research** - Compile industry insights and trends\n• **Due Diligence** - Automate research and analysis workflows\n• **LP Communications** - Manage investor relations\n\nWhat specific area would you like to focus on?";
  };

  const handleSendMessage = async (message: string) => {
    if (message.trim()) {
      const newUserMessage: ChatMessage = {
        id: uuidv4(),
        text: message,
        timestamp: new Date(),
        isUser: true
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setIsTyping(true);
      
      try {
        // Make API call to get real response
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });

        if (!response.ok) throw new Error('Failed to get response');
        
        const data = await response.json();
        
        const aiResponse: ChatMessage = {
          id: uuidv4(),
          text: data.response,
          timestamp: new Date(),
          isUser: false
        };
        
        setMessages(prev => [...prev, aiResponse]);
      } catch (error) {
        console.error('Chat error:', error);
        // Fallback to simulated response if API fails
        const aiResponse: ChatMessage = {
          id: uuidv4(),
          text: getSimulatedResponse(message),
          timestamp: new Date(),
          isUser: false
        };
        setMessages(prev => [...prev, aiResponse]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    setMessages,
    isTyping,
    setIsTyping,
    handleSendMessage,
    clearMessages
  };
};
