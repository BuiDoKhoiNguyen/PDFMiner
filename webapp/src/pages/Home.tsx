import { Typography, Paper, Box, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Container maxWidth="lg">
      <Paper elevation={0} sx={{ p: 4, borderRadius: 2, textAlign: 'center', mb: 4 }}>
        <Box sx={{ py: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            Chào mừng đến với PDFMiner
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Khai thác dữ liệu tài liệu PDF thông minh với công nghệ AI
          </Typography>
          
          {!isAuthenticated ? (
            <Box sx={{ mt: 4 }}>
              <Button 
                variant="contained" 
                size="large" 
                onClick={() => navigate('/register')}
                sx={{ mr: 2 }}
              >
                Đăng ký ngay
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                onClick={() => navigate('/login')}
              >
                Đăng nhập
              </Button>
            </Box>
          ) : (
            <Box sx={{ mt: 4 }}>
              <Button 
                variant="contained" 
                size="large" 
                onClick={() => navigate('/upload')}
                sx={{ mr: 2 }}
              >
                Tải tài liệu lên
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                onClick={() => navigate('/documents')}
              >
                Xem tài liệu
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
        <Paper sx={{ flex: 1, p: 3, borderRadius: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Trích xuất dữ liệu
          </Typography>
          <Typography paragraph>
            Trích xuất nội dung từ tài liệu PDF với độ chính xác cao, bao gồm cả bảng và dữ liệu có cấu trúc.
          </Typography>
        </Paper>
        
        <Paper sx={{ flex: 1, p: 3, borderRadius: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Tìm kiếm thông minh
          </Typography>
          <Typography paragraph>
            Tìm kiếm nội dung trong tài liệu PDF với công nghệ AI để tìm ra thông tin cần thiết một cách nhanh chóng.
          </Typography>
        </Paper>
        
        <Paper sx={{ flex: 1, p: 3, borderRadius: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Phân tích dữ liệu
          </Typography>
          <Typography paragraph>
            Phân tích nội dung tài liệu để rút ra thông tin quan trọng và những điểm chính một cách tự động.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};
