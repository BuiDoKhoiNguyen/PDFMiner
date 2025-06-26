import { useState, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  LinearProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  FileCopy as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import { documentApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [documentId, setDocumentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (selectedFile.type !== 'application/pdf') {
        setError('Chỉ hỗ trợ tệp PDF');
        return;
      }
      
      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Kích thước tệp tối đa là 10MB');
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Validate file type
      if (droppedFile.type !== 'application/pdf') {
        setError('Chỉ hỗ trợ tệp PDF');
        return;
      }
      
      // Validate file size (10MB max)
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError('Kích thước tệp tối đa là 10MB');
        return;
      }
      
      setFile(droppedFile);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Vui lòng chọn một tệp');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');
    setSuccess('');
    
    try {
      // Simulate progress for demo purposes
      const progressInterval = setInterval(() => {
        setUploadProgress((prevProgress) => {
          const newProgress = Math.min(prevProgress + 5, 95);
          return newProgress;
        });
      }, 300);
      
      const response = await documentApi.uploadDocument(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setSuccess('Tài liệu đã được tải lên thành công!');
      setDocumentId(response.data.documentId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tải lên thất bại');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError('');
    setSuccess('');
    setUploadProgress(0);
    setDocumentId(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tải lên tài liệu
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Hỗ trợ tải lên tệp PDF để trích xuất và phân tích nội dung
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper 
            sx={{ 
              p: 4, 
              border: '2px dashed #ccc',
              borderRadius: 2,
              backgroundColor: '#f9f9f9', 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 300,
              transition: 'border-color 0.3s',
              '&:hover': {
                borderColor: '#2196f3'
              }
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {!file ? (
              <>
                <UploadIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Kéo & thả tệp PDF vào đây
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center" paragraph>
                  hoặc
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <Button 
                  variant="contained" 
                  onClick={() => fileInputRef.current?.click()}
                  startIcon={<UploadIcon />}
                >
                  Chọn tệp
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Hỗ trợ: PDF. Kích thước tối đa: 10MB
                </Typography>
              </>
            ) : (
              <>
                <Box sx={{ width: '100%', mb: 3 }}>
                  <Card>
                    <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                      <FileIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" noWrap>{file.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatFileSize(file.size)}
                        </Typography>
                      </Box>
                      <IconButton onClick={removeFile} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </CardContent>
                    {uploading && (
                      <Box sx={{ px: 2, pb: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={uploadProgress} 
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" align="right" sx={{ mt: 0.5 }}>
                          {uploadProgress}%
                        </Typography>
                      </Box>
                    )}
                  </Card>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleUpload}
                    disabled={uploading}
                    startIcon={<UploadIcon />}
                  >
                    {uploading ? 'Đang tải lên...' : 'Tải lên'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={removeFile}
                    disabled={uploading}
                  >
                    Hủy
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Hướng dẫn
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" paragraph>
              1. Chọn hoặc kéo & thả tệp PDF cần xử lý.
            </Typography>
            <Typography variant="body2" paragraph>
              2. Hệ thống sẽ tự động trích xuất văn bản, bảng và phân tích dữ liệu.
            </Typography>
            <Typography variant="body2" paragraph>
              3. Sau khi xử lý, bạn có thể tìm kiếm, phân tích và sử dụng dữ liệu từ tài liệu.
            </Typography>
            <Typography variant="body2" paragraph>
              4. Việc xử lý có thể mất từ vài giây đến vài phút tùy thuộc vào độ phức tạp của tài liệu.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {documentId && (
        <Paper sx={{ p: 3, mt: 4, backgroundColor: '#f1f8e9' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SuccessIcon color="success" sx={{ fontSize: 30, mr: 1 }} />
            <Typography variant="h6">
              Tài liệu đã được tải lên thành công
            </Typography>
          </Box>
          <Typography variant="body1" paragraph>
            Tài liệu của bạn hiện đang được xử lý. Quá trình này có thể mất vài phút.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={() => navigate(`/documents/${documentId}/status`)}
            >
              Kiểm tra trạng thái
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/documents')}
            >
              Xem tất cả tài liệu
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};
