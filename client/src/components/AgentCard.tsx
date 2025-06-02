
import { useNavigate } from 'react-router-dom';

interface Agent {
  id: number;
  title: string;
  description: string;
  category: string;
  integrations: string[];
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

  return (
    <div 
      className="glass-card p-6 hover:shadow-md cursor-pointer group transition-all duration-200 hover:scale-[1.02]"
      onClick={handleAgentClick}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {agent.title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {agent.description}
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {agent.integrations.slice(0, 3).map((integration, index) => (
            <div
              key={index}
              className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs"
              title={integration}
            >
              {getIntegrationIcon(integration)}
            </div>
          ))}
          {agent.integrations.length > 3 && (
            <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
              +{agent.integrations.length - 3}
            </div>
          )}
        </div>
        
        <span className="badge">
          {agent.category}
        </span>
      </div>
    </div>
  );
};

export default AgentCard;
