// onlyofficeUtils.js
import { message } from 'antd';

export const onDocumentReady = (setLoading) => {
  return (event) => {
    console.log("Document is loaded", event);
    setLoading(false);
    message.success('文档加载完成');
  };
};

export const onLoadComponentError = (setLoading) => {
  return (error) => {
    console.error("编辑器加载错误详情:", error);
    console.error("错误代码:", error?.data?.errorCode);
    console.error("错误描述:", error?.data?.errorDescription);
    
    setLoading(false);
    
    const errorMessages = {
      '-1': '加载编辑器组件时发生未知错误',
      '-2': '无法从文档服务器加载API，请检查OnlyOffice服务是否正常运行',
      '-3': '文档API未定义，请检查documentServerUrl配置',
      '-4': '文档下载失败，请检查文档URL是否可访问且没有认证要求',
      '-5': '文档服务器拒绝连接',
      '-6': '文档格式不支持'
    };
    
    const errorCode = error?.data?.errorCode;
    const messageText = errorMessages[errorCode] || `编辑器加载失败: ${error?.data?.errorDescription || '未知错误'}`;
    
    message.error(messageText);
  };
};

export const onError = () => {
  return (event) => {
    console.error('OnlyOffice 错误事件详情:', event);
    console.error('错误数据:', event.data);
    
    if (event.data && event.data.errorCode === -4) {
      message.error('文档下载失败，请检查网络连接和文档服务状态');
    }
  };
};