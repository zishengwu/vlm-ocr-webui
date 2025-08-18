'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, FileText, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PDFPreviewProps {
  file: File | null;
  onClose?: () => void;
}

interface PDFPage {
  pageNumber: number;
  imageUrl: string;
}

export function PDFPreview({ file, onClose }: PDFPreviewProps) {
  const { t } = useTranslation();
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPDF = useCallback(async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 动态导入 PDF.js
      const pdfjsLib = await import('pdfjs-dist');
      
      // 设置 worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const pdfPages: PDFPage[] = [];
      
      // 渲染前几页作为预览（最多5页）
      const maxPages = Math.min(pdf.numPages, 5);
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) continue;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        }).promise;
        
        pdfPages.push({
          pageNumber: i,
          imageUrl: canvas.toDataURL()
        });
      }
      
      setPages(pdfPages);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(t('preview.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [file, t]);

  useEffect(() => {
    if (file) {
      loadPDF();
    }
  }, [file, loadPDF]);

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const zoomIn = () => {
    setZoom(Math.min(zoom * 1.2, 3));
  };

  const zoomOut = () => {
    setZoom(Math.max(zoom / 1.2, 0.5));
  };

  const rotate = () => {
    setRotation((rotation + 90) % 360);
  };

  if (!file) {
    return (
      <Card className="shadow-medium">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('preview.noFile')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {t('preview.title')}
          </CardTitle>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              {t('common.close')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">{t('preview.loading')}</span>
          </div>
        )}
        
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={loadPDF} className="mt-4">
              {t('preview.retry')}
            </Button>
          </div>
        )}
        
        {!isLoading && !error && pages.length > 0 && (
          <div className="space-y-4">
            {/* 控制栏 */}
            <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium">
                  {currentPage + 1} / {pages.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === pages.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={zoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button variant="outline" size="sm" onClick={zoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={rotate}>
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* 预览区域 */}
            <div className="border rounded-lg overflow-auto max-h-[600px] bg-gray-50 dark:bg-gray-900">
              <div className="flex justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pages[currentPage]?.imageUrl}
                  alt={`Page ${currentPage + 1}`}
                  className="max-w-full h-auto shadow-lg"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </div>
            </div>
            
            {/* 页面信息 */}
            <div className="text-sm text-muted-foreground text-center">
              {t('preview.pageInfo', { 
                current: currentPage + 1, 
                total: pages.length,
                fileName: file.name
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PDFPreview;