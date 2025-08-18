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
import { logger } from '@/lib/logger';

// Import new components
import { BatchFileUpload, type BatchFile } from '@/components/BatchFileUpload';
import { PDFPreview } from '@/components/PDFPreview';
import { EnhancedProgress } from '@/components/EnhancedProgress';
import { ResultComparison, type ComparisonResult } from '@/components/ResultComparison';

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
      logger.warn('Failed to parse NEXT_PUBLIC_MODEL_OPTIONS, using defaults:', e);
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
  confidence?: number;
  processingTime?: number;
}

interface ProcessingTask {
  id: string;
  fileId: string;
  fileName: string;
  apiId: string;
  apiName: string;
  pageNumber: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime?: number;
  endTime?: number;
  error?: string;
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
  // File management states
  const [selectedFiles, setSelectedFiles] = useState<BatchFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Keep for backward compatibility
  const [currentPreviewFile] = useState<File | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [processingTasks, setProcessingTasks] = useState<ProcessingTask[]>([]);
  const [results, setResults] = useState<OcrResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<{[key: number]: string}>({});
  const [favoriteResults, setFavoriteResults] = useState<Set<string>>(new Set());
  const [finalMarkdown, setFinalMarkdown] = useState('');
  
  // UI states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isAddApiDialogOpen, setIsAddApiDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  const [showEnhancedProgress, setShowEnhancedProgress] = useState(false);
  
  // Stream processing states (keep for backward compatibility)
  const [streamResults, setStreamResults] = useState<{[key: string]: string}>({});
  const [processingStatus, setProcessingStatus] = useState<{[key: string]: 'pending' | 'processing' | 'completed' | 'error'}>({});
  const [totalImages, setTotalImages] = useState(0);
  const [totalApis, setTotalApis] = useState(0);
  const [allProcessingCompleted, setAllProcessingCompleted] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add toast animations when component mounts (client-side only)
  useEffect(() => {
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
                logger.error('Stream error:', data.error);
                setToastMessage(t('upload.processError', { error: data.error }));
                setShowToast(true);
              } else if (data.type === 'complete') {
                setAllProcessingCompleted(true);
                setToastMessage(t('upload.processComplete'));
                setShowToast(true);
              } else if (data.type === 'heartbeat') {
                // Heartbeat to keep connection alive, no action needed
              }
            } catch (e) {
              logger.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error processing PDF:', error);
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

  // Batch file processing functions
  const handleBatchFilesChange = (files: BatchFile[]) => {
    setSelectedFiles(files);
  };

  const processBatchFiles = async (files: BatchFile[]) => {
    if (files.length === 0 || apiConfigs.length === 0) {
      setToastMessage(t('upload.noFileOrApi'));
      setShowToast(true);
      return;
    }

    setIsBatchProcessing(true);
    setShowEnhancedProgress(true);
    
    // Initialize processing tasks
    const tasks: ProcessingTask[] = [];
    files.forEach(file => {
      apiConfigs.forEach(api => {
        // Estimate pages (simplified - in real implementation, you'd get this from PDF)
        const estimatedPages = 1; // This should be calculated from PDF
        for (let page = 0; page < estimatedPages; page++) {
          tasks.push({
            id: `${file.id}-${api.id}-${page}`,
            fileId: file.id,
            fileName: file.file.name,
            apiId: api.id,
            apiName: api.name,
            pageNumber: page,
            status: 'pending',
            progress: 0,
            startTime: Date.now()
          });
        }
      });
    });
    
    setProcessingTasks(tasks);
    
    // Process files sequentially or in parallel
    try {
      for (const file of files) {
        await processSingleFileInBatch(file);
      }
      
      setToastMessage(t('upload.batchProcessComplete'));
      setShowToast(true);
    } catch (error) {
      logger.error('Batch processing error:', error);
      setToastMessage(t('upload.batchProcessError'));
      setShowToast(true);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const processSingleFileInBatch = async (file: BatchFile) => {
    // Update file status
    setSelectedFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, status: 'processing' } : f
    ));

    try {
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('api_configs', JSON.stringify(apiConfigs));
      
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      
      const response = await fetch(`${baseUrl}/api/ocr/stream`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Handle streaming response similar to processPdf
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('Failed to get response reader');
      }
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'result') {
                // Update results and task progress
                const newResult: OcrResult = {
                  pageNumber: data.page_number,
                  markdown: data.content,
                  apiId: data.api_id,
                  confidence: data.confidence,
                  processingTime: data.processing_time
                };
                
                setResults(prev => [...prev, newResult]);
                
                // Update task status
                setProcessingTasks(prev => prev.map(task => {
                  if (task.fileId === file.id && 
                      task.apiId === data.api_id && 
                      task.pageNumber === data.page_number) {
                    return {
                      ...task,
                      status: 'completed',
                      progress: 100,
                      endTime: Date.now()
                    };
                  }
                  return task;
                }));
              }
            } catch (e) {
              logger.error('Error parsing batch SSE data:', e);
            }
          }
        }
      }
      
      // Update file status to completed
      setSelectedFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'completed', progress: 100 } : f
      ));
      
    } catch (error) {
      logger.error('Error processing file in batch:', error);
      
      // Update file status to error
      setSelectedFiles(prev => prev.map(f => 
        f.id === file.id ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : String(error)
        } : f
      ));
    }
  };



  // Result comparison functions
  const convertToComparisonResults = (): ComparisonResult[] => {
    return results.map(result => ({
      id: `${result.apiId}-${result.pageNumber}`,
      apiName: apiConfigs.find(api => api.id === result.apiId)?.name || 'Unknown API',
      provider: apiConfigs.find(api => api.id === result.apiId)?.provider || 'Unknown',
      pageNumber: result.pageNumber,
      content: result.markdown,
      confidence: result.confidence,
      processingTime: result.processingTime,
      isSelected: selectedResults[result.pageNumber] === result.apiId,
      isFavorite: favoriteResults.has(`${result.apiId}-${result.pageNumber}`)
    }));
  };

  const handleResultSelect = (resultId: string, pageNumber: number) => {
    const apiId = resultId.split('-')[0];
    selectResult(pageNumber, apiId);
  };

  const handleResultFavorite = (resultId: string) => {
    setFavoriteResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  const handleCopyResult = (content: string) => {
    navigator.clipboard.writeText(content);
    setToastMessage(t('results.copied'));
    setShowToast(true);
  };

  const handleDownloadResult = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setToastMessage(t('results.downloaded'));
    setShowToast(true);
  };

  // Calculate processing statistics
  const getProcessingStats = () => {
    const totalTasks = processingTasks.length;
    const completedTasks = processingTasks.filter(t => t.status === 'completed').length;
    const errorTasks = processingTasks.filter(t => t.status === 'error').length;
    const processingTasksCount = processingTasks.filter(t => t.status === 'processing').length;
    const pendingTasks = processingTasks.filter(t => t.status === 'pending').length;
    
    const totalFiles = selectedFiles.length;
    const totalPages = Math.max(1, totalImages); // Use totalImages from stream or estimate
    const totalApis = apiConfigs.length;
    
    const startTime = Math.min(...processingTasks.map(t => t.startTime || Date.now()));
    const elapsedTime = Date.now() - startTime;
    
    const avgTimePerTask = completedTasks > 0 
      ? processingTasks
          .filter(t => t.status === 'completed' && t.startTime && t.endTime)
          .reduce((sum, t) => sum + (t.endTime! - t.startTime!), 0) / completedTasks
      : 0;
    
    const estimatedRemainingTime = avgTimePerTask > 0 
      ? (totalTasks - completedTasks) * avgTimePerTask
      : 0;
    
    return {
      totalFiles,
      totalPages,
      totalApis,
      totalTasks,
      completedTasks,
      errorTasks,
      processingTasks: processingTasksCount,
      pendingTasks,
      elapsedTime,
      estimatedRemainingTime,
      progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    };
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <Tabs.List className="flex border-b border-border mb-8 bg-muted/30 rounded-lg p-1 w-fit">
            <Tabs.Trigger 
              value="config" 
              className={cn(
                "px-6 py-3 font-medium text-sm rounded-md transition-all duration-200",
                "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50"
              )}
            >
              <Settings className="w-4 h-4 mr-2" />
              {t('tabs.config')}
            </Tabs.Trigger>
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
              value="batch" 
              className={cn(
                "px-6 py-3 font-medium text-sm rounded-md transition-all duration-200",
                "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50"
              )}
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('tabs.batch')}
              {selectedFiles.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedFiles.length}
                </Badge>
              )}
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

          {/* API Configuration Tab */}
          <Tabs.Content value="config" className="space-y-8">
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
          </Tabs.Content>

          {/* Single File Upload Tab */}
          <Tabs.Content value="upload" className="space-y-8">
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

          {/* Batch Processing Tab */}
          <Tabs.Content value="batch" className="space-y-8">
            <Card className="shadow-medium hover:shadow-hard transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('batch.title')}
                </CardTitle>
                <CardDescription>
                  {t('batch.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BatchFileUpload
                  files={selectedFiles}
                  onFilesChange={handleBatchFilesChange}
                  onProcessFiles={processBatchFiles}
                  isProcessing={isBatchProcessing}
                  maxFiles={10}
                />
              </CardContent>
            </Card>

            {/* Enhanced Progress Display */}
            {(isBatchProcessing || processingTasks.length > 0) && (
              <Card className="shadow-medium border-primary/20">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 animate-pulse" />
                      {t('progress.title')}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEnhancedProgress(!showEnhancedProgress)}
                    >
                      {showEnhancedProgress ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          {t('progress.hideDetails')}
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          {t('progress.showDetails')}
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {showEnhancedProgress ? (
                    <EnhancedProgress
                      tasks={processingTasks}
                      totalFiles={getProcessingStats().totalFiles}
                      totalPages={getProcessingStats().totalPages}
                      totalApis={getProcessingStats().totalApis}
                      isProcessing={isBatchProcessing}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">{getProcessingStats().totalFiles}</div>
                          <div className="text-sm text-muted-foreground">{t('progress.files')}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">{getProcessingStats().totalPages}</div>
                          <div className="text-sm text-muted-foreground">{t('progress.pages')}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">{getProcessingStats().totalApis}</div>
                          <div className="text-sm text-muted-foreground">{t('progress.apis')}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">{getProcessingStats().completedTasks}</div>
                          <div className="text-sm text-muted-foreground">{t('progress.completed')}</div>
                        </div>
                      </div>
                      <Progress value={getProcessingStats().progress} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* PDF Preview Dialog */}
            {showPDFPreview && currentPreviewFile && (
              <Dialog.Root open={showPDFPreview} onOpenChange={setShowPDFPreview}>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                  <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-auto">
                    <Dialog.Title className="text-xl font-semibold mb-4">
                      {t('preview.title')} - {currentPreviewFile.name}
                    </Dialog.Title>
                    <PDFPreview file={currentPreviewFile} />
                    <div className="flex justify-end mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowPDFPreview(false)}
                      >
                        {t('common.close')}
                      </Button>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            )}
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

          {/* Enhanced Result Comparison Tab */}
          <Tabs.Content value="comparison" className="space-y-8">
            {results.length > 0 ? (
              <Card className="shadow-medium hover:shadow-hard transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    {t('comparison.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('comparison.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResultComparison
                    results={convertToComparisonResults()}
                    selectedResults={selectedResults}
                    onResultSelect={handleResultSelect}
                    onResultFavorite={handleResultFavorite}
                    onCopyResult={handleCopyResult}
                    onDownloadResult={handleDownloadResult}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-medium">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('comparison.noResults')}</h3>
                  <p className="text-muted-foreground text-center">
                    {t('comparison.noResultsDescription')}
                  </p>
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
