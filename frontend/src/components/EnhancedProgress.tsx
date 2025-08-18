'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Eye, 
  EyeOff,
  BarChart3,
  Timer
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ProcessingTask {
  id: string;
  fileName: string;
  pageNumber: number;
  apiName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime?: number;
  endTime?: number;
  error?: string;
  result?: string;
}

interface EnhancedProgressProps {
  tasks: ProcessingTask[];
  totalFiles: number;
  totalPages: number;
  totalApis: number;
  isProcessing: boolean;
  onTaskClick?: (task: ProcessingTask) => void;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

export function EnhancedProgress({
  tasks,
  totalFiles,
  totalPages,
  totalApis,
  isProcessing,
  onTaskClick,
  showDetails = false,
  onToggleDetails
}: EnhancedProgressProps) {
  const { t } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // 计算统计信息
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const errorTasks = tasks.filter(t => t.status === 'error').length;
  const processingTasks = tasks.filter(t => t.status === 'processing').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  
  const totalTasks = tasks.length;
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  // 计算平均处理时间
  const completedTasksWithTime = tasks.filter(t => t.status === 'completed' && t.startTime && t.endTime);
  const avgProcessingTime = completedTasksWithTime.length > 0 
    ? completedTasksWithTime.reduce((sum, t) => sum + (t.endTime! - t.startTime!), 0) / completedTasksWithTime.length
    : 0;
  
  // 估算剩余时间
  const remainingTasks = pendingTasks + processingTasks;
  const estimatedRemainingTime = avgProcessingTime > 0 ? remainingTasks * avgProcessingTime : 0;

  // 计时器
  useEffect(() => {
    if (isProcessing && !startTime) {
      setStartTime(Date.now());
    } else if (!isProcessing) {
      setStartTime(null);
      setElapsedTime(0);
    }
  }, [isProcessing, startTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isProcessing, startTime]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
  };

  const getStatusIcon = (status: ProcessingTask['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusColor = (status: ProcessingTask['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 dark:bg-gray-800';
      case 'processing': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'completed': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    }
  };

  return (
    <Card className="shadow-medium border-primary/20">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t('progress.title')}
          </CardTitle>
          {onToggleDetails && (
            <Button variant="outline" size="sm" onClick={onToggleDetails}>
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showDetails ? t('progress.hideDetails') : t('progress.showDetails')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 总体统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{totalFiles}</div>
            <div className="text-sm text-muted-foreground">{t('progress.files')}</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{totalPages}</div>
            <div className="text-sm text-muted-foreground">{t('progress.pages')}</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{totalApis}</div>
            <div className="text-sm text-muted-foreground">{t('progress.apis')}</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{completedTasks}</div>
            <div className="text-sm text-muted-foreground">{t('progress.completed')}</div>
          </div>
        </div>

        {/* 总体进度条 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{t('progress.overall')}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(overallProgress)}% ({completedTasks}/{totalTasks})
            </span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* 状态统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{pendingTasks} {t('progress.pending')}</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <Loader2 className="w-4 h-4 text-blue-500" />
            <span className="text-sm">{processingTasks} {t('progress.processing')}</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">{completedTasks} {t('progress.completed')}</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm">{errorTasks} {t('progress.errors')}</span>
          </div>
        </div>

        {/* 时间信息 */}
        {isProcessing && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{t('progress.elapsed')}</div>
                <div className="text-lg font-mono">{formatTime(elapsedTime)}</div>
              </div>
            </div>
            {avgProcessingTime > 0 && (
              <div>
                <div className="text-sm font-medium">{t('progress.avgTime')}</div>
                <div className="text-lg font-mono">{formatTime(avgProcessingTime)}</div>
              </div>
            )}
            {estimatedRemainingTime > 0 && (
              <div>
                <div className="text-sm font-medium">{t('progress.estimated')}</div>
                <div className="text-lg font-mono">{formatTime(estimatedRemainingTime)}</div>
              </div>
            )}
          </div>
        )}

        {/* 详细任务列表 */}
        {showDetails && tasks.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('progress.taskDetails')}
            </h4>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${
                    getStatusColor(task.status)
                  }`}
                  onClick={() => onTaskClick?.(task)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(task.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{task.fileName}</span>
                          <Badge variant="outline" className="text-xs">
                            {t('progress.page')} {task.pageNumber}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {task.apiName}
                          </Badge>
                        </div>
                        {task.status === 'processing' && (
                          <div className="mt-1">
                            <Progress value={task.progress} className="h-1" />
                          </div>
                        )}
                        {task.error && (
                          <p className="text-xs text-destructive mt-1 truncate">{task.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {task.startTime && task.endTime && (
                        <span>{formatTime(task.endTime - task.startTime)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EnhancedProgress;