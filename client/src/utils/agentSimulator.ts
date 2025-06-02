
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

export const getExecutionStatusMessage = (agent: Agent, step: number) => {
  const statusMessages: Record<string, string[]> = {
    'Daily Calendar Summary': [
      '🔍 Connecting to Google Calendar...',
      '📅 Fetching today\'s meetings...',
      '👥 Identifying meeting participants...',
      '🔎 Researching attendee backgrounds...',
      '💼 Gathering company information...',
      '📝 Generating meeting insights...',
      '✨ Creating personalized talking points...',
      '📧 Preparing email summary...'
    ],
    'Deal Flow Intelligence': [
      '👀 Scanning Slack channels for opportunities...',
      '📧 Monitoring Gmail for pitch decks...',
      '🔗 Checking LinkedIn for announcements...',
      '🏢 Extracting company information...',
      '📊 Analyzing business metrics...',
      '🎯 Scoring against investment thesis...',
      '📋 Creating opportunity summary...',
      '⚡ Sending priority alerts...'
    ]
  };

  const messages = statusMessages[agent.title] || [
    '🔄 Processing data...',
    '⚙️ Running analysis...',
    '📊 Generating insights...',
    '✅ Completing execution...'
  ];

  return messages[Math.min(step - 1, messages.length - 1)] || '⚙️ Processing...';
};

export const generateAgentResults = (agent: Agent) => {
  const resultTemplates: Record<string, string> = {
    'Daily Calendar Summary': `✅ **Daily Calendar Summary Complete**

**Today's Schedule Overview:**
• 5 meetings scheduled (3 high-priority)
• 2 new contacts identified for follow-up
• 1 potential deal flow opportunity

**Key Meeting Insights:**

**10:00 AM - Sarah Chen (TechVenture Partners)**
• Partner at $500M fund focusing on B2B SaaS
• Previously invested in 3 unicorns in our portfolio space
• Recent LinkedIn post about AI automation trends
• **Talking point**: Our portfolio company's new AI features

**2:00 PM - Marcus Rodriguez (Startup Founder)**
• CEO of DataFlow Inc (Series A stage)
• Raising $15M for expansion
• Strong metrics: 200% YoY growth, $2M ARR
• **Action**: Schedule follow-up for deeper dive

📧 **Detailed summary sent to your email**`,

    'Deal Flow Intelligence': `🎯 **Deal Flow Intelligence Report**

**New Opportunities Identified:**

**High Priority Alert** 🚨
• **CloudTech AI** - Series B ($25M raise)
• Founder: Jessica Park (ex-Google AI)
• Metrics: $5M ARR, 300% growth
• **Warm intro available** via Michael Chen
• Fits our AI/automation thesis perfectly

**Medium Priority**
• **GreenEnergy Solutions** - Series A ($8M)
• **FinanceFlow** - Seed ($3M)

**Channel Activity:**
• 23 deal mentions in #deal-flow Slack
• 8 pitch decks received via email
• 12 LinkedIn fundraising announcements

**Action Items:**
• Schedule call with CloudTech AI (high priority)
• Review FinanceFlow pitch deck
• Follow up on 3 warm introductions

📋 **Pipeline updated in Notion**`
  };

  return resultTemplates[agent.title] || `✅ **${agent.title} Execution Complete**

**Results Summary:**
• Agent workflow executed successfully
• All integrations connected and functioning
• Data processed and insights generated
• Deliverables completed as scheduled

**Output:**
The agent has completed its designated tasks and delivered the expected results. Check your connected platforms for detailed outputs and updates.

**Next Steps:**
• Review generated insights
• Take recommended actions
• Schedule next execution if needed`;
};

export const simulateAgentExecution = (
  agent: Agent, 
  plan: any, 
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) => {
  let executionStep = 0;
  const totalSteps = plan.phases.reduce((sum: number, phase: any) => sum + phase.tasks.length, 0);
  
  const executeNextStep = () => {
    if (executionStep < totalSteps) {
      executionStep++;
      const progress = Math.round((executionStep / totalSteps) * 100);
      
      setTimeout(() => {
        const statusMessage: ChatMessage = {
          id: `status-${Date.now()}`,
          text: `⚡ **Execution Step ${executionStep} of ${totalSteps}**\n\n${getExecutionStatusMessage(agent, executionStep)}`,
          timestamp: new Date(),
          isUser: false
        };
        
        setMessages(prev => [...prev, statusMessage]);
        executeNextStep();
      }, 1500 + Math.random() * 1000);
    } else {
      // Final results
      setTimeout(() => {
        const resultsMessage: ChatMessage = {
          id: `results-${Date.now()}`,
          text: generateAgentResults(agent),
          timestamp: new Date(),
          isUser: false
        };
        
        setMessages(prev => [...prev, resultsMessage]);
      }, 2000);
    }
  };
  
  executeNextStep();
};
