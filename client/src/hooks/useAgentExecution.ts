
import { useEffect } from 'react';
import { generateAgentPlan } from '../utils/agentPlanGenerator';
import { simulateAgentExecution } from '../utils/agentSimulator';

interface Agent {
  id: number;
  title: string;
  description: string;
  category: string;
  integrations: string[];
}

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
  agentPlan?: any;
}

interface UseAgentExecutionProps {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useAgentExecution = ({ setMessages, setIsTyping }: UseAgentExecutionProps) => {
  useEffect(() => {
    const selectedAgent = localStorage.getItem('selectedAgent');
    
    if (selectedAgent) {
      const agent: Agent = JSON.parse(selectedAgent);
      executeAgent(agent);
      localStorage.removeItem('selectedAgent');
    }
  }, []);

  const executeAgent = (agent: Agent) => {
    // Clear existing messages to show fresh agent execution
    setMessages([]);
    
    // Add initial user message showing agent execution request
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: `Execute agent: ${agent.title}`,
      timestamp: new Date(),
      isUser: true
    };
    
    setMessages([userMessage]);
    setIsTyping(true);

    // Simulate agent execution workflow
    setTimeout(() => {
      setIsTyping(false);
      
      const agentPlan = generateAgentPlan(agent);
      
      const agentResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `🤖 **${agent.title} Agent Activated**\n\n${agent.description}\n\nInitializing execution plan...`,
        timestamp: new Date(),
        isUser: false,
        agentPlan: agentPlan
      };
      
      setMessages(prev => [...prev, agentResponse]);
      
      // Simulate step-by-step execution
      simulateAgentExecution(agent, agentPlan, setMessages);
    }, 1000);
  };

  return { executeAgent };
};
