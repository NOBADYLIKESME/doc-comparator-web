// useComparisonService.js
import { useState, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';



const useComparisonService = (onDocxReady) => {
  const [loading, setLoading] = useState(false);
  
  const startComparison = useCallback(async (file1, file2, values, actionType, documentServerUrl) => {
    if (!file1 || !file2) {
      message.error('请上传两个文档文件');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file1', file1.originFileObj);
      formData.append('file2', file2.originFileObj);
      formData.append('format', values.format);
      formData.append('options', JSON.stringify({
        ignoreFormatting: values.ignoreFormatting,
        ignoreHeadersAndFooters: values.ignoreHeadersAndFooters,
        ignoreCaseChanges: values.ignoreCaseChanges,
        ignoreTables: values.ignoreTables,
        ignoreFields: values.ignoreFields,
        ignoreComments: values.ignoreComments,
        ignoreTextboxes: values.ignoreTextboxes,
        ignoreFootnotes: values.ignoreFootnotes
      }));

      // 根据actionType处理不同逻辑
      if (actionType === 'preview') {
        if (values.format === 'DOCX') {
          console.log('预览DOCX格式');
          const response = await axios.post('/api/compare', formData);
          
          if (response.data && response.data.type === 'docx') {
            const fileId = response.data.fileId;
            
            //生产服务器地址
            const documentUrl = `http://192.168.2.63:3000/api/compare/preview/${fileId}`;
            // 开发时使用的本地服务器地址
            // const documentUrl = `http://192.168.77.144:3000/api/compare/preview/${fileId}`;

            
            console.log('文档访问URL:', documentUrl);
            if (onDocxReady) {
              onDocxReady(documentUrl, fileId);
            }
            message.success('文档比较完成，结果将在下方显示');
          } else {
            console.error('无效的DOCX响应格式:', response.data);
            message.error('获取文档预览链接失败');
          }
        } else if (values.format === 'HTML') {
          console.log('预览HTML格式');
          const response = await axios.post('/api/compare', formData, {
            responseType: 'blob'
          });

          if (response.status === 200) {
            const blob = new Blob([response.data], { type: 'text/html' });
            const htmlWindow = window.open('', '_blank');
            if (htmlWindow) {
              const reader = new FileReader();
              reader.onload = function(e) {
                htmlWindow.document.write(e.target.result);
                htmlWindow.document.close();
                htmlWindow.focus();
              };
              reader.readAsText(blob);
              message.success('文档比较完成，HTML结果已在新窗口中打开');
            } else {
              throw new Error('无法打开新窗口，请检查浏览器弹窗设置');
            }
          } else {
            throw new Error(`服务器返回状态: ${response.status}`);
          }
        } else if (values.format === 'PDF') {
          console.log('预览PDF格式');
          const response = await axios.post('/api/compare', formData, {
            responseType: 'blob'
          });

          if (response.status === 200) {
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const pdfUrl = window.URL.createObjectURL(blob);
            const pdfWindow = window.open(pdfUrl, '_blank');
            if (!pdfWindow) {
              throw new Error('无法打开新窗口，请检查浏览器弹窗设置');
            }
            message.success('文档比较完成，PDF结果已在新窗口中打开');
          } else {
            throw new Error(`服务器返回状态: ${response.status}`);
          }
        }
      }
      else if (actionType === 'download') {
        console.log('下载比较结果');
        const response = await axios.post('/api/compare', formData, {
          responseType: 'blob'
        });

        if (response.status === 200) {
          // 创建下载链接
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `comparison-result.${values.format.toLowerCase()}`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          message.success('文件下载成功');
        } else {
          throw new Error(`服务器返回状态: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('比较文档时出错:', error);
      message.error(`操作失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  }, [onDocxReady]);
  
  return {
    loading,
    startComparison
  };
};

export default useComparisonService;