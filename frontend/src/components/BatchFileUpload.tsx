'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, Trash2, Eye, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PDFPreview from './PDFPreview';

export interface BatchFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  results?: { pageNumber: number; markdown: string; apiId: string; }[];
}

interface BatchFileUploadProps {
  files: BatchFile[];
  onFilesChange: (files: BatchFile[]) => void;
  onProcessFiles: (files: BatchFile[]) => void;
  isProcessing: boolean;
  maxFiles?: number;
}

export function BatchFileUpload({ 
  files, 
  onFilesChange, 
  onProcessFiles, 
  isProcessing,
  maxFiles = 10 
}: BatchFileUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles: BatchFile[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // 检查文件类型
      if (file.type !== 'application/pdf') {
        continue;
      }
      
      // 检查文件大小 (50MB限制)
      if (file.size > 50 * 1024 * 1024) {
        continue;
      }
      
      // 检查是否已存在
      const exists = files.some(f => f.file.name === file.name && f.file.size === file.size);
      if (exists) {
        continue;
      }
      
      newFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        status: 'pending',
        progress: 0
      });
    }
    
    // 检查总文件数限制
    const totalFiles = files.length + newFiles.length;
    if (totalFiles > maxFiles) {
      const allowedNewFiles = newFiles.slice(0, maxFiles - files.length);
      onFilesChange([...files, ...allowedNewFiles]);
    } else {
      onFilesChange([...files, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (fileId: string) => {
    onFilesChange(files.filter(f => f.id !== fileId));
  };

  const clearAllFiles = () => {
    onFilesChange([]);
  };

  const previewPDF = (file: File) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  const getStatusIcon = (status: BatchFile['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: BatchFile['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">{t('batch.pending')}</Badge>;
      case 'processing':
        return <Badge variant="default">{t('batch.processing')}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-500">{t('batch.completed')}</Badge>;
      case 'error':
        return <Badge variant="destructive">{t('batch.error')}</Badge>;
    }
  };

  const totalProgress = files.length > 0 
    ? files.reduce((sum, file) => sum + file.progress, 0) / files.length 
    : 0;

  const completedFiles = files.filter(f => f.status === 'completed').length;
  const errorFiles = files.filter(f => f.status === 'error').length;
  const processingFiles = files.filter(f => f.status === 'processing').length;

  return (
    <div className="space-y-6">
      {/* 文件上传区域 */}
      <Card className="shadow-medium hover:shadow-hard transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {t('batch.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              accept=".pdf"
              multiple
              className="hidden"
            />
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">{t('batch.dragDrop')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('batch.supportInfo', { max: maxFiles })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 文件列表 */}
      {files.length > 0 && (
        <Card className="shadow-medium">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('batch.fileList')} ({files.length}/{maxFiles})
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFiles}
                  disabled={isProcessing}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('batch.clearAll')}
                </Button>
                <Button
                  onClick={() => onProcessFiles(files.filter(f => f.status === 'pending'))}
                  disabled={isProcessing || files.filter(f => f.status === 'pending').length === 0}
                  className="shadow-sm hover:shadow-md transition-shadow"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t('batch.processing')}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {t('batch.processAll')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 总体进度 */}
            {isProcessing && (
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{t('batch.overallProgress')}</span>
                  <span className="text-sm text-muted-foreground">
                    {completedFiles}/{files.length} {t('batch.completed')}
                  </span>
                </div>
                <Progress value={totalProgress} className="h-2 mb-3" />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{t('batch.processing')}: {processingFiles}</span>
                  <span>{t('batch.completed')}: {completedFiles}</span>
                  <span>{t('batch.error')}: {errorFiles}</span>
                </div>
              </div>
            )}

            {/* 文件列表 */}
            <div className="space-y-3">
              {files.map((batchFile) => (
                <div key={batchFile.id} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(batchFile.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{batchFile.file.name}</p>
                          {getStatusBadge(batchFile.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(batchFile.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {batchFile.status === 'processing' && (
                          <div className="mt-2">
                            <Progress value={batchFile.progress} className="h-1" />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(batchFile.progress)}%
                            </span>
                          </div>
                        )}
                        {batchFile.error && (
                          <p className="text-sm text-destructive mt-1">{batchFile.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewPDF(batchFile.file)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(batchFile.id)}
                        disabled={isProcessing && batchFile.status === 'processing'}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF预览对话框 */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <PDFPreview 
              file={previewFile} 
              onClose={() => {
                setShowPreview(false);
                setPreviewFile(null);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default BatchFileUpload;