// fileUtils.js
import { message } from 'antd';

export const validateDocumentFile = (file) => {
  // 验证文件类型
  const allowedTypes = ['.doc', '.docx'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  if (!allowedTypes.some(type => fileExtension.endsWith(type))) {
    message.error('请上传Word文档文件(.doc或.docx格式)');
    return false;
  }

  // 验证文件大小（限制为50MB）
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    message.error('文件大小不能超过50MB');
    return false;
  }
  
  return true;
};

export const handleFileChange = (fileList, fileIndex, setFile1, setFile2) => {
  if (fileList && fileList.length > 0) {
    const file = fileList[0];
    
    if (validateDocumentFile(file)) {
      if (fileIndex === 1) {
        setFile1(file);
      } else {
        setFile2(file);
      }
    }
  } else {
    // 当文件列表为空时清除对应的文件
    if (fileIndex === 1) {
      setFile1(null);
    } else {
      setFile2(null);
    }
  }
};