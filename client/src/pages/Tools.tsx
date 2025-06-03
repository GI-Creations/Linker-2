
import { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Sidebar from '@/components/Sidebar';

const Tools = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const toolCategories = [
    {
      name: 'Popular',
      tools: [
        { name: 'Gmail', description: 'Connect to Gmail to send and manage emails automatically', icon: '📧', status: 'Connected' },
        { name: 'GitHub', description: 'GitHub API Tool for repository management', icon: '🐙', status: 'Available' },
        { name: 'Google Calendar', description: 'Google Calendar is a time-management web application', icon: '📅', status: 'Connected' }
      ]
    },
    {
      name: 'Productivity',
      tools: [
        { name: 'Notion', description: 'Notion centralizes notes, docs, wikis and project management', icon: '📝', status: 'Available' },
        { name: 'Google Sheets', description: 'Google Sheets is a web-based spreadsheet application', icon: '📊', status: 'Connected' },
        { name: 'Slack', description: 'Slack is a channel-based messaging platform', icon: '💬', status: 'Available' }
      ]
    },
    {
      name: 'Developer Tools',
      tools: [
        { name: 'Google Drive', description: 'Connect to Google Drive for file management', icon: '💾', status: 'Connected' },
        { name: 'Linear', description: 'Connect to Linear to create and manage issues', icon: '📋', status: 'Available' },
        { name: 'Discord', description: 'An instant messaging and VoIP social platform', icon: '🎮', status: 'Available' }
      ]
    },
    {
      name: 'Communication',
      tools: [
        { name: 'LinkedIn', description: 'Professional networking and business connections', icon: '💼', status: 'Available' },
        { name: 'WhatsApp', description: 'Cross-platform messaging and Voice over IP service', icon: '📱', status: 'Available' },
        { name: 'Telegram', description: 'Cloud-based instant messaging service', icon: '✈️', status: 'Available' }
      ]
    },
    {
      name: 'Analytics & Data',
      tools: [
        { name: 'Google Analytics', description: 'Web analytics service for tracking website traffic', icon: '📈', status: 'Available' },
        { name: 'Stripe', description: 'Payment processing and financial management', icon: '💳', status: 'Available' },
        { name: 'Salesforce', description: 'Customer relationship management platform', icon: '👥', status: 'Available' }
      ]
    }
  ];

  const categories = ['All', ...toolCategories.map(cat => cat.name)];

  const filteredTools = toolCategories.filter(category =>
    selectedCategory === 'All' || category.name === selectedCategory
  ).map(category => ({
    ...category,
    tools: category.tools.filter(tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.tools.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#1677FF] mb-2">Tools</h1>
                <p className="text-gray-600">Connect and manage your integration tools</p>
              </div>

              <button className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Custom Tool
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={
                      `${selectedCategory === category ? 'btn-secondary font-bold' : 'btn-tertiary font-medium'} flex items-center gap-1`
                    }
                  >
                    <Filter className="w-3 h-3" />
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tools Categories */}
          <div className="space-y-8">
            {filteredTools.map((category) => (
              <div key={category.name} className="glass-card p-6">
                <h3 className="section-title text-[#1677FF]">{category.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.tools.map((tool) => (
                    <div key={tool.name} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 card-hover">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{tool.icon}</span>
                          <div>
                            <h4 className="font-semibold text-gray-800">{tool.name}</h4>
                            <Badge
                              variant={tool.status === 'Connected' ? 'default' : 'secondary'}
                              className={tool.status === 'Connected' ? 'text-xs bg-blue-50 text-[#1677FF] hover:bg-blue-50 hover:text-[#1677FF]' : 'text-xs text-[#1677FF]'}
                            >
                              {tool.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{tool.description}</p>
                      <div className="flex gap-2">
                        <button
                          size="sm"
                          variant={tool.status === 'Connected' ? 'outline' : 'default'}
                          className="btn-secondary"
                        >
                          {tool.status === 'Connected' ? 'Configure' : 'Connect'}
                        </button>
                        <button className='btn-tertiary text-sm'>
                          Learn More
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredTools.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tools found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filter criteria
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Tools;
