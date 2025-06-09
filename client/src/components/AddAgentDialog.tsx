
import { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const availableTools = [
  { id: 'gmail', name: 'Gmail', icon: '📧' },
  { id: 'github', name: 'GitHub', icon: '🐙' },
  { id: 'calendar', name: 'Google Calendar', icon: '📅' },
  { id: 'notion', name: 'Notion', icon: '📝' },
  { id: 'sheets', name: 'Google Sheets', icon: '📊' },
  { id: 'slack', name: 'Slack', icon: '💬' },
  { id: 'drive', name: 'Google Drive', icon: '💾' },
  { id: 'linear', name: 'Linear', icon: '📋' },
  { id: 'discord', name: 'Discord', icon: '🎮' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '📱' },
  { id: 'web', name: 'Web Scraping', icon: '🌐' },
  { id: 'analytics', name: 'Analytics', icon: '📈' },
  { id: 'stripe', name: 'Stripe', icon: '💳' },
  { id: 'crm', name: 'CRM', icon: '👥' },
];

const toolActions = {
  gmail: ['Send Email', 'Read Emails', 'Search Emails', 'Create Draft'],
  github: ['Create Issue', 'Update Repository', 'Get Pull Requests', 'Create Branch'],
  calendar: ['Create Event', 'Get Events', 'Update Event', 'Delete Event'],
  notion: ['Create Page', 'Update Database', 'Query Database', 'Get Page'],
  sheets: ['Read Data', 'Write Data', 'Create Sheet', 'Update Cell'],
  slack: ['Send Message', 'Create Channel', 'Get Messages', 'Update Status'],
  drive: ['Upload File', 'Download File', 'Share File', 'Create Folder'],
  linear: ['Create Issue', 'Update Issue', 'Get Issues', 'Assign Issue'],
  discord: ['Send Message', 'Create Channel', 'Get Messages', 'Manage Roles'],
  linkedin: ['Post Update', 'Send Message', 'Get Connections', 'Share Content'],
  whatsapp: ['Send Message', 'Get Messages', 'Create Group', 'Send Media'],
  web: ['Scrape Data', 'Monitor Page', 'Extract Content', 'Check Status'],
  analytics: ['Get Metrics', 'Create Report', 'Track Event', 'Generate Insights'],
  stripe: ['Create Payment', 'Get Transactions', 'Manage Subscriptions', 'Process Refund'],
  crm: ['Create Contact', 'Update Lead', 'Get Pipeline', 'Send Follow-up']
};

interface WorkflowStep {
  id: string;
  tool: string;
  action: string;
}

interface AddAgentDialogProps {
  children: React.ReactNode;
}

const AddAgentDialog = ({ children }: AddAgentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    { id: '1', tool: '', action: '' }
  ]);
  const { toast } = useToast();

  const handleToolToggle = (toolId: string) => {
    setSelectedTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const addWorkflowStep = () => {
    const newStep: WorkflowStep = {
      id: (workflowSteps.length + 1).toString(),
      tool: '',
      action: ''
    };
    setWorkflowSteps(prev => [...prev, newStep]);
  };

  const removeWorkflowStep = (stepId: string) => {
    if (workflowSteps.length > 1) {
      setWorkflowSteps(prev => prev.filter(step => step.id !== stepId));
    }
  };

  const updateWorkflowStep = (stepId: string, field: 'tool' | 'action', value: string) => {
    setWorkflowSteps(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { ...step, [field]: value, ...(field === 'tool' ? { action: '' } : {}) }
          : step
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your agent.",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a description for your agent.",
        variant: "destructive",
      });
      return;
    }

    if (selectedTools.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one tool for your agent.",
        variant: "destructive",
      });
      return;
    }

    const incompleteSteps = workflowSteps.filter(step => !step.tool || !step.action);
    if (incompleteSteps.length > 0) {
      toast({
        title: "Error",
        description: "Please complete all workflow steps by selecting a tool and action.",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically save the agent to your backend
    console.log('Creating agent:', { 
      name, 
      description, 
      tools: selectedTools,
      workflow: workflowSteps
    });
    
    toast({
      title: "Success",
      description: `Agent "${name}" has been created successfully!`,
    });

    // Reset form and close dialog
    setName('');
    setDescription('');
    setSelectedTools([]);
    setWorkflowSteps([{ id: '1', tool: '', action: '' }]);
    setOpen(false);
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setSelectedTools([]);
    setWorkflowSteps([{ id: '1', tool: '', action: '' }]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Agent</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agent Name */}
          <div className="space-y-2">
            <Label htmlFor="agent-name" className="text-sm font-medium">
              Agent Name *
            </Label>
            <Input
              id="agent-name"
              placeholder="Enter agent name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Agent Description */}
          <div className="space-y-2">
            <Label htmlFor="agent-description" className="text-sm font-medium">
              Description *
            </Label>
            <Textarea
              id="agent-description"
              placeholder="Describe what this agent will do..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[100px] resize-none"
            />
          </div>

          {/* Tool Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Select Tools * ({selectedTools.length} selected)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3">
              {availableTools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleToolToggle(tool.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all ${
                    selectedTools.includes(tool.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{tool.icon}</span>
                  <span className="text-sm font-medium">{tool.name}</span>
                  {selectedTools.includes(tool.id) && (
                    <X className="w-4 h-4 ml-auto text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Workflow Definition */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Define Workflow Steps *
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWorkflowStep}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </Button>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {workflowSteps.map((step, index) => (
                <div key={step.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Step {index + 1}</h4>
                    {workflowSteps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWorkflowStep(step.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">Select Tool</Label>
                      <Select
                        value={step.tool}
                        onValueChange={(value) => updateWorkflowStep(step.id, 'tool', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a tool..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTools.map((tool) => (
                            <SelectItem key={tool.id} value={tool.id}>
                              <div className="flex items-center gap-2">
                                <span>{tool.icon}</span>
                                <span>{tool.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">Select Action</Label>
                      <Select
                        value={step.action}
                        onValueChange={(value) => updateWorkflowStep(step.id, 'action', value)}
                        disabled={!step.tool}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose an action..." />
                        </SelectTrigger>
                        <SelectContent>
                          {step.tool && toolActions[step.tool as keyof typeof toolActions]?.map((action) => (
                            <SelectItem key={action} value={action}>
                              {action}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Agent
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAgentDialog;
