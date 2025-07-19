import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      title: 'VLM-OCR: Intelligent PDF Document Recognition System',
      subtitle: 'Upload PDF and extract text with VLM OCR',
      tabs: {
        upload: 'Upload & Process',
        results: 'OCR Results',
        final: 'Final Result'
      },
      upload: {
        title: 'Upload PDF',
        dragDrop: 'Drag & drop PDF file or click to upload',
        supportedFormat: 'Supports PDF format',
        processButton: 'Process PDF',
        processing: 'Processing...',
        processError: 'Error during processing: {{error}}',
        fileSelected: 'File selected: {{fileName}}',
        noFileOrApi: 'Please select a PDF file and configure at least one API',
        processComplete: 'PDF processing complete'
      },
      results: {
        selected: 'Result selected.',
        noSelection: 'Please select at least one result first.',
        combined: 'Results combined.',
        copied: 'Copied: ',
        downloaded: 'Markdown file downloaded.',
        combineSelected: 'Combine Selected Results',
        page: 'Page {{page}}',
        unknownApi: 'Unknown API',
        selectedButton: 'Selected',
        selectButton: 'Select',
        noResults: 'No OCR results yet.',
        processPdfPrompt: 'Please process a PDF file first.'
      },
      finalResult: {
        title: 'Final Combined Result',
        copyToClipboard: 'Copy to Clipboard',
        downloadMarkdown: 'Download Markdown',
        noFinalResult: 'No final result yet.',
        selectAndCombinePrompt: 'Please select and combine OCR results first.'
      },
      apiConfig: {
        title: 'API Configuration',
        addButton: 'Add API',
        emptyState: 'No API configured',
        emptyHint: 'Click "Add API" to start configuration',
        added: 'API configuration added',
        removed: 'API configuration removed',
        addDialogTitle: 'Add API Configuration',
        nameLabel: 'API Name *',
        namePlaceholder: 'My OCR API',
        endpointLabel: 'Endpoint URL *',
        endpointPlaceholder: 'https://api.example.com/ocr',
        apiKeyLabel: 'API Key',
        apiKeyPlaceholder: 'sk-...',
        modelLabel: 'Model',
        modelPlaceholder: 'gpt-4-vision',
        modelPrefix: 'Model: ',
        deleteApiConfig: 'Delete API Configuration',
        selectModel: 'Select a model',
        customModel: 'Custom model',
        customModelLabel: 'Custom Model Name',
        customModelPlaceholder: 'Enter custom model name',
        requiredFields: 'API name and endpoint URL are required'
      },
      common: {
        cancel: 'Cancel',
        add: 'Add'
      }
    }
  },
  zh: {
    translation: {
      title: 'VLM-OCR: 智能PDF文档识别与处理系统',
      subtitle: '上传PDF并使用VLM OCR提取文本',
      tabs: {
        upload: '上传与处理',
        results: 'OCR结果',
        final: '最终结果'
      },
      upload: {
        title: '上传PDF',
        dragDrop: '拖放PDF文件或点击上传',
        supportedFormat: '支持PDF格式',
        processButton: '处理PDF',
        processing: '处理中...',
        processError: '处理时出错: {{error}}',
        fileSelected: '已选择文件: {{fileName}}',
        noFileOrApi: '请先选择PDF文件并配置至少一个API',
        processComplete: 'PDF处理完成'
      },
      results: {
        selected: '已选择结果',
        noSelection: '请先选择至少一个结果',
        combined: '结果已合并',
        copied: '已复制到剪贴板',
        downloaded: '已下载Markdown文件',
        combineSelected: '合并选定结果',
        page: '第 {{page}} 页',
        unknownApi: '未知API',
        selectedButton: '已选择',
        selectButton: '选择',
        noResults: '尚无OCR结果',
        processPdfPrompt: '请先处理PDF文件'
      },
      finalResult: {
        title: '最终合并结果',
        copyToClipboard: '复制到剪贴板',
        downloadMarkdown: '下载Markdown',
        noFinalResult: '尚无最终结果',
        selectAndCombinePrompt: '请先选择并合并OCR结果'
      },
      apiConfig: {
        title: 'API配置',
        addButton: '添加API',
        emptyState: '尚未配置API',
        emptyHint: '点击「添加API」按钮开始配置',
        added: 'API配置已添加',
        removed: 'API配置已删除',
        addDialogTitle: '添加API配置',
        nameLabel: 'API名称 *',
        namePlaceholder: '我的OCR API',
        endpointLabel: '端点URL *',
        endpointPlaceholder: 'https://api.example.com/ocr',
        apiKeyLabel: 'API密钥',
        apiKeyPlaceholder: 'sk-...',
        modelLabel: '模型',
        modelPlaceholder: 'gpt-4-vision',
        modelPrefix: '模型: ',
        deleteApiConfig: '删除API配置',
        selectModel: '选择模型',
        customModel: '自定义模型',
        customModelLabel: '自定义模型名称',
        customModelPlaceholder: '输入自定义模型名称',
        requiredFields: 'API名称和端点URL是必填项'
      },
      common: {
        cancel: '取消',
        add: '添加'
      }
    }
  }
};

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18next;