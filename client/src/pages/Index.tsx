
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AgentCard from '@/components/AgentCard';
import AddAgentDialog from '@/components/AddAgentDialog';
import Sidebar from '@/components/Sidebar';

const Index = () => {
  const agents = [
    {
      id: '1',
      name: 'Email Assistant',
      description: 'Automates email responses and scheduling',
      status: 'active' as const,
      tools: ['Gmail', 'Calendar'],
      lastActive: '2 minutes ago',
      tasksCompleted: 45,
    },
    {
      id: '2',
      name: 'GitHub Bot',
      description: 'Manages pull requests and issues',
      status: 'inactive' as const,
      tools: ['GitHub', 'Slack'],
      lastActive: '1 hour ago',
      tasksCompleted: 23,
    },
    {
      id: '3',
      name: 'Data Analyzer',
      description: 'Processes and analyzes spreadsheet data',
      status: 'running' as const,
      tools: ['Google Sheets', 'Analytics'],
      lastActive: 'Just now',
      tasksCompleted: 67,
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Agents</h1>
                <p className="text-gray-600">Manage and monitor your AI agents</p>
              </div>
              
              <AddAgentDialog>
                <Button className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Agent
                </Button>
              </AddAgentDialog>
            </div>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>

          {/* Empty State when no agents */}
          {agents.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No agents yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first AI agent to automate tasks and workflows
              </p>
              <AddAgentDialog>
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Agent
                </Button>
              </AddAgentDialog>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
