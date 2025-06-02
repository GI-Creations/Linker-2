
import { useState, useEffect } from 'react';
import { Target, Zap, Calendar, Mail, Users, TrendingUp, Database, Send } from 'lucide-react';
import AgentStatusCard from './AgentStatusCard';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  estimatedTime?: string;
}

interface AgentWorkflowVisualizationProps {
  agentName: string;
  agentDescription: string;
}

const AgentWorkflowVisualization = ({ agentName, agentDescription }: AgentWorkflowVisualizationProps) => {
  const [stepStatuses, setStepStatuses] = useState<Record<string, 'yet-to-start' | 'running' | 'completed'>>({});

  const getWorkflowSteps = (agentName: string): WorkflowStep[] => {
    if (agentName.includes('Calendar')) {
      return [
        {
          id: 'fetch-calendar',
          title: 'Fetch Calendar Events',
          description: 'Connecting to Google Calendar and retrieving today\'s meetings',
          icon: <Calendar className="w-5 h-5 text-blue-600" />,
          category: 'Data Collection',
          estimatedTime: '2s'
        },
        {
          id: 'analyze-participants',
          title: 'Analyze Participants',
          description: 'Identifying meeting attendees and their company information',
          icon: <Users className="w-5 h-5 text-purple-600" />,
          category: 'Analysis',
          estimatedTime: '3s'
        },
        {
          id: 'research-backgrounds',
          title: 'Research Backgrounds',
          description: 'Gathering attendee backgrounds from LinkedIn and company databases',
          icon: <TrendingUp className="w-5 h-5 text-orange-600" />,
          category: 'Research',
          estimatedTime: '5s'
        },
        {
          id: 'generate-insights',
          title: 'Generate Insights',
          description: 'Creating personalized talking points and meeting preparation notes',
          icon: <Zap className="w-5 h-5 text-yellow-600" />,
          category: 'AI Processing',
          estimatedTime: '4s'
        },
        {
          id: 'send-summary',
          title: 'Send Summary',
          description: 'Delivering the complete meeting brief via email and Slack',
          icon: <Send className="w-5 h-5 text-green-600" />,
          category: 'Delivery',
          estimatedTime: '2s'
        }
      ];
    } else if (agentName.includes('Deal Flow')) {
      return [
        {
          id: 'monitor-channels',
          title: 'Monitor Channels',
          description: 'Scanning Slack, Gmail, and LinkedIn for deal opportunities',
          icon: <Database className="w-5 h-5 text-blue-600" />,
          category: 'Monitoring',
          estimatedTime: '3s'
        },
        {
          id: 'extract-opportunities',
          title: 'Extract Opportunities',
          description: 'Identifying and extracting relevant deal information and metrics',
          icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
          category: 'Extraction',
          estimatedTime: '4s'
        },
        {
          id: 'score-deals',
          title: 'Score Against Thesis',
          description: 'Analyzing opportunities against investment criteria and thesis',
          icon: <Target className="w-5 h-5 text-orange-600" />,
          category: 'Scoring',
          estimatedTime: '5s'
        },
        {
          id: 'generate-alerts',
          title: 'Generate Alerts',
          description: 'Creating priority alerts and opportunity summaries',
          icon: <Zap className="w-5 h-5 text-yellow-600" />,
          category: 'Alert Generation',
          estimatedTime: '3s'
        },
        {
          id: 'update-pipeline',
          title: 'Update Pipeline',
          description: 'Adding qualified opportunities to deal pipeline and CRM',
          icon: <Send className="w-5 h-5 text-green-600" />,
          category: 'CRM Update',
          estimatedTime: '2s'
        }
      ];
    } else {
      return [
        {
          id: 'initialize',
          title: 'Initialize Agent',
          description: 'Setting up agent environment and connections',
          icon: <Target className="w-5 h-5 text-blue-600" />,
          category: 'Setup',
          estimatedTime: '2s'
        },
        {
          id: 'process-data',
          title: 'Process Data',
          description: 'Collecting and processing relevant data from connected sources',
          icon: <Database className="w-5 h-5 text-purple-600" />,
          category: 'Processing',
          estimatedTime: '4s'
        },
        {
          id: 'analyze-results',
          title: 'Analyze Results',
          description: 'Running AI analysis on collected data to generate insights',
          icon: <Zap className="w-5 h-5 text-orange-600" />,
          category: 'Analysis',
          estimatedTime: '5s'
        },
        {
          id: 'deliver-output',
          title: 'Deliver Output',
          description: 'Formatting and delivering results to designated channels',
          icon: <Send className="w-5 h-5 text-green-600" />,
          category: 'Delivery',
          estimatedTime: '2s'
        }
      ];
    }
  };

  const workflowSteps = getWorkflowSteps(agentName);

  useEffect(() => {
    // Initialize all steps as yet-to-start
    const initialStatuses: Record<string, 'yet-to-start' | 'running' | 'completed'> = {};
    workflowSteps.forEach(step => {
      initialStatuses[step.id] = 'yet-to-start';
    });
    setStepStatuses(initialStatuses);

    // Simulate step execution with realistic timing
    let currentStepIndex = 0;
    
    const executeNextStep = () => {
      if (currentStepIndex < workflowSteps.length) {
        const currentStep = workflowSteps[currentStepIndex];
        
        // Mark current step as running
        setStepStatuses(prev => ({
          ...prev,
          [currentStep.id]: 'running'
        }));

        // Complete the step after estimated time
        const estimatedMs = parseInt(currentStep.estimatedTime?.replace('s', '') || '3') * 1000;
        
        setTimeout(() => {
          setStepStatuses(prev => ({
            ...prev,
            [currentStep.id]: 'completed'
          }));
          
          currentStepIndex++;
          setTimeout(executeNextStep, 500); // Small delay before next step
        }, estimatedMs);
      }
    };

    // Start execution after a short delay
    const startTimer = setTimeout(executeNextStep, 1000);
    
    return () => clearTimeout(startTimer);
  }, [agentName]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
      {/* Agent Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{agentName}</h3>
          <p className="text-gray-600">{agentDescription}</p>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          Live Workflow Execution
        </h4>
        
        <div className="space-y-4">
          {workflowSteps.map((step, index) => (
            <AgentStatusCard
              key={step.id}
              title={step.title}
              description={step.description}
              status={stepStatuses[step.id] || 'yet-to-start'}
              icon={step.icon}
              category={step.category}
              delay={index * 100}
            />
          ))}
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-600">
            {Object.values(stepStatuses).filter(status => status === 'completed').length} of {workflowSteps.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-600 to-purple-700 h-2 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(Object.values(stepStatuses).filter(status => status === 'completed').length / workflowSteps.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentWorkflowVisualization;
