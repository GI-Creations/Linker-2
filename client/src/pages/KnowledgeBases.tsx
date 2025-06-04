
import { useState } from 'react';
import { Search, Plus, FileText, Database, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Sidebar from '@/components/Sidebar';

const KnowledgeBases = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const knowledgeBases = [
    {
      id: '1',
      name: 'Product Documentation',
      description: 'Comprehensive product guides and API documentation',
      documentsCount: 245,
      lastUpdated: '2 hours ago',
      status: 'active',
      size: '2.4 MB'
    },
    {
      id: '2', 
      name: 'Customer Support FAQ',
      description: 'Frequently asked questions and support articles',
      documentsCount: 189,
      lastUpdated: '1 day ago',
      status: 'active',
      size: '1.8 MB'
    },
    {
      id: '3',
      name: 'Company Policies',
      description: 'Internal policies, procedures, and guidelines',
      documentsCount: 67,
      lastUpdated: '1 week ago',
      status: 'inactive',
      size: '945 KB'
    }
  ];

  const filteredKnowledgeBases = knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kb.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#1677FF] mb-2">Knowledge Bases</h1>
                <p className="text-gray-600">Manage your documents and knowledge repositories</p>
              </div>
              
              <button
               className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Knowledge Base
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <Input
                placeholder="Search knowledge bases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 rounded-full border  bg-white shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-base"
              />
            </div>
          </div>

          {/* Knowledge Bases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredKnowledgeBases.map((kb) => (
              <div key={kb.id} className="glass-card p-6 card-hover cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-blue-600" />
                    </div> */}
                    <div>
                      <h3 className="font-semibold text-gray-900">{kb.name}</h3>
                      {/* <Badge 
                        variant={kb.status === 'active' ? 'default' : 'secondary'}
                        className="bg-blue-50 text-[#1677FF] hover:bg-blue-50 hover:text-[#1677FF]"
                      >
                        {kb.status}
                      </Badge> */}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{kb.description}</p>
                
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {kb.documentsCount} documents
                    </span>
                    <span>{kb.size}</span>
                  </div>
                  <div className="text-gray-400">
                    Updated {kb.lastUpdated}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 items-center">
                  <button className="flex-1 btn-secondary  rounded-full px-6 text-base font-medium">
                    Open
                  </button>
                  <button className=" w-10 h-10 rounded-full flex items-center justify-center hover:text-[#1677FF] transition-all duration-200">
                    <Upload  />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredKnowledgeBases.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No knowledge bases found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery ? 'Try adjusting your search criteria' : 'Create your first knowledge base to store and organize documents'}
              </p>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Knowledge Base
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default KnowledgeBases;
