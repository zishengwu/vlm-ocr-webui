'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// import Image from 'next/image';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import * as Toast from '@radix-ui/react-toast';
import { clsx } from 'clsx';
import { Upload, FileText, Check, X, Copy, Loader2, Plus, Trash2, Download } from 'lucide-react';

interface ApiConfig {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
}

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
  const [newApiModel, setNewApiModel] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<OcrResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<{[key: number]: string}>({});
  const [finalMarkdown, setFinalMarkdown] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isAddApiDialogOpen, setIsAddApiDialogOpen] = useState(false);
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

  // Add a new API configuration
  const addApiConfig = () => {
    if (!newApiName || !newApiEndpoint) {
      setToastMessage('API名称和端点URL是必填项');
      setShowToast(true);
      return;
    }
    
    const newConfig: ApiConfig = {
      id: `api-${apiConfigs.length + 1}`,
      name: newApiName || `API ${apiConfigs.length + 1}`,
      endpoint: newApiEndpoint,
      apiKey: newApiKey,
      model: newApiModel
    };
    
    setApiConfigs([...apiConfigs, newConfig]);
    setNewApiName('');
    setNewApiEndpoint('');
    setNewApiKey('');
    setNewApiModel('');
    setIsAddApiDialogOpen(false);
    
    setToastMessage(t('apiConfig.added'));
    setShowToast(true);
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

  // Process the PDF with all configured APIs
  const processPdf = async () => {
    if (!selectedFile || apiConfigs.length === 0) {
      setToastMessage(t('upload.noFileOrApi'));
      setShowToast(true);
      return;
    }
    
    setIsProcessing(true);
    setResults([]);
    
    try {
      // 使用实际的后端API调用替换模拟数据
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('api_configs', JSON.stringify(apiConfigs));
      
      // 使用第一个API配置的endpoint作为基础URL，或者使用本地后端地址
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      console.log('使用API地址:', baseUrl);
      console.log('发送API配置:', JSON.stringify(apiConfigs));
      
      const response = await fetch(`${baseUrl}/api/ocr`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('收到API响应:', data);
      
      // 将后端返回的结果转换为前端需要的格式
      const apiResults: OcrResult[] = [];
      if (data.results && Array.isArray(data.results)) {
        // 处理每个页面的结果
        data.results.forEach((markdown: string, index: number) => {
          // 检查是否包含API结果标记
          if (markdown.includes('## ') && markdown.includes(' 结果')) {
            // 分割不同API的结果
            const sections = markdown.split('---').filter(section => section.trim());
            
            for (const section of sections) {
              // 提取API名称
              const nameMatch = section.match(/## ([^\n]+) 结果/);
              if (nameMatch) {
                const apiName = nameMatch[1];
                // 找到对应的API配置
                const apiConfig = apiConfigs.find(config => config.name === apiName);
                if (apiConfig) {
                  // 移除标题，只保留内容
                  const content = section.replace(/## [^\n]+ 结果\n\n/, '');
                  apiResults.push({
                    pageNumber: index,
                    markdown: content.trim(),
                    apiId: apiConfig.id
                  });
                } else {
                  // 如果找不到匹配的API配置，使用第一个API配置
                  if (apiConfigs.length > 0) {
                    console.warn(`未找到名为"${apiName}"的API配置，使用第一个API配置`);
                    apiResults.push({
                      pageNumber: index,
                      markdown: section.replace(/## [^\n]+ 结果\n\n/, '').trim(),
                      apiId: apiConfigs[0].id
                    });
                  }
                }
              }
            }
          } else {
            // 如果没有API结果标记，使用第一个API配置
            if (apiConfigs.length > 0) {
              apiResults.push({
                pageNumber: index,
                markdown: markdown,
                apiId: apiConfigs[0].id
              });
            }
          }
        });
      }
      
      // 按页码排序结果
      apiResults.sort((a, b) => a.pageNumber - b.pageNumber);
      setResults(apiResults);
      
      setToastMessage(t('upload.processComplete'));
      setShowToast(true);
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
    // 创建Blob对象
    const blob = new Blob([finalMarkdown], { type: 'text/markdown' });
    // 创建URL
    const url = URL.createObjectURL(blob);
    // 创建临时a标签
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-result-${new Date().toISOString().slice(0, 10)}.md`;
    // 触发点击
    document.body.appendChild(a);
    a.click();
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setToastMessage(t('results.downloaded'));
    setShowToast(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm py-6">
        <div className="container mx-auto px-4">
          
          <h1 className="text-3xl font-bold text-center">{t('title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mt-2">{t('subtitle')}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs.Root defaultValue="upload" className="flex flex-col">
          <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
            <Tabs.Trigger 
              value="upload" 
              className={clsx(
                "px-4 py-2 -mb-px font-medium text-sm",
                "data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400",
                "data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-gray-300"
              )}
            >
              {t('tabs.upload')}
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="results" 
              className={clsx(
                "px-4 py-2 -mb-px font-medium text-sm",
                "data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400",
                "data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-gray-300"
              )}
              disabled={results.length === 0}
            >
              {t('tabs.results')}
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="final" 
              className={clsx(
                "px-4 py-2 -mb-px font-medium text-sm",
                "data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400",
                "data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-gray-300"
              )}
              disabled={!finalMarkdown}
            >
              {t('tabs.final')}
            </Tabs.Trigger>
          </Tabs.List>

          {/* Upload & Process Tab */}
          <Tabs.Content value="upload" className="space-y-8">
            {/* API Configuration Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">{t('apiConfig.title')}</h2>
                <Dialog.Root open={isAddApiDialogOpen} onOpenChange={setIsAddApiDialogOpen}>
                  <Dialog.Trigger asChild>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      <Plus size={16} />
                      {t('apiConfig.addButton')}
                    </button>
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
                          <label className="block text-sm font-medium mb-1">{t('apiConfig.apiKeyLabel')}</label>
                          <input
                            type="password"
                            value={newApiKey}
                            onChange={(e) => setNewApiKey(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            placeholder={t('apiConfig.apiKeyPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">{t('apiConfig.modelLabel')}</label>
                          <input
                            type="text"
                            value={newApiModel}
                            onChange={(e) => setNewApiModel(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            placeholder={t('apiConfig.modelPlaceholder')}
                          />
                        </div>
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

              {/* List of configured APIs */}
              {apiConfigs.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">{t('apiConfig.emptyState')}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('apiConfig.emptyHint')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {apiConfigs.map((config) => (
                    <div key={config.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{config.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{config.endpoint}</p>
                          {config.model && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('apiConfig.modelPrefix')}{config.model}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeApiConfig(config.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          aria-label={t('apiConfig.deleteApiConfig')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* File Upload Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">{t('upload.title')}</h2>
              
              <div 
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                </div>
                {selectedFile ? (
                  <div className="text-center">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                      <FileText size={18} />
                      {selectedFile.name}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-700 dark:text-gray-300 font-medium">{t('upload.dragDrop')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('upload.supportedFormat')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('upload.supportedFormat')}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={processPdf}
                  disabled={!selectedFile || apiConfigs.length === 0 || isProcessing}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('upload.processing')}
                    </>
                  ) : (
                    <>
                    <>{t('upload.processButton')}</>
                    </>
                  )}
                </button>
              </div>
            </div>
          </Tabs.Content>

          {/* Results Tab */}
          <Tabs.Content value="results" className="space-y-8">
            {results.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">{t('tabs.results')}</h2>
                  <button
                    onClick={combineResults}
                    disabled={Object.keys(selectedResults).length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={16} />
                    {t('results.combineSelected')}
                  </button>
                </div>
                
                <div className="space-y-8">
                  {/* Group results by page number */}
                  {Array.from(new Set(results.map(r => r.pageNumber))).sort((a, b) => a - b).map(pageNumber => (
                    <div key={pageNumber} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 dark:bg-gray-700 p-4 font-medium flex items-center">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mr-3">
                          {pageNumber + 1}
                        </span>
                        {t('results.page', { page: pageNumber + 1 })}
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                        {results.filter(r => r.pageNumber === pageNumber).map(result => (
                          <div key={result.apiId} className="border rounded-lg overflow-hidden">
                            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-750 border-b">
                              <h4 className="font-medium flex items-center">
                                {apiConfigs.find(c => c.id === result.apiId)?.name || t('results.unknownApi')}
                              </h4>
                              <button
                                onClick={() => selectResult(pageNumber, result.apiId)}
                                className={clsx(
                                  "flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors",
                                  selectedResults[pageNumber] === result.apiId
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                                )}
                              >
                                {selectedResults[pageNumber] === result.apiId ? (
                                  <>
                                    <Check size={14} />
                                    {t('results.selectedButton')}
                                  </>
                                ) : (
                                  t('results.selectButton')
                                )}
                              </button>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 overflow-auto max-h-80">
                              <pre className="text-sm whitespace-pre-wrap font-mono">{result.markdown}</pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t('results.noResults')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('results.processPdfPrompt')}</p>
              </div>
            )}
          </Tabs.Content>

          {/* Final Result Tab */}
          <Tabs.Content value="final" className="space-y-8">
            {finalMarkdown ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">{t('finalResult.title')}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <Copy size={16} />
                      {t('finalResult.copyToClipboard')}
                    </button>
                    <button
                      onClick={downloadMarkdown}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Download size={16} />
                      {t('finalResult.downloadMarkdown')}
                    </button>
                  </div>
                </div>
                <textarea
                  className="w-full h-96 p-4 border rounded-md dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
                  value={finalMarkdown}
                  onChange={(e) => setFinalMarkdown(e.target.value)}
                />
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto max-h-[60vh] mt-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono">{finalMarkdown}</pre>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t('finalResult.noFinalResult')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('finalResult.selectAndCombinePrompt')}</p>
              </div>
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
