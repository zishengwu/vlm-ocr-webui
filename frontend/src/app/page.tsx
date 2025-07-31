'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import * as Toast from '@radix-ui/react-toast';

import { Upload, FileText, Check, X, Copy, Loader2, Plus, Trash2, Download, Eye, EyeOff, Settings, Zap, Clock, CheckCircle } from 'lucide-react';
import MarkdownViewer from '@/components/MarkdownViewer';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ApiConfig {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
  provider: string;
}

// Get model options from environment variables or use defaults
const getModelOptions = () => {
  const envModels = process.env.NEXT_PUBLIC_MODEL_OPTIONS;
  if (envModels) {
    try {
      return JSON.parse(envModels);
    } catch (e) {
      console.warn('Failed to parse NEXT_PUBLIC_MODEL_OPTIONS, using defaults:', e);
    }
  }
  return [
    'gpt-4o',
    'gpt-4.1'
  ];
};

const MODEL_OPTIONS = getModelOptions();

// Provider options
const PROVIDER_OPTIONS = [
  { value: 'OpenAI', label: 'OpenAI' },
  { value: 'Ollama', label: 'Ollama' },
  { value: 'siliconflow', label: 'SiliconFlow' },
  { value: 'anthropic', label: 'Anthropic' },
];

interface OcrResult {
  pageNumber: number;
  markdown: string;
  apiId: string;
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [newApiName, setNewApiName] = useState('');
  const [newApiEndpoint, setNewApiEndpoint] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [newApiModel, setNewApiModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [newApiProvider, setNewApiProvider] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<OcrResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<{[key: number]: string}>({});
  const [finalMarkdown, setFinalMarkdown] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isAddApiDialogOpen, setIsAddApiDialogOpen] = useState(false);
  
  // Stream processing states
  const [streamResults, setStreamResults] = useState<{[key: string]: string}>({});
  const [processingStatus, setProcessingStatus] = useState<{[key: string]: 'pending' | 'processing' | 'completed' | 'error'}>({});
  const [totalImages, setTotalImages] = useState(0);
  const [totalApis, setTotalApis] = useState(0);
  const [allProcessingCompleted, setAllProcessingCompleted] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add toast animations when component mounts (client-side only)
  useEffect(() => {
    console.log('i18n object:', i18n);
    console.log('Type of i18n.changeLanguage:', typeof i18n.changeLanguage);
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(calc(100% + 1rem)); }
        to { transform: translateX(0); }
      }
      @keyframes hide {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes swipeOut {
        from { transform: translateX(var(--radix-toast-swipe-end-x)); }
        to { transform: translateX(calc(100% + 1rem)); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [i18n]);

  // Load default configuration from environment variables
  useEffect(() => {
    // Only load default config if no configs exist
    if (apiConfigs.length === 0) {
      const endpoint = process.env.NEXT_PUBLIC_API_ENDPOINT || '';
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || '';
      
      if (endpoint) {
        const defaultConfig: ApiConfig = {
          id: 'api-1',
          name: process.env.NEXT_PUBLIC_API_NAME || 'Default API',
          endpoint,
          apiKey,
          model: process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'gpt-4o',
          provider: process.env.NEXT_PUBLIC_DEFAULT_PROVIDER || 'OpenAI'
        };
        
        setApiConfigs([defaultConfig]);
        console.log('Loaded default configuration from environment variables:', defaultConfig);
      }
    }
  }, [apiConfigs.length]);

  // Add a new API configuration
  const addApiConfig = () => {
    if (!newApiName || !newApiEndpoint) {
      setToastMessage(t('apiConfig.requiredFields'));
      setShowToast(true);
      return;
    }
    
    // Determine which model to use
    let modelToUse = '';
    if (newApiModel === 'custom') {
      // Use the custom model input
      if (!customModel.trim()) {
        setToastMessage(t('apiConfig.modelRequired'));
        setShowToast(true);
        return;
      }
      modelToUse = customModel;
    } else if (newApiModel) {
      // Use the selected model from dropdown
      modelToUse = newApiModel;
    } else {
      // No model selected
      setToastMessage(t('apiConfig.modelRequired'));
      setShowToast(true);
      return;
    }
    
    const newConfig: ApiConfig = {
      id: `api-${apiConfigs.length + 1}`,
      name: newApiName || `API ${apiConfigs.length + 1}`,
      endpoint: newApiEndpoint,
      apiKey: newApiKey,
      model: modelToUse,
      provider: newApiProvider || 'OpenAI'
    };
    
    setApiConfigs([...apiConfigs, newConfig]);
    setNewApiName('');
    setNewApiEndpoint('');
    setNewApiKey('');
    setNewApiModel('');
    setCustomModel('');
    setNewApiProvider('');
    setIsAddApiDialogOpen(false);
    
    setToastMessage(t('apiConfig.added'));
    setShowToast(true);
  };
  
  // Handle dialog open state change
  const handleDialogOpenChange = (open: boolean) => {
    setIsAddApiDialogOpen(open);
    
    // If dialog is opening, set default values from environment variables
    if (open) {
      setNewApiName(process.env.NEXT_PUBLIC_API_NAME || '');
      setNewApiEndpoint(process.env.NEXT_PUBLIC_API_ENDPOINT || '');
      setNewApiKey(process.env.NEXT_PUBLIC_API_KEY || '');
      setNewApiProvider(process.env.NEXT_PUBLIC_DEFAULT_PROVIDER || 'OpenAI');
      
      const defaultModel = process.env.NEXT_PUBLIC_DEFAULT_MODEL || '';
      if (defaultModel) {
        if (MODEL_OPTIONS.includes(defaultModel)) {
          // If the default model is in our predefined list, select it from dropdown
          setNewApiModel(defaultModel);
          setCustomModel('');
        } else {
          // If the default model is not in our list, use it as a custom model
          setNewApiModel('custom');
          setCustomModel(defaultModel);
        }
      } else {
        setNewApiModel('');
        setCustomModel('');
      }
    }
  };

  // Remove an API configuration
  const removeApiConfig = (id: string) => {
    setApiConfigs(apiConfigs.filter(config => config.id !== id));
    setToastMessage(t('apiConfig.removed'));
    setShowToast(true);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setToastMessage(t('upload.fileSelected', { fileName: e.target.files[0].name }));
      setShowToast(true);
    }
  };

  // Process the PDF with streaming
  const processPdf = async () => {
    if (!selectedFile || apiConfigs.length === 0) {
      setToastMessage(t('upload.noFileOrApi'));
      setShowToast(true);
      return;
    }
    
    setIsProcessing(true);
    setResults([]);
    setStreamResults({});
    setProcessingStatus({});
    setAllProcessingCompleted(false);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('api_configs', JSON.stringify(apiConfigs));
      
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      console.log('Using API address:', baseUrl);
      console.log('Sending API configuration:', JSON.stringify(apiConfigs));
      
      const response = await fetch(`${baseUrl}/api/ocr/stream`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('Failed to get response reader');
      }
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'info') {
                setTotalImages(data.total_pages);
                setTotalApis(data.total_apis);
                
                // Initialize processing status
                const initialStatus: {[key: string]: 'pending' | 'processing' | 'completed' | 'error'} = {};
                for (let i = 0; i < data.total_pages; i++) {
                  for (let j = 0; j < data.total_apis; j++) {
                    const key = `${i}-${j}`;
                    initialStatus[key] = 'pending';
                  }
                }
                setProcessingStatus(initialStatus);
              } else if (data.type === 'result') {
                const result = data.result;
                const key = `${result.page - 1}-${data.api_index}`; // Convert to 0-based indexing
                
                setStreamResults(prev => ({
                  ...prev,
                  [key]: result.content
                }));
                // Status update is now handled above with completion check
                
                // Also add to results for compatibility
                const newResult: OcrResult = {
                  pageNumber: result.page - 1, // Convert to 0-based indexing
                  markdown: result.content,
                  apiId: `api-${data.api_index + 1}` // Generate API ID based on index
                };
                setResults(prev => [...prev, newResult]);
                
                // Check if all processing is completed
                setProcessingStatus(currentStatus => {
                  const updatedStatus: {[key: string]: 'pending' | 'processing' | 'completed' | 'error'} = {
                    ...currentStatus,
                    [key]: result.success ? 'completed' : 'error'
                  };
                  
                  // Check if all tasks are completed or errored
                  const allCompleted = Object.values(updatedStatus).every(status => 
                    status === 'completed' || status === 'error'
                  );
                  
                  if (allCompleted && Object.keys(updatedStatus).length === totalImages * totalApis) {
                    setAllProcessingCompleted(true);
                  }
                  
                  return updatedStatus;
                });
              } else if (data.type === 'error') {
                console.error('Stream error:', data.error);
                setToastMessage(t('upload.processError', { error: data.error }));
                setShowToast(true);
              } else if (data.type === 'complete') {
                setAllProcessingCompleted(true);
                setToastMessage(t('upload.processComplete'));
                setShowToast(true);
              } else if (data.type === 'heartbeat') {
                // Heartbeat to keep connection alive, no action needed
                console.log('Received heartbeat');
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      setToastMessage(t('upload.processError', { error: error instanceof Error ? error.message : String(error) }));
      setShowToast(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Select a result for a specific page
  const selectResult = (pageNumber: number, apiId: string) => {
    setSelectedResults({
      ...selectedResults,
      [pageNumber]: apiId
    });
    setToastMessage(t('results.selected'));
    setShowToast(true);
  };

  // Combine selected results into final markdown
  const combineResults = () => {
    if (Object.keys(selectedResults).length === 0) {
      setToastMessage(t('results.noSelection'));
      setShowToast(true);
      return;
    }
    
    const combinedMarkdown = Object.entries(selectedResults)
      .sort(([pageA], [pageB]) => parseInt(pageA) - parseInt(pageB))
      .map(([pageNumber, apiId]) => {
        const result = results.find(r => r.pageNumber === parseInt(pageNumber) && r.apiId === apiId);
        return result ? result.markdown : '';
      })
      .join('\n\n---\n\n');
    
    setFinalMarkdown(combinedMarkdown);
    setToastMessage(t('results.combined'));
    setShowToast(true);
  };

  // Copy markdown to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalMarkdown);
    setToastMessage(t('results.copied'));
    setShowToast(true);
  };

  // Download markdown file
  const downloadMarkdown = () => {
    // Create Blob object
    const blob = new Blob([finalMarkdown], { type: 'text/markdown' });
    // Create URL
    const url = URL.createObjectURL(blob);
    // Create temporary a tag
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-result-${new Date().toISOString().slice(0, 10)}.md`;
    // Trigger click
    document.body.appendChild(a);
    a.click();
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setToastMessage(t('results.downloaded'));
    setShowToast(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        <Tabs.Root defaultValue="upload" className="flex flex-col">
          <Tabs.List className="flex border-b border-border mb-8 bg-muted/30 rounded-lg p-1 w-fit">
            <Tabs.Trigger 
              value="upload" 
              className={cn(
                "px-6 py-3 font-medium text-sm rounded-md transition-all duration-200",
                "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50"
              )}
            >
              <Upload className="w-4 h-4 mr-2" />
              {t('tabs.upload')}
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="results" 
              className={cn(
                "px-6 py-3 font-medium text-sm rounded-md transition-all duration-200",
                "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              disabled={results.length === 0}
            >
              <Zap className="w-4 h-4 mr-2" />
              {t('tabs.results')}
              {results.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {results.length}
                </Badge>
              )}
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="final" 
              className={cn(
                "px-6 py-3 font-medium text-sm rounded-md transition-all duration-200",
                "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              disabled={!finalMarkdown}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {t('tabs.final')}
            </Tabs.Trigger>
          </Tabs.List>

          {/* Upload & Process Tab */}
          <Tabs.Content value="upload" className="space-y-8">
            {/* API Configuration Section */}
            <Card className="shadow-medium hover:shadow-hard transition-shadow duration-300">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      {t('apiConfig.title')}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {t('apiConfig.description')}
                    </CardDescription>
                  </div>
                  <Dialog.Root open={isAddApiDialogOpen} onOpenChange={handleDialogOpenChange}>
                    <Dialog.Trigger asChild>
                      <Button className="shadow-sm hover:shadow-md transition-shadow">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('apiConfig.addButton')}
                      </Button>
                    </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
                      <Dialog.Title className="text-xl font-semibold mb-4">{t('apiConfig.addDialogTitle')}</Dialog.Title>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">{t('apiConfig.nameLabel')}</label>
                          <input
                            type="text"
                            value={newApiName}
                            onChange={(e) => setNewApiName(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            placeholder={t('apiConfig.namePlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">{t('apiConfig.endpointLabel')}</label>
                          <input
                            type="text"
                            value={newApiEndpoint}
                            onChange={(e) => setNewApiEndpoint(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            placeholder={t('apiConfig.endpointPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">{t('apiConfig.providerLabel')}</label>
                          <select
                            value={newApiProvider}
                            onChange={(e) => setNewApiProvider(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                          >
                            {PROVIDER_OPTIONS.map((provider) => (
                              <option key={provider.value} value={provider.value}>{provider.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">{t('apiConfig.apiKeyLabel')}</label>
                          <div className="relative">
                            <input
                              type={showApiKey ? "text" : "password"}
                              value={newApiKey}
                              onChange={(e) => setNewApiKey(e.target.value)}
                              className="w-full p-2 pr-10 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                              placeholder={t('apiConfig.apiKeyPlaceholder')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">{t('apiConfig.modelLabel')}</label>
                          <select
                            value={newApiModel === 'custom' ? 'custom' : MODEL_OPTIONS.includes(newApiModel) ? newApiModel : ''}
                            onChange={(e) => {
                              if (e.target.value === 'custom') {
                                // If custom is selected and we have a model value that's not in MODEL_OPTIONS, keep it as custom value
                                if (newApiModel && !MODEL_OPTIONS.includes(newApiModel)) {
                                  setCustomModel(newApiModel);
                                }
                                setNewApiModel('custom');
                              } else {
                                setNewApiModel(e.target.value);
                                setCustomModel('');
                              }
                            }}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                          >
                            {/* <option value="">{t('apiConfig.selectModel')}</option> */}
                            {MODEL_OPTIONS.map((model: string) => (
                              <option key={model} value={model}>{model}</option>
                            ))}
                            <option value="custom">{t('apiConfig.customModel')}</option>
                          </select>
                        </div>
                        
                        {newApiModel === 'custom' && (
                          <div>
                            <label className="block text-sm font-medium mb-1">{t('apiConfig.customModelLabel')}</label>
                            <input
                              type="text"
                              value={customModel}
                              onChange={(e) => setCustomModel(e.target.value)}
                              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                              placeholder={t('apiConfig.customModelPlaceholder')}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <Dialog.Close asChild>
                          <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">
                            {t('common.cancel')}
                          </button>
                        </Dialog.Close>
                        <button
                            onClick={addApiConfig}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            {t('common.add')}
                          </button>
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
              </CardHeader>
              <CardContent>
                {/* List of configured APIs */}
                {apiConfigs.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">{t('apiConfig.emptyState')}</p>
                    <p className="text-sm text-muted-foreground/70 mt-2">{t('apiConfig.emptyHint')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {apiConfigs.map((config) => (
                      <Card key={config.id} className="border-border/50 hover:border-border transition-colors">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-medium">{config.name}</h3>
                                <Badge variant="outline">{config.provider}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{config.endpoint}</p>
                              {config.model && (
                                <p className="text-xs text-muted-foreground/70 mt-1">{t('apiConfig.modelPrefix')}{config.model}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeApiConfig(config.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label={t('apiConfig.deleteApiConfig')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Upload Section */}
            <Card className="shadow-medium hover:shadow-hard transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  {t('upload.title')}
                </CardTitle>
                <CardDescription>
                  {t('upload.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                  />
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  {selectedFile ? (
                    <div className="text-center">
                      <div className="flex items-center gap-2 text-primary font-medium">
                        <FileText size={18} />
                        {selectedFile.name}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="font-medium">{t('upload.dragDrop')}</p>
                      <p className="text-sm text-muted-foreground mt-2">{t('upload.supportedFormat')}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <Button
                    onClick={processPdf}
                    disabled={!selectedFile || apiConfigs.length === 0 || isProcessing}
                    className="w-full shadow-sm hover:shadow-md transition-shadow"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        {t('upload.processing')}
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        {t('upload.processButton')}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Tabs.Content>

          {/* Results Tab */}
          <Tabs.Content value="results" className="space-y-8">
            {/* Show processing status only when processing and not all completed */}
            {(isProcessing || totalImages > 0) && !allProcessingCompleted && (
              <Card className="shadow-medium border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 animate-pulse" />
                    {t('message.processingStatus')}
                  </CardTitle>
                  <CardDescription>
                    {t('message.processingDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{totalApis}</div>
                      <div className="text-sm text-muted-foreground">{t('message.apiCount')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{totalImages}</div>
                      <div className="text-sm text-muted-foreground">{t('message.imageCount')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {Object.values(processingStatus).filter(status => status === 'completed').length}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('message.completed')}</div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('message.progressLabel')}</span>
                      <span>{totalImages * totalApis > 0 ? Math.round((Object.values(processingStatus).filter(status => status === 'completed').length / (totalImages * totalApis)) * 100) : 0}%</span>
                    </div>
                    <Progress 
                      value={Object.values(processingStatus).filter(status => status === 'completed').length} 
                      max={totalImages * totalApis}
                      className="h-3"
                    />
                  </div>
                
                {/* Processing Grid */}
                {totalImages > 0 && (
                  <div className="space-y-6">
                    {Array.from({length: totalImages}, (_, imageIndex) => (
                      <div key={imageIndex} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 font-medium flex items-center">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mr-3">
                            {imageIndex + 1}
                          </span>
                          {t('message.currentPage')} {imageIndex + 1}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                          {apiConfigs.map((api, apiIndex) => {
                            const key = `${imageIndex}-${apiIndex}`;
                            const status = processingStatus[key] || 'pending';
                            const result = streamResults[key];
                            
                            return (
                              <div key={api.id} className="border rounded-lg overflow-hidden">
                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-750 border-b">
                                  <h4 className="font-medium">{api.name}</h4>
                                  <Badge 
                                  variant={
                                    status === 'pending' ? 'secondary' :
                                    status === 'processing' ? 'default' :
                                    status === 'completed' ? 'success' :
                                    'destructive'
                                  }
                                  className="text-xs"
                                >
                                    {status === 'pending' && t('message.pending')}
                                    {status === 'processing' && (
                                      <div className="flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        {t('message.processing')}
                                      </div>
                                    )}
                                    {status === 'completed' && t('message.completed')}
                                    {status === 'error' && t('message.error')}
                                  </Badge>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-3 min-h-[100px]">
                                  {result ? (
                                    <pre className="text-sm whitespace-pre-wrap font-mono overflow-auto max-h-60">{result}</pre>
                                  ) : (
                                    <div className="flex items-center justify-center h-20 text-gray-400 dark:text-gray-500">
                                      {status === 'pending' && t('message.pending')}
                                      {status === 'processing' && t('message.processing')}
                                      {status === 'error' && t('message.error')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
            
          {/* Show results selection only when all processing is completed */}
          {allProcessingCompleted && results.length > 0 && (
            <Card className="shadow-medium">
               <CardHeader>
                 <div className="flex justify-between items-center">
                   <CardTitle className="flex items-center gap-2">
                     <Zap className="w-5 h-5" />
                     {t('tabs.results')}
                   </CardTitle>
                   <Button
                     onClick={combineResults}
                     disabled={Object.keys(selectedResults).length === 0}
                     className="shadow-sm hover:shadow-md transition-shadow"
                   >
                     <Check className="w-4 h-4 mr-2" />
                     {t('results.combineSelected')}
                   </Button>
                 </div>
               </CardHeader>
               <CardContent className="space-y-8">
                  {/* Group results by page number */}
                   {Array.from(new Set(results.map(r => r.pageNumber))).sort((a, b) => a - b).map(pageNumber => (
                     <Card key={pageNumber} className="border-border/50">
                       <CardHeader className="bg-muted/30">
                         <CardTitle className="flex items-center gap-3">
                           <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                             {pageNumber + 1}
                           </div>
                           {t('results.page', { page: pageNumber + 1 })}
                         </CardTitle>
                       </CardHeader>
                       <CardContent className="p-6">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                           {results.filter(r => r.pageNumber === pageNumber).map(result => (
                             <Card key={result.apiId} className="border-border/50 hover:border-border transition-colors">
                               <CardHeader className="pb-3">
                                 <div className="flex justify-between items-center">
                                   <CardTitle className="text-base">
                                     {apiConfigs.find(c => c.id === result.apiId)?.name || t('results.unknownApi')}
                                   </CardTitle>
                                   <Button
                                     onClick={() => selectResult(pageNumber, result.apiId)}
                                     variant={selectedResults[pageNumber] === result.apiId ? "default" : "outline"}
                                     size="sm"
                                     className="shadow-sm hover:shadow-md transition-shadow"
                                   >
                                     {selectedResults[pageNumber] === result.apiId ? (
                                       <>
                                         <Check className="w-4 h-4 mr-1" />
                                         {t('results.selectedButton')}
                                       </>
                                     ) : (
                                       t('results.selectButton')
                                     )}
                                   </Button>
                                 </div>
                               </CardHeader>
                               <CardContent className="pt-0">
                                 <div className="bg-muted/30 p-4 rounded-md overflow-auto max-h-80">
                                   <pre className="text-sm whitespace-pre-wrap font-mono">{result.markdown}</pre>
                                 </div>
                               </CardContent>
                             </Card>
                           ))}
                         </div>
                       </CardContent>
                     </Card>
                   ))}
                </CardContent>
              </Card>
            )}
          </Tabs.Content>

          {/* Final Result Tab */}
          <Tabs.Content value="final" className="space-y-8">
            {finalMarkdown ? (
              <Card className="shadow-medium hover:shadow-hard transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {t('finalResult.title')}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {t('finalResult.description')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        className="shadow-sm hover:shadow-md transition-shadow"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {t('finalResult.copyToClipboard')}
                      </Button>
                      <Button
                        onClick={downloadMarkdown}
                        className="shadow-sm hover:shadow-md transition-shadow"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {t('finalResult.downloadMarkdown')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('finalResult.editLabel')}</label>
                    <textarea
                      className="w-full h-96 p-4 border border-border rounded-md bg-background font-mono text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                      value={finalMarkdown}
                      onChange={(e) => setFinalMarkdown(e.target.value)}
                      placeholder={t('finalResult.placeholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('finalResult.previewLabel')}</label>
                    <Card className="border-border/50">
                      <CardContent className="p-6 bg-muted/30 overflow-auto max-h-[60vh]">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <MarkdownViewer content={finalMarkdown} />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-medium">
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('finalResult.noFinalResult')}</p>
                      <p className="text-sm text-muted-foreground/70 mt-2">{t('finalResult.selectAndCombinePrompt')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </main>

      {/* Toast Notification */}
      <Toast.Provider swipeDirection="right">
        <Toast.Root
          className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex items-center gap-3 border border-gray-200 dark:border-gray-700 data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out] data-[swipe=end]:animate-swipeOut"
          open={showToast}
          onOpenChange={setShowToast}
          duration={3000}
        >
          <Toast.Title className="font-medium">{toastMessage}</Toast.Title>
          <Toast.Close className="ml-auto text-gray-400 hover:text-gray-500">
            <X size={16} />
          </Toast.Close>
        </Toast.Root>
        <Toast.Viewport className="fixed bottom-0 right-0 p-6 w-full max-w-sm flex flex-col gap-2 outline-none" />
      </Toast.Provider>
    </div>
  );
}
