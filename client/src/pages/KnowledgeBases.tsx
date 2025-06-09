import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, Database, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import Sidebar from '@/components/Sidebar';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:8000';
  
// Format file size to human readable format
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get the most recent modification date from files
const getLastUpdated = (files: any[]): string => {
  if (!files || files.length === 0) return 'Never';
  
  const latestFile = files.reduce((latest, current) => {
    const currentTime = new Date(current.modified || 0).getTime();
    const latestTime = new Date(latest.modified || 0).getTime();
    return currentTime > latestTime ? current : latest;
  }, files[0]);
  
  const modifiedDate = new Date(latestFile.modified);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - modifiedDate.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
  return modifiedDate.toLocaleDateString();
};

const KnowledgeBases = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKbs, setUploadingKbs] = useState<{[key: string]: boolean}>({});
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const [currentKbId, setCurrentKbId] = useState<string | null>(null);

  // Function to fetch knowledge bases
  const fetchKnowledgeBases = async () => {
    try {
      setLoading(true);
      const userId = 'current-user-id';
      
      // First, get all tickers (knowledge bases)
      const tickersResponse = await axios.get(`${API_BASE_URL}/api/v1/tickers/${userId}`);
      
      if (!tickersResponse?.data?.tickers) {
        throw new Error('Invalid response from server');
      }

      const tickers = tickersResponse.data.tickers || [];
      
      // For each ticker, fetch its files to get document count and size
      const knowledgeBasesWithFiles = await Promise.all(tickers.map(async (ticker: string) => {
        try {
          const filesResponse = await axios.get(`${API_BASE_URL}/api/v1/files/${userId}/${ticker}`);
          const files = Array.isArray(filesResponse.data) ? filesResponse.data : [];
          
          // Calculate total size
          const totalSize = files.reduce((sum: number, file: any) => {
            return sum + (file.size || 0);
          }, 0);
          
          return {
            id: ticker,
            name: ticker,
            description: `Knowledge base for ${ticker}`,
            documentsCount: files.length,
            lastUpdated: getLastUpdated(files),
            status: 'active',
            size: formatFileSize(totalSize),
            files: files
          };
        } catch (error) {
          console.error(`Error fetching files for ${ticker}:`, error);
          return {
            id: ticker,
            name: ticker,
            description: `Knowledge base for ${ticker}`,
            documentsCount: 0,
            lastUpdated: 'Never',
            status: 'error',
            size: '0 Bytes',
            files: []
          };
        }
      }));
      
      setKnowledgeBases(knowledgeBasesWithFiles);
    } catch (err) {
      console.error('Error fetching knowledge bases:', err);
      setError('Failed to fetch knowledge bases');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploadClick = (kbId: string) => {
    setCurrentKbId(kbId);
    fileInputRefs.current[kbId]?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentKbId) return;

    // Clear any previous errors
    setError(null);

    try {
      // Set uploading state for this specific knowledge base
      setUploadingKbs(prev => ({ ...prev, [currentKbId]: true }));
      
      const formData = new FormData();
      
      // Add all files to formData
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      // Add folder and userId
      const kb = knowledgeBases.find(kb => kb.id === currentKbId);
      if (!kb) {
        throw new Error('Knowledge base not found');
      }
      
      formData.append('folder', kb.name);
      formData.append('userId', 'current-user-id'); // TODO: Replace with actual user ID from auth context

      const response = await axios.post(`${API_BASE_URL}/api/v1/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status >= 200 && response.status < 300) {
        console.log('Upload successful:', response.data);
        
        // Refresh the knowledge bases list to show updated document count and size
        await fetchKnowledgeBases();
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }
      
    } catch (err: any) {
      console.error('Error uploading files:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload files';
      setError(errorMessage);
      
      // Show error for 5 seconds then clear it
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      // Clear uploading state for this knowledge base
      setUploadingKbs(prev => ({ ...prev, [currentKbId]: false }));
      
      // Reset file input
      const input = fileInputRefs.current[currentKbId];
      if (input) {
        input.value = '';
      }
    }
  };

  // Error alert component
  const ErrorAlert = () => (
    error ? (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center justify-between z-50" role="alert">
        <span className="block sm:inline">{error}</span>
        <button 
          className="ml-4 text-red-700"
          onClick={() => setError(null)}
          aria-label="Close error message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ) : null
  );

  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual user ID from your auth system
        const userId = 'current-user-id';
        
        // First, get all tickers (knowledge bases)
        const tickersResponse = await axios.get(`${API_BASE_URL}/api/v1/tickers/${userId}`);
        
        if (!tickersResponse?.data?.tickers) {
          throw new Error('Invalid response from server');
        }

        const tickers = tickersResponse.data.tickers || [];
        
        // For each ticker, fetch its files to get document count and size
        const knowledgeBasesWithFiles = await Promise.all(tickers.map(async (ticker: string) => {
          try {
            const filesResponse = await axios.get(`${API_BASE_URL}/api/v1/files/${userId}/${ticker}`);
            const files = Array.isArray(filesResponse.data) ? filesResponse.data : [];
            
            // Calculate total size
            const totalSize = files.reduce((sum: number, file: any) => {
              return sum + (file.size || 0);
            }, 0);
            
            return {
              id: ticker,
              name: ticker,
              description: `Knowledge base for ${ticker}`,
              documentsCount: files.length,
              lastUpdated: getLastUpdated(files),
              status: 'active',
              size: formatFileSize(totalSize),
              files: files // Store files for potential future use
            };
          } catch (error) {
            console.error(`Error fetching files for ${ticker}:`, error);
            return {
              id: ticker,
              name: ticker,
              description: `Knowledge base for ${ticker}`,
              documentsCount: 0,
              lastUpdated: 'Never',
              status: 'error',
              size: '0 Bytes',
              files: []
            };
          }
        }));
        
        setKnowledgeBases(knowledgeBasesWithFiles);
      } catch (err) {
        console.error('Error fetching knowledge bases:', err);
        setError('Failed to fetch knowledge bases');
      } finally {
        setLoading(false);
      }
    };

    fetchKnowledgeBases();
  }, []);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && tags.length < 5 && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Replace with actual user ID from your auth system
      const userId = 'current-user-id';
      
      // Save the new ticker
      await axios.post(`${API_BASE_URL}/api/v1/save_ticker`, {
        ticker: name,
        user_id: userId
      });

      // Refresh the knowledge bases list
      const response = await axios.get(`${API_BASE_URL}/api/v1/tickers/${userId}`);
      if (response && response.data) {
        const tickers = response.data.tickers || [];
        const transformedData = tickers.map((ticker: string) => ({
          id: ticker,
          name: ticker,
          description: `Knowledge base for ${ticker}`,
          documentsCount: 0,
          lastUpdated: 'Just now',
          status: 'active',
          size: '0 KB'
        }));
        setKnowledgeBases(transformedData);
      }

      // Reset form
      setName('');
      setDescription('');
      setTags([]);
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error creating knowledge base:', err);
      setError('Failed to create knowledge base. Please try again.');
    }
  };

  const filteredKnowledgeBases = knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kb.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="text-center py-16">
              <p>Loading knowledge bases...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="text-center py-16">
              <p className="text-red-500">{error}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ErrorAlert />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl  text-[#1677FF] mb-2">Knowledge Bases</h1>
                <p className="text-gray-600">Manage your documents and knowledge repositories</p>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button className="btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create Knowledge Base
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Knowledge Base</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <Input 
                      placeholder="Name" 
                      className="mb-4 w-full"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <Textarea 
                      placeholder="Description" 
                      className="w-full mb-4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map((tag) => (
                          <Badge 
                            key={tag}
                            variant="secondary"
                            className="flex items-center gap-1 bg-blue-50 text-blue-600"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-blue-800"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <Input
                        placeholder={tags.length >= 5 ? "Maximum tags reached" : "Add up to 5 tags (press Enter or comma)"}
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={addTag}
                        disabled={tags.length >= 5}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-end mt-6">
                      <Button type="submit">Create</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <Input
                placeholder="Search knowledge bases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 rounded-full border  bg-white shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-base"
              />
            </div>
          </div>

          {/* Knowledge Bases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr mb-8">
            {filteredKnowledgeBases.map((kb) => (
              <div key={kb.id} className="glass-card p-6 card-hover cursor-pointer h-full flex flex-col justify-between">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-blue-600" />
                    </div> */}
                    <div>
                      <h3 className="text-gray-900">{kb.name}</h3>
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
                  <button 
                    className="flex-1 btn-secondary rounded-full px-6 text-base font-medium"
                    onClick={() => navigate(`/knowledge-bases/${kb.id}`)}
                  >
                    Open
                  </button>
                  <button 
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${uploadingKbs[kb.id] ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 hover:text-[#1677FF]'}`}
                    onClick={() => handleFileUploadClick(kb.id)}
                    disabled={uploadingKbs[kb.id]}
                    title="Upload documents"
                  >
                    {uploadingKbs[kb.id] ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1677FF]"></div>
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={el => fileInputRefs.current[kb.id] = el}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                  />
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
              <h3 className="text-lg  text-gray-900 mb-2">No knowledge bases found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery ? 'Try adjusting your search criteria' : 'Create your first knowledge base to store and organize documents'}
              </p>
              {/* <Dialog>
                <DialogTrigger asChild>
                  <button className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Knowledge Basedd
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-lg w-full overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Create Knowledge Base</DialogTitle>
                  </DialogHeader>
                  <form>
                    <Input placeholder="Name" className="mb-4 w-full" />
                    <Textarea placeholder="Description" className="w-full" />
                    <div className="flex justify-end mt-6">
                      <button type="submit" className="btn-primary">Create</button>
                    </div>
                  </form>
                </DialogContent>

              </Dialog> */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default KnowledgeBases;
