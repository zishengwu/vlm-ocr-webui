'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Check, 
  Copy, 
  Eye, 
  EyeOff, 
  GitCompare, 
  Download,
  Star,
  StarOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MarkdownViewer from './MarkdownViewer';

export interface ComparisonResult {
  id: string;
  apiName: string;
  provider: string;
  pageNumber: number;
  content: string;
  confidence?: number;
  processingTime?: number;
  isSelected?: boolean;
  isFavorite?: boolean;
}

interface ResultComparisonProps {
  results: ComparisonResult[];
  onResultSelect: (resultId: string, pageNumber: number) => void;
  onResultFavorite: (resultId: string) => void;
  onCopyResult: (content: string) => void;
  onDownloadResult: (content: string, fileName: string) => void;
  selectedResults: { [pageNumber: number]: string };
}

export function ResultComparison({
  results,
  onResultSelect,
  onResultFavorite,
  onCopyResult,
  onDownloadResult,
  selectedResults
}: ResultComparisonProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'raw' | 'rendered'>('rendered');
  const [showDiff, setShowDiff] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  // 按页面分组结果
  const resultsByPage = results.reduce((acc, result) => {
    if (!acc[result.pageNumber]) {
      acc[result.pageNumber] = [];
    }
    acc[result.pageNumber].push(result);
    return acc;
  }, {} as { [pageNumber: number]: ComparisonResult[] });

  const pageNumbers = Object.keys(resultsByPage).map(Number).sort((a, b) => a - b);

  const toggleComparisonSelection = (resultId: string) => {
    setSelectedForComparison(prev => 
      prev.includes(resultId) 
        ? prev.filter(id => id !== resultId)
        : [...prev, resultId].slice(-2) // 最多选择2个进行比较
    );
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).length;
  };

  const getCharCount = (text: string) => {
    return text.length;
  };

  const calculateSimilarity = (text1: string, text2: string) => {
    // 简单的相似度计算（基于字符级别的Jaccard相似度）
    const set1 = new Set(text1.toLowerCase().split(''));
    const set2 = new Set(text2.toLowerCase().split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? (intersection.size / union.size * 100) : 0;
  };

  const renderResultCard = (result: ComparisonResult, pageNumber: number) => {
    const isSelected = selectedResults[pageNumber] === result.id;
    const isInComparison = selectedForComparison.includes(result.id);
    
    return (
      <Card 
        key={result.id} 
        className={`border transition-all hover:shadow-md ${
          isSelected ? 'border-primary bg-primary/5' : 'border-border/50'
        } ${
          isInComparison ? 'ring-2 ring-blue-500' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-base">{result.apiName}</CardTitle>
                <Badge variant="outline">{result.provider}</Badge>
                {result.confidence && (
                  <Badge variant="secondary">
                    {Math.round(result.confidence)}% {t('comparison.confidence')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{getWordCount(result.content)} {t('comparison.words')}</span>
                <span>{getCharCount(result.content)} {t('comparison.chars')}</span>
                {result.processingTime && (
                  <span>{(result.processingTime / 1000).toFixed(1)}s</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResultFavorite(result.id)}
                className={result.isFavorite ? 'text-yellow-500' : ''}
              >
                {result.isFavorite ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleComparisonSelection(result.id)}
                className={isInComparison ? 'bg-blue-100 text-blue-700' : ''}
              >
                <GitCompare className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopyResult(result.content)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="tabs-container">
            <div className="flex border-b mb-3">
              <button
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'rendered' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setViewMode('rendered')}
              >
                {t('comparison.rendered')}
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'raw' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setViewMode('raw')}
              >
                {t('comparison.raw')}
              </button>
            </div>
            {viewMode === 'rendered' ? (
              <div className="bg-muted/30 p-4 rounded-md max-h-80 overflow-auto">
                <MarkdownViewer content={result.content} />
              </div>
            ) : (
              <div className="bg-muted/30 p-4 rounded-md max-h-80 overflow-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono">{result.content}</pre>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => onResultSelect(result.id, pageNumber)}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  {t('comparison.selected')}
                </>
              ) : (
                t('comparison.select')
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadResult(result.content, `${result.apiName}_page_${pageNumber + 1}.md`)}
            >
              <Download className="w-4 h-4 mr-1" />
              {t('comparison.download')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderComparisonView = () => {
    if (selectedForComparison.length !== 2) {
      return (
        <div className="text-center py-8">
          <GitCompare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {t('comparison.selectTwoResults')}
          </p>
        </div>
      );
    }

    const result1 = results.find(r => r.id === selectedForComparison[0])!;
    const result2 = results.find(r => r.id === selectedForComparison[1])!;
    const similarity = calculateSimilarity(result1.content, result2.content);

    return (
      <div className="space-y-6">
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <h3 className="font-medium mb-2">{t('comparison.similarityAnalysis')}</h3>
          <div className="text-2xl font-bold text-primary">
            {similarity.toFixed(1)}% {t('comparison.similar')}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Badge variant="outline">{result1.apiName}</Badge>
              {result1.provider}
            </h4>
            <div className="bg-muted/30 p-4 rounded-md max-h-96 overflow-auto">
              {viewMode === 'rendered' ? (
                <MarkdownViewer content={result1.content} />
              ) : (
                <pre className="text-sm whitespace-pre-wrap font-mono">{result1.content}</pre>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Badge variant="outline">{result2.apiName}</Badge>
              {result2.provider}
            </h4>
            <div className="bg-muted/30 p-4 rounded-md max-h-96 overflow-auto">
              {viewMode === 'rendered' ? (
                <MarkdownViewer content={result2.content} />
              ) : (
                <pre className="text-sm whitespace-pre-wrap font-mono">{result2.content}</pre>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 控制栏 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            {t('comparison.title')}
          </h2>
          {selectedForComparison.length > 0 && (
            <Badge variant="secondary">
              {selectedForComparison.length}/2 {t('comparison.selectedForComparison')}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiff(!showDiff)}
            disabled={selectedForComparison.length !== 2}
          >
            {showDiff ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showDiff ? t('comparison.hideComparison') : t('comparison.showComparison')}
          </Button>
        </div>
      </div>

      {/* 比较视图 */}
      {showDiff && (
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>{t('comparison.comparisonView')}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderComparisonView()}
          </CardContent>
        </Card>
      )}

      {/* 按页面显示结果 */}
      {pageNumbers.map(pageNumber => (
        <Card key={pageNumber} className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                {pageNumber + 1}
              </div>
              {t('comparison.page', { page: pageNumber + 1 })}
              <Badge variant="secondary">
                {resultsByPage[pageNumber].length} {t('comparison.results')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {resultsByPage[pageNumber].map(result => 
                renderResultCard(result, pageNumber)
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default ResultComparison;