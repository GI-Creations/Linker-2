
import { CheckCircle, Clock, Play, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface AgentStatusCardProps {
  title: string;
  description: string;
  status: 'yet-to-start' | 'running' | 'completed';
  icon: React.ReactNode;
  category?: string;
  delay?: number;
}

const AgentStatusCard = ({ title, description, status, icon, category, delay = 0 }: AgentStatusCardProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'yet-to-start':
        return {
          bgClass: 'bg-gray-50 border-gray-200',
          textClass: 'text-gray-600',
          iconBg: 'bg-gray-100',
          statusIcon: <Clock className="w-4 h-4 text-gray-400" />,
          statusText: 'Queued',
          statusColor: 'text-gray-500 bg-gray-100'
        };
      case 'running':
        return {
          bgClass: 'bg-blue-50 border-blue-200 shadow-lg shadow-blue-500/20',
          textClass: 'text-blue-900',
          iconBg: 'bg-blue-100',
          statusIcon: <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />,
          statusText: 'Running',
          statusColor: 'text-blue-700 bg-blue-100'
        };
      case 'completed':
        return {
          bgClass: 'bg-green-50 border-green-200 shadow-lg shadow-green-500/20',
          textClass: 'text-green-900',
          iconBg: 'bg-green-100',
          statusIcon: <CheckCircle className="w-4 h-4 text-green-600" />,
          statusText: 'Completed',
          statusColor: 'text-green-700 bg-green-100'
        };
      default:
        return {
          bgClass: 'bg-gray-50 border-gray-200',
          textClass: 'text-gray-600',
          iconBg: 'bg-gray-100',
          statusIcon: <Clock className="w-4 h-4 text-gray-400" />,
          statusText: 'Pending',
          statusColor: 'text-gray-500 bg-gray-100'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div 
      className={cn(
        'relative border-2 rounded-xl p-4 transition-all duration-500 ease-out transform',
        config.bgClass,
        status === 'running' && 'animate-pulse scale-[1.02]',
        status === 'completed' && 'scale-[1.01]'
      )}
      style={{
        animationDelay: `${delay}ms`
      }}
    >
      {/* Status indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl overflow-hidden">
        <div 
          className={cn(
            'h-full transition-all duration-1000 ease-out',
            status === 'yet-to-start' && 'w-0 bg-gray-300',
            status === 'running' && 'w-1/2 bg-blue-500 animate-pulse',
            status === 'completed' && 'w-full bg-green-500'
          )}
        />
      </div>

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300', config.iconBg)}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h5 className={cn('font-semibold transition-colors duration-300', config.textClass)}>
              {title}
            </h5>
            <div className="flex items-center gap-2">
              {category && (
                <span className="text-xs px-2 py-1 bg-white/80 rounded-full font-medium text-gray-600">
                  {category}
                </span>
              )}
              <div className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium', config.statusColor)}>
                {config.statusIcon}
                {config.statusText}
              </div>
            </div>
          </div>
          
          <p className={cn('text-sm transition-colors duration-300', config.textClass, 'opacity-90')}>
            {description}
          </p>

          {/* Progress animation for running status */}
          {status === 'running' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-700">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>Processing...</span>
            </div>
          )}

          {/* Success checkmark animation for completed */}
          {status === 'completed' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-green-700">
              <CheckCircle className="w-4 h-4 text-green-600 animate-bounce" />
              <span>Task completed successfully</span>
            </div>
          )}
        </div>
      </div>

      {/* Connecting line for workflow */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
        <ArrowRight className="w-4 h-4 text-gray-300 rotate-90" />
      </div>
    </div>
  );
};

export default AgentStatusCard;
