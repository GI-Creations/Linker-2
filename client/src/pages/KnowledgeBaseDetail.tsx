
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Upload, FileText, Download, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Sidebar from '@/components/Sidebar';

const KnowledgeBaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - in real app this would come from API
  const knowledgeBase = {
    id: id,
    name: 'Product Documentation',
    description: 'Comprehensive product guides and API documentation',
    documentsCount: 245,
    lastUpdated: '2 hours ago',
    status: 'active',
    size: '2.4 MB'
  };

  const documents = [
    {
      id: '1',
      name: 'API Reference Guide.pdf',
      type: 'PDF',
      size: '1.2 MB',
      lastModified: '2 hours ago',
      status: 'processed'
    },
    {
      id: '2',
      name: 'User Manual v2.3.docx',
      type: 'DOCX',
      size: '845 KB',
      lastModified: '1 day ago',
      status: 'processed'
    },
    {
      id: '3',
      name: 'Installation Guide.md',
      type: 'Markdown',
      size: '156 KB',
      lastModified: '3 days ago',
      status: 'processing'
    },
    {
      id: '4',
      name: 'Troubleshooting FAQ.txt',
      type: 'Text',
      size: '89 KB',
      lastModified: '1 week ago',
      status: 'processed'
    }
  ];

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/knowledge-bases')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Knowledge Bases
              </Button>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{knowledgeBase.name}</h1>
                  <Badge variant={knowledgeBase.status === 'active' ? 'default' : 'secondary'}>
                    {knowledgeBase.status}
                  </Badge>
                </div>
                <p className="text-gray-600">{knowledgeBase.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{knowledgeBase.documentsCount} documents</span>
                  <span>{knowledgeBase.size}</span>
                  <span>Updated {knowledgeBase.lastUpdated}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button className="btn-primary flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Documents
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Documents List */}
          <div className="glass-card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="section-title">Documents ({filteredDocuments.length})</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{doc.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span>{doc.type}</span>
                          <span>{doc.size}</span>
                          <span>Modified {doc.lastModified}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={doc.status === 'processed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {doc.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredDocuments.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery ? 'Try adjusting your search criteria' : 'Upload documents to get started'}
                </p>
                <Button className="btn-primary">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Document
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default KnowledgeBaseDetail;
