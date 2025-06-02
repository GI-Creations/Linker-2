
interface Suggestion {
  id: string;
  text: string;
  category: 'suggested';
}

interface Mention {
  id: string;
  name: string;
  type: 'agent' | 'knowledge-base' | 'tool';
  icon: string;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  lastMessage: string;
  time: string;
}

export const suggestions: Suggestion[] = [
  { id: '1', text: '@MnA_Market_Intelligence run weekly analysis', category: 'suggested' },
  { id: '2', text: 'Search @Omkar_Notion for Q4 portfolio updates', category: 'suggested' },
  { id: '3', text: 'Get latest @Linear tickets from engineering team', category: 'suggested' },
  { id: '4', text: 'Find @Gmail emails about Series B funding', category: 'suggested' },
];

export const chatHistory: ChatHistoryItem[] = [
  { id: '1', title: 'M&A Market Intelligence Setup', lastMessage: 'Agent created successfully', time: 'now' },
  { id: '2', title: 'Portfolio Company Research', lastMessage: 'Found 12 new updates in Notion', time: '1h ago' },
  { id: '3', title: 'Linear Task Analysis', lastMessage: 'Engineering sprint completed', time: '2h ago' },
  { id: '4', title: 'Gmail Deal Flow', lastMessage: 'Identified 3 potential targets', time: '3h ago' },
  { id: '5', title: 'LinkedIn Network Growth', lastMessage: 'Added 15 new connections', time: '1d ago' },
  { id: '6', title: 'Google Docs Summary', lastMessage: 'Investment memo reviewed', time: '2d ago' },
];

export const mentions: Mention[] = [
  // Agents
  { id: '1', name: 'MnA_Market_Intelligence', type: 'agent', icon: '🎯' },
  { id: '2', name: 'Daily_Calendar_Summary', type: 'agent', icon: '📅' },
  { id: '3', name: 'Deal_Flow_Intelligence', type: 'agent', icon: '💼' },
  { id: '4', name: 'Portfolio_Updates', type: 'agent', icon: '📊' },
  
  // Omkar's Knowledge Bases
  { id: '5', name: 'Omkar_Notion', type: 'knowledge-base', icon: '📝' },
  { id: '6', name: 'Omkar_Investment_Portfolio', type: 'knowledge-base', icon: '💰' },
  { id: '7', name: 'Omkar_Deal_Pipeline', type: 'knowledge-base', icon: '🔄' },
  { id: '8', name: 'Omkar_Market_Research', type: 'knowledge-base', icon: '📈' },
  
  // Tools/Integrations
  { id: '9', name: 'Linear', type: 'tool', icon: '📋' },
  { id: '10', name: 'Gmail', type: 'tool', icon: '✉️' },
  { id: '11', name: 'LinkedIn', type: 'tool', icon: '💼' },
  { id: '12', name: 'Google_Docs', type: 'tool', icon: '📄' },
  { id: '13', name: 'Slack', type: 'tool', icon: '💬' },
  { id: '14', name: 'Calendar', type: 'tool', icon: '📅' },
];
