
import AgentWorkflowVisualization from './AgentWorkflowVisualization';

interface AgentPlan {
  name: string;
  description: string;
  phases: any[];
  accessibility: string[];
}

interface AgentExecutionPlanProps {
  plan: AgentPlan;
}

const AgentExecutionPlan = ({ plan }: AgentExecutionPlanProps) => {
  return (
    <AgentWorkflowVisualization 
      agentName={plan.name} 
      agentDescription={plan.description} 
    />
  );
};

export default AgentExecutionPlan;
