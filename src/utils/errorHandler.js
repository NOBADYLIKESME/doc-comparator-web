// errorHandler.js
import { message } from 'antd';

export const handleApiError = (error) => {
  console.error('API请求错误:', error);
  
  if (error.response) {
    // 有响应对象，说明网络请求成功，但服务器返回了非2xx状态码
    console.error('错误响应状态:', error.response.status);
    console.error('错误响应头:', error.response.headers);
    
    // 尝试读取错误响应的内容
    if (error.response.data instanceof Blob) {
      const errorBlob = error.response.data;
      const reader = new FileReader();
      
      reader.onload = function() {
        try {
          const errorText = reader.result;
          console.error('错误响应内容:', errorText);
          
          // 尝试解析为JSON
          let errorMessage = '服务器内部错误';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          } catch (e) {
            // 如果不是JSON，直接显示文本
            errorMessage = errorText.length > 100 ? '服务器处理错误' : errorText;
          }
          
          message.error(`服务器错误: ${errorMessage}`);
        } catch (e) {
          console.error('解析错误响应失败:', e);
          message.error('服务器内部错误，请查看控制台');
        }
      };
      
      reader.readAsText(errorBlob);
    } else {
      console.error('错误响应数据:', error.response.data);
      message.error(`服务器错误: ${error.response.status} - ${error.response.data?.message || '未知错误'}`);
    }
  } else if (error.request) {
    // 没有响应对象但有请求对象
    if (error.request.readyState === 4 && error.request.status === 0) {
      message.error('网络连接失败，请检查服务器状态或防火墙设置');
    } else {
      message.error('请求已发送但未收到响应，请稍后重试');
    }
  } else {
    // 请求配置错误
    message.error(`请求配置错误: ${error.message}`);
  }
};