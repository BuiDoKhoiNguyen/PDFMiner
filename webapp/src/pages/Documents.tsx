import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
  IconButton,
  Pagination,
  Skeleton,
  Alert,
  Chip
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon, Article as ArticleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../utils/api';

// Define document types
interface DocumentData {
  documentId: string;
  documentName?: string;
  title?: string;
  documentType?: string;
  issueDate?: string;
  status?: string;
  fileLink?: string;
  content?: string;
  searchText?: string;
  documentNumber?: string;
  issuingAgency?: string;
  signer?: string;
  tableData?: string;
}

interface Document {
  documentId: string;
  documentName: string;
  title: string;
  documentType: string;
  issueDate: string;
  status: string;
  fileLink: string;
  content: string;
  createdAt: string;
  fileSize: number;
  pageCount: number;
}


export const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Function to map API data to our Document interface
  const mapApiDataToDocuments = (apiData: DocumentData[]): Document[] => {
    return apiData.map(doc => ({
      documentId: doc.documentId,
      documentName: doc.documentName || 'Không có tên',
      title: doc.title || 'Không có tiêu đề',
      documentType: doc.documentType || 'Không phân loại',
      issueDate: doc.issueDate || '',
      status: doc.status || 'UNKNOWN',
      fileLink: doc.fileLink || '',
      content: doc.content || '',
      createdAt: doc.issueDate || new Date().toISOString(),
      fileSize: 1024, // Default size
      pageCount: doc.content ? Math.ceil(doc.content.length / 3000) : 1 // Rough estimate
    }));
  };

  // Fetch all documents
  const fetchDocuments = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const response = await documentApi.getAllDocuments(page - 1, 9);
      
      if (response.data && Array.isArray(response.data)) {
        const processedDocuments = mapApiDataToDocuments(response.data);
        setDocuments(processedDocuments);
        
        // Tạm tính totalPages, trong thực tế backend nên trả về totalPages
        setTotalPages(3);
      } else {
        setDocuments([]);
        setTotalPages(0);
        setError('Dữ liệu tài liệu không hợp lệ');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError('');
      const response = await documentApi.searchDocuments(searchTerm);

      if (response.data && Array.isArray(response.data)) {
        const processedDocuments = mapApiDataToDocuments(response.data);
        setDocuments(processedDocuments);
        setPage(1);
        // Trong tìm kiếm, thường hiển thị tất cả kết quả trên 1 trang
        setTotalPages(1);
      } else {
        setDocuments([]);
        setPage(1);
        setTotalPages(0);
        setError('Không tìm thấy kết quả phù hợp');
      }
    } catch (error) {
      console.error('Error searching documents:', error);
      setError('Không thể tìm kiếm tài liệu');
    } finally {
      setLoading(false);
    }
  };

  // Clear search results and show all documents
  const clearSearch = async () => {
    setSearchTerm('');
    await fetchDocuments();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes: string[] = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Bỏ đoạn slice documents vì backend đã trả về đúng số lượng item cần hiển thị
  // const currentDocuments = documents.slice((page - 1) * 6, page * 6);
  const currentDocuments = documents;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tài liệu của bạn
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Quản lý và truy cập các tài liệu đã tải lên
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Tìm kiếm tài liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={clearSearch} edge="end">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            sx={{ ml: 2, whiteSpace: 'nowrap' }}
          >
            Tìm kiếm
          </Button>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/upload')}
          >
            Tải lên tài liệu mới
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
            <Box key={item} sx={{ width: { xs: '100%', sm: '47%', md: '31%' } }}>
              <Card>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton variant="text" height={32} width="80%" />
                  <Skeleton variant="text" height={20} width="60%" />
                  <Skeleton variant="text" height={20} width="40%" />
                </CardContent>
                <CardActions>
                  <Skeleton variant="rectangular" width={80} height={36} />
                  <Skeleton variant="rectangular" width={80} height={36} sx={{ ml: 1 }} />
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      ) : documents.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ArticleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Không có tài liệu nào
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Bạn chưa có tài liệu nào. Hãy tải lên tài liệu đầu tiên của bạn.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/upload')}
          >
            Tải lên tài liệu
          </Button>
        </Paper>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {currentDocuments.map((doc) => (
              <Box key={doc.documentId} sx={{ width: { xs: '100%', sm: '47%', md: '31%' } }}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div" sx={{
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                      }}>
                        {doc.documentName}
                      </Typography>
                      <Chip
                        label={doc.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang xử lý'}
                        color={doc.status === 'COMPLETED' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(doc.createdAt)}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Kích thước: {formatFileSize(doc.fileSize)}
                      </Typography>
                      <Typography variant="body2">
                        Số trang: {doc.pageCount}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => {
                        if (doc.documentId) {
                          const encodedId = encodeURIComponent(doc.documentId);
                          console.log(`Chuyển hướng đến tài liệu với ID: ${doc.documentId}, encoded: ${encodedId}`);
                          navigate(`/documents/${encodedId}`);
                        } else {
                          console.error("Document ID is missing");
                          setError("Không thể xem tài liệu - ID không hợp lệ");
                        }
                      }}
                    >
                      Xem
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        if (!doc.documentId) {
                          console.error("Document ID is missing");
                          setError("Không thể xóa tài liệu - ID không hợp lệ");
                          return;
                        }

                        if (window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
                          documentApi.deleteDocument(doc.documentId)
                            .then(() => {
                              setDocuments(documents.filter(d => d.documentId !== doc.documentId));
                            })
                            .catch(err => {
                              console.error('Error deleting document:', err);
                              setError('Không thể xóa tài liệu');
                            });
                        }
                      }}
                    >
                      Xóa
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => {
                  setPage(value);
                  fetchDocuments(value);
                }}
                color="primary"
              />
            )}
          </Box>
        </>
      )}
    </Container>
  );
};
