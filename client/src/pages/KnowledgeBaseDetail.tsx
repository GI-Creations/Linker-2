import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Upload, FileText, Download, Trash2, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Sidebar from '@/components/Sidebar';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'https://backend-app-6uva.onrender.com';

// Document interface
interface Document {
  name: string;
  type: string;
  size?: number;
  modified: string;
  path: string;
}

// Format file size to human readable format
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const KnowledgeBaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Get knowledge base info from location state or use defaults
  const location = useLocation();
  const [knowledgeBase, setKnowledgeBase] = useState({
    id: id || '',
    name: 'Knowledge Base',
    description: '',
    documentsCount: 0,
    lastUpdated: 'Never',
    status: 'active',
    size: '0 B'
  });

  // Update knowledge base info when location state changes
  useEffect(() => {
    const state = location.state as { kbName?: string; description?: string } | null;
    
    if (state?.kbName) {
      setKnowledgeBase(prev => ({
        ...prev,
        name: state.kbName,
        description: state.description || `Knowledge base for ${state.kbName}`
      }));
    } else if (id) {
      // If no location state, use the ID as the name
      setKnowledgeBase(prev => ({
        ...prev,
        name: id,
        description: `Knowledge base for ${id}`
      }));
    }
  }, [location.state, id]);

  useEffect(() => {
    fetchDocuments();
  }, [id]);

  const fetchDocuments = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      // TODO: Replace with actual user ID from your auth system
      const userId = 'current-user-id';
      const response = await axios.get(`${API_BASE_URL}/api/v1/files/${userId}/${id}`);
      const files = Array.isArray(response.data) ? response.data : [];
      
      setDocuments(files);
      
      // Update knowledge base info with document count and size
      const totalSize = files.reduce((sum: number, file: Document) => sum + (file.size || 0), 0);
      const lastUpdated = files.length > 0 
        ? new Date(Math.max(...files.map((f: Document) => new Date(f.modified || 0).getTime()))).toLocaleString()
        : 'Never';
      
      setKnowledgeBase(prev => ({
        ...prev,
        documentsCount: files.length,
        lastUpdated: lastUpdated,
        size: formatFileSize(totalSize)
      }));
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to fetch documents');
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      
      // Add all files to formData
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      // Add folder and userId
      formData.append('folder', id || '');
      formData.append('userId', 'current-user-id'); // TODO: Replace with actual user ID

      await axios.post(`${API_BASE_URL}/api/v1/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refresh documents list
      await fetchDocuments();
      setUploading(false);
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Failed to upload files');
      setUploading(false);
    }

    // Reset the input value so the same file can be uploaded again if needed
    event.target.value = '';
  };

  const handleDeleteDocument = async (docPath: string) => {
    try {
      // TODO: Implement delete API call
      console.log('Delete document:', docPath);
      // await axios.delete(`${API_BASE_URL}/api/v1/files/${docPath}`);
      // await fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    }
  };

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
                  <span>{documents.length} documents</span>
                  <span>{knowledgeBase.size}</span>
                  <span>Updated {knowledgeBase.lastUpdated}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {/* <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Edit
                </Button> */}
                <button  className=" btn-primary">
                  <label className="cursor-pointer flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload Documents'}
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4 w-full">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 rounded-full border bg-white shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-base w-full"
                />
              </div>
              
              {/* View Toggle Buttons */}
              <div className="flex items-center bg-gray-100 p-1 rounded-full">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-500 hover:bg-gray-200'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-500 hover:bg-gray-200'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Documents List/Grid View */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Documents ({filteredDocuments.length})</h3>
            </div>
            
            {loading ? (
              <div className="text-center py-16">
                <p>Loading documents...</p>
              </div>
            ) : viewMode === 'list' ? (
              /* List View */
              <div className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <div key={`${doc.name}-${doc.modified}`} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span>{doc.type}</span>
                            <span>{formatFileSize(doc.size || 0)}</span>
                            <span>Modified {new Date(doc.modified).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => window.open(`${API_BASE_URL}/api/v1/files/${doc.path}`, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteDocument(doc.path)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                {filteredDocuments.map((doc) => (
                  <div 
                    key={`${doc.name}-${doc.modified}`} 
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{doc.type}</p>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                        <span>{formatFileSize(doc.size || 0)}</span>
                        <span>{new Date(doc.modified).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-3 flex-1"
                          onClick={() => window.open(`${API_BASE_URL}/api/v1/files/${doc.path}`, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-2 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteDocument(doc.path)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredDocuments.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery ? 'Try adjusting your search criteria' : 'Upload documents to get started'}
                </p>
                <Button asChild>
                  <label className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First Document
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
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