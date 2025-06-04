import { useNavigate } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  tools: string[];
  lastActive: string;
  tasksCompleted: number;
}

interface AgentCardProps {
  agent: Agent;
}

const getIntegrationIcon = (integration: string) => {
  const icons: Record<string, string> = {
    calendar: '📅',
    email: '✉️',
    gmail: '📧',
    analytics: '⚡',
    crm: '📊',
    stripe: '💳',
    web: '🌐',
    notion: '📝',
    docs: '📄',
    ai: '🤖',
    cms: '📰',
    slack: '💬',
    linkedin: '💼',
    whatsapp: '📱',
    linear: '📋',
    zoom: '🎥',
    teams: '👥',
    dropbox: '📦',
    drive: '☁️'
  };
  return icons[integration] || '🔧';
};

const AgentCard = ({ agent }: AgentCardProps) => {
  const navigate = useNavigate();

  const handleAgentClick = () => {
    // Store agent data for the chat to pick up
    localStorage.setItem('selectedAgent', JSON.stringify(agent));
    navigate('/inbox');
  };

  // Ensure tools is an array
  const toolsArray = Array.isArray(agent.tools) ? agent.tools : [];

  return (
    <div 
      className="glass-card p-6 hover:shadow-md cursor-pointer group transition-all duration-200 hover:scale-[1.02]"
      onClick={handleAgentClick}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {agent.name}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {agent.description}
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {toolsArray.slice(0, 3).map((tool, index) => (
            <div
              key={index}
              className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs"
              title={tool}
            >
              {getIntegrationIcon(tool.toLowerCase())}
            </div>
          ))}
          {toolsArray.length > 3 && (
            <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
              +{toolsArray.length - 3}
            </div>
          )}
        </div>
        
        <span className="badge">
          {agent.status}
        </span>
      </div>
    </div>
  );
};

export default AgentCard;
