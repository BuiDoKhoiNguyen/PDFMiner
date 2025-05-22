import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  LinearProgress,
  Button,
  Alert
} from '@mui/material';
import {
  Description as DocumentIcon,
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  PeopleAlt as UsersIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../utils/api';

interface Document {
  documentId: string;
  documentName?: string;
  title?: string;
  documentType?: string;
  issueDate?: string;
  status?: string;
  fileLink?: string;
  content?: string;
  createdAt?: string;
  fileSize?: number;
  pageCount?: number;
}

interface DashboardStats {
  totalDocuments: number;
  processedToday: number;
  pendingProcessing: number;
}

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    processedToday: 0,
    pendingProcessing: 0
  });
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Lấy danh sách tài liệu
        const response = await documentApi.getAllDocuments();
        
        if (response.data && Array.isArray(response.data)) {
          const docs = response.data;
          // Sắp xếp theo ngày tạo mới nhất
          const sortedDocs = [...docs].sort((a, b) => {
            const dateA = a.issueDate || a.createdAt || '';
            const dateB = b.issueDate || b.createdAt || '';
            return dateB.localeCompare(dateA);
          });
          
          setDocuments(sortedDocs.slice(0, 5)); // Chỉ lấy 5 tài liệu mới nhất
          
          // Tính toán thống kê
          const today = new Date().toISOString().split('T')[0];
          const processedToday = docs.filter(doc => 
            doc.status === 'COMPLETED' && 
            (doc.issueDate?.startsWith(today) || doc.createdAt?.startsWith(today))
          ).length;
          
          const pendingProcessing = docs.filter(doc => 
            doc.status === 'PROCESSING'
          ).length;
          
          setStats({
            totalDocuments: docs.length,
            processedToday,
            pendingProcessing
          });
        } else {
          setDocuments([]);
          setError('Không thể tải dữ liệu tài liệu');
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
        setError('Không thể kết nối với máy chủ');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Không có ngày';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch {
      return 'Ngày không hợp lệ';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Bảng điều khiển
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Xin chào, {user?.fullName || user?.username}! Dưới đây là tổng quan về tài liệu và hoạt động của bạn.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DocumentIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" component="div">
                  {stats.totalDocuments}
                </Typography>
              </Box>
              <Typography color="text.secondary" gutterBottom>
                Tổng số tài liệu
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <UploadIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" component="div">
                  {stats.processedToday}
                </Typography>
              </Box>
              <Typography color="text.secondary" gutterBottom>
                Đã xử lý hôm nay
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SearchIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" component="div">
                  {stats.pendingProcessing}
                </Typography>
              </Box>
              <Typography color="text.secondary" gutterBottom>
                Đang xử lý
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <UsersIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" component="div">
                  1
                </Typography>
              </Box>
              <Typography color="text.secondary" gutterBottom>
                Người dùng hoạt động
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Tài liệu gần đây
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {documents.length === 0 ? (
              <Typography variant="body1" align="center" sx={{ py: 4 }}>
                Chưa có tài liệu nào. Hãy tải lên tài liệu đầu tiên của bạn.
              </Typography>
            ) : (
              documents.map((doc) => (
                <Box key={doc.documentId} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} 
                        onClick={() => {
                          if (doc.documentId) {
                            navigate(`/documents/${encodeURIComponent(doc.documentId)}`);
                          }
                        }}
                      >
                        {doc.title || doc.documentName || 'Không có tiêu đề'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Đã tải lên: {formatDate(doc.issueDate || doc.createdAt)}
                      </Typography>
                    </Box>
                    <Chip 
                      label={doc.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang xử lý'} 
                      color={doc.status === 'COMPLETED' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                  
                  {doc.status === 'PROCESSING' && (
                    <LinearProgress sx={{ mt: 1 }} />
                  )}
                  
                  <Divider sx={{ mt: 2 }} />
                </Box>
              ))
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/documents')}
              >
                Xem tất cả tài liệu
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Hành động nhanh
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={<UploadIcon />}
                  onClick={() => navigate('/upload')}
                  sx={{ py: 1.5 }}
                >
                  Tải lên
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button 
                  variant="outlined" 
                  fullWidth
                  startIcon={<SearchIcon />}
                  onClick={() => navigate('/search')}
                  sx={{ py: 1.5 }}
                >
                  Tìm kiếm
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tài liệu theo loại
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {documents.length === 0 ? (
              <Typography variant="body1" align="center" sx={{ py: 2 }}>
                Chưa có dữ liệu thống kê
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Array.from(new Set(documents.map(doc => doc.documentType || 'Không phân loại'))).map((type) => (
                  <Chip 
                    key={type} 
                    label={`${type} (${documents.filter(doc => (doc.documentType || 'Không phân loại') === type).length})`} 
                    color="primary" 
                    variant="outlined" 
                    onClick={() => navigate(`/search?q=${encodeURIComponent(type)}`)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
