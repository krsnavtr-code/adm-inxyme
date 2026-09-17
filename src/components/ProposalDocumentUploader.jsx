import React, { useState, useCallback } from 'react';
import { FiUpload, FiX, FiFile, FiTrash2 } from 'react-icons/fi';
import axios from '../api/axios';
import { toast } from 'react-hot-toast';

const ProposalDocumentUploader = ({ onUploadSuccess, onRemove }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'text/plain' ||
      file.type === 'image/jpeg' ||
      file.type === 'image/png' ||
      file.type === 'image/gif'
    );

    if (validFiles.length !== files.length) {
      toast.error('Some files were not uploaded. Only PDF, Word, Excel, text, and image files are allowed.');
    }

    if (validFiles.length === 0) return;

    await uploadFiles(validFiles);
  };

  const uploadFiles = async (files) => {
    setIsUploading(true);
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('documents', file);
    });

    try {
      const response = await axios({
        method: 'post',
        url: '/v1/admin/upload-proposal-documents',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        },
      });

      const newFiles = response.data.files.map(file => ({
        name: file.originalname,
        path: file.path,
        url: file.url,
        size: file.size,
        type: file.mimetype
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      if (onUploadSuccess) {
        onUploadSuccess(newFiles);
      }

      toast.success('Files uploaded successfully!');
    } catch (error) {
      console.error('Error uploading files:', error);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('Upload timed out. Please try again with smaller files or better network connection.');
      } else if (error.response) {
        // Server responded with an error status code (4xx, 5xx)
        toast.error(error.response.data?.message || 'Server error while uploading files');
      } else if (error.request) {
        // Request was made but no response received
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something else happened
        toast.error('Failed to upload files. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = async (index) => {
    const fileToRemove = uploadedFiles[index];
    
    try {
await axios.delete(`/v1/admin/delete-proposal-document`, {
        data: { filePath: fileToRemove.path }
      });
      
      const newFiles = [...uploadedFiles];
      newFiles.splice(index, 1);
      setUploadedFiles(newFiles);
      
      if (onRemove) {
        onRemove(fileToRemove);
      }
      
      toast.success('File removed successfully');
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
          >
        <p className='font-bold text-black'>Upload the Proposal Document for send </p>
        <div className="flex flex-col items-center justify-center space-y-2">
          <FiUpload className="w-8 h-8 text-gray-400" />
          <p className="text-sm text-gray-600">
            {isDragging ? 'Drop files here' : 'Drag and drop files here, or click to select files'}
          </p>
          <p className="text-xs text-gray-500">
            PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF (Max: 10MB each)
          </p>
          <input
            type="file"
            id="document-upload"
            className="hidden"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
          />
          <label
            htmlFor="document-upload"
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-sm font-medium transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Select Files'}
          </label>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Documents</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <FiFile className="w-5 h-5 text-gray-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  disabled={isUploading}
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalDocumentUploader;
