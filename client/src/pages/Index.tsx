import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AgentCard from '@/components/AgentCard';
import AddAgentDialog from '@/components/AddAgentDialog';
import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

const Index = () => {
  const yourAgents = [
    { id: '1', name: 'Email Assistant', description: 'Automates email responses and scheduling', status: 'active' as const, tools: ['Gmail','Calendar'], lastActive:'2 minutes ago', tasksCompleted:45 },
    { id: '2', name: 'GitHub Bot', description: 'Manages pull requests and issues', status: 'inactive' as const, tools:['GitHub','Slack'], lastActive:'1 hour ago', tasksCompleted:23 },
    { id: '3', name: 'Data Analyzer', description: 'Processes and analyzes spreadsheet data', status: 'active' as const, tools:['Google Sheets','Analytics'], lastActive:'Just now', tasksCompleted:67 },
  ];
  const templateAgents = [
    { id:'1', name:'Daily Calendar Summary', description:"Sends a daily email with all events and background research on who you're meeting with", status:'popular' as const, tools:['Calendar'], lastActive:'', tasksCompleted:0, category:'Personal' },
    { id:'2', name:'Company Summary', description:'Create a weekly summary of all activity, progress, and highlights', status:'popular' as const, tools:['Slack','Calendar','Notion'], lastActive:'', tasksCompleted:0, category:'Company' },
    { id:'3', name:'Outbound to VC Firms', description:'Identify and organize VC funds that match your company profile for targeted outreach', status:'popular' as const, tools:['Google Sheets'], lastActive:'', tasksCompleted:0, category:'Fundraising & VC' },
    { id:'4', name:'Research VC Firms', description:'Research and document VC firms from calendar meetings', status:'popular' as const, tools:['Calendar','Docs'], lastActive:'', tasksCompleted:0, category:'Sales' },
    { id:'5', name:'News Digest', description:'The curated morning news straight to your inbox.', status:'popular' as const, tools:['Web'], lastActive:'', tasksCompleted:0, category:'Product' },
    { id:'6', name:'Blog Post', description:'Automatically write high-conversion blog posts from your company knowledge', status:'popular' as const, tools:['Web','AI'], lastActive:'', tasksCompleted:0, category:'Marketing' },
    { id:'7', name:'Scrape Product Hunt', description:'Scrape Product Hunt daily and return a list of trending companies', status:'popular' as const, tools:['Web'], lastActive:'', tasksCompleted:0, category:'Product' },
    { id:'8', name:'Deep Research on Investors', description:'Look up investor info before meetings.', status:'popular' as const, tools:['Web','Notion'], lastActive:'', tasksCompleted:0, category:'Fundraising & VC' },
    { id:'9', name:'Failed Payment Prevention', description:'Identify failed payments and help recover revenue with follow-ups', status:'popular' as const, tools:['Stripe'], lastActive:'', tasksCompleted:0, category:'Sales' },
  ];
  const [selectedTab, setSelectedTab] = useState<'Your agents'|'Templates'>('Templates');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const displayedAgents = (selectedTab === 'Your agents' ? yourAgents : templateAgents)
    .filter(a => {
      const matchesName = a.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedTab !== 'Templates'
        || selectedCategory === 'All'
        || ('category' in a && (a as any).category === selectedCategory);
      return matchesName && matchesCategory;
    });

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex min-h-screen">
        <Sidebar />
        
        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-[#1677FF] mb-2">Agents</h1>
                <p className="text-gray-600">Manage and monitor your AI agents</p>
              </div>
              
              <AddAgentDialog>
                <button className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Agent
                </button>
              </AddAgentDialog>
            </div>
            {/* Tabs */}
            <div className="flex items-center gap-4 mb-4">
              {['Your agents','Templates'].map(tab=>(
                <button key={tab}
                  onClick={()=>setSelectedTab(tab as any)}
                  className={`px-4 py-1 rounded-md ${selectedTab===tab? 'bg-[#1677FF] text-white':'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >{tab} {tab==='Your agents'?`(${yourAgents.length})`:''}</button>
              ))}
            </div>
            {/* Filters and Search Row */}
            {selectedTab === 'Templates' && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex space-x-3 overflow-x-auto">
                  {['All','Personal','Marketing','Sales','Customer support','Company','Product','Engineering','Fundraising & VC','YC'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-3 py-1 rounded-full ${cat === selectedCategory ? 'bg-[#1677FF] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                    >{cat}</button>
                  ))}
                </div>
                <div className="max-w-sm">
                  <input
                    type="text"
                    placeholder={`Search ${selectedTab.toLowerCase()}`}
                    value={searchTerm}
                    className="w-full px-3 py-2 border rounded-md"
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            )}
            {selectedTab !== 'Templates' && (
              <div className="mb-4 max-w-sm">
                <input type="text" placeholder={`Search ${selectedTab.toLowerCase()}`} value={searchTerm}
                  className="w-full px-3 py-2 border rounded-md" onChange={e=>setSearchTerm(e.target.value)} />
              </div>
            )}
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedAgents.map(agent=><AgentCard key={agent.id} agent={agent}/>)}
          </div>

          {/* Empty State when no agents */}
          {displayedAgents.length === 0 && (
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
