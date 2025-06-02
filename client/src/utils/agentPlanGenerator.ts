
interface Agent {
  id: number;
  title: string;
  description: string;
  category: string;
  integrations: string[];
}

export const generateAgentPlan = (agent: Agent) => {
  const planTemplates: Record<string, any> = {
    'Daily Calendar Summary': {
      name: 'Daily Calendar Summary Agent',
      description: 'Automated daily calendar analysis with participant research',
      phases: [
        {
          name: 'Calendar Data Retrieval',
          tasks: [
            { id: 'CAL-001', description: 'Connect to Google Calendar API', query: 'calendar.events.list()' },
            { id: 'CAL-002', description: 'Fetch today\'s events and participants', dependencies: ['CAL-001'] }
          ]
        },
        {
          name: 'Participant Research',
          tasks: [
            { id: 'RES-001', description: 'Extract participant emails and names', dependencies: ['CAL-002'] },
            { id: 'RES-002', description: 'Research participants on LinkedIn', query: 'linkedin.search(participant_name)', dependencies: ['RES-001'] },
            { id: 'RES-003', description: 'Gather company and role information', dependencies: ['RES-002'] }
          ]
        },
        {
          name: 'Summary Generation',
          tasks: [
            { id: 'SUM-001', description: 'Generate personalized meeting summaries', dependencies: ['RES-003'] },
            { id: 'SUM-002', description: 'Create actionable insights and talking points', dependencies: ['SUM-001'] },
            { id: 'SUM-003', description: 'Send formatted email summary', dependencies: ['SUM-002'] }
          ]
        }
      ],
      accessibility: [
        'Runs automatically every morning at 7:00 AM',
        'Can be triggered manually with @Daily_Calendar_Summary',
        'Available via Slack command /calendar-summary',
        'Accessible through the agents dashboard'
      ]
    },
    'Deal Flow Intelligence': {
      name: 'Deal Flow Intelligence Agent',
      description: 'Monitors communication channels for investment opportunities',
      phases: [
        {
          name: 'Channel Monitoring',
          tasks: [
            { id: 'MON-001', description: 'Scan Slack channels for deal mentions', query: 'slack.messages.search("funding", "investment", "startup")' },
            { id: 'MON-002', description: 'Monitor Gmail for pitch decks and intros', query: 'gmail.search("pitch deck OR introduction OR warm intro")' },
            { id: 'MON-003', description: 'Track LinkedIn for fundraising announcements', dependencies: ['MON-001'] }
          ]
        },
        {
          name: 'Opportunity Analysis',
          tasks: [
            { id: 'ANA-001', description: 'Extract company and founder information', dependencies: ['MON-001', 'MON-002'] },
            { id: 'ANA-002', description: 'Research company background and metrics', dependencies: ['ANA-001'] },
            { id: 'ANA-003', description: 'Score opportunity fit against investment thesis', dependencies: ['ANA-002'] }
          ]
        },
        {
          name: 'Alert Generation',
          tasks: [
            { id: 'ALT-001', description: 'Create structured opportunity summary', dependencies: ['ANA-003'] },
            { id: 'ALT-002', description: 'Send high-priority deals via WhatsApp', dependencies: ['ALT-001'] },
            { id: 'ALT-003', description: 'Update deal pipeline in Notion', dependencies: ['ALT-001'] }
          ]
        }
      ],
      accessibility: [
        'Runs continuously every 30 minutes',
        'Instant alerts for high-priority matches',
        'Weekly summary reports',
        'Accessible via @Deal_Flow_Intelligence mentions'
      ]
    }
  };

  return planTemplates[agent.title] || {
    name: agent.title,
    description: agent.description,
    phases: [
      {
        name: 'Initialization',
        tasks: [
          { id: 'INIT-001', description: 'Initialize agent workflow' },
          { id: 'INIT-002', description: 'Connect to required integrations', dependencies: ['INIT-001'] }
        ]
      },
      {
        name: 'Execution',
        tasks: [
          { id: 'EXEC-001', description: 'Execute primary agent function', dependencies: ['INIT-002'] },
          { id: 'EXEC-002', description: 'Process and analyze data', dependencies: ['EXEC-001'] }
        ]
      },
      {
        name: 'Completion',
        tasks: [
          { id: 'COMP-001', description: 'Generate final output', dependencies: ['EXEC-002'] },
          { id: 'COMP-002', description: 'Deliver results to user', dependencies: ['COMP-001'] }
        ]
      }
    ],
    accessibility: [
      `Available via @${agent.title.replace(/\s+/g, '_')} mentions`,
      'Can be scheduled for regular execution',
      'Accessible through the agents dashboard'
    ]
  };
};
