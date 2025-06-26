import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  Avatar, 
  Grid,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  AccountCircle as AccountIcon,
  Email as EmailIcon,
  VpnKey as PasswordIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  AdminPanelSettings as RoleIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || ''
      });
    }
  }, [user]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit - revert to original data
      if (user) {
        setFormData({
          fullName: user.fullName || '',
          email: user.email || ''
        });
      }
    }
    setEditMode(!editMode);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Simulating API call
    setTimeout(() => {
      // In a real app, call the updateProfile API
      setSuccess('Thông tin cá nhân đã được cập nhật thành công');
      setEditMode(false);
      setLoading(false);
    }, 1000);
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Mật khẩu mới không khớp');
      setLoading(false);
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }
    
    // Simulating API call
    setTimeout(() => {
      // In a real app, call the updatePassword API
      setSuccess('Mật khẩu đã được cập nhật thành công');
      setPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setLoading(false);
    }, 1000);
  };
  
  if (!user) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          Vui lòng đăng nhập để xem thông tin cá nhân
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Thông tin cá nhân
      </Typography>
      
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 120, 
                height: 120, 
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '3rem'
              }}
            >
              {user.fullName?.[0] || user.username?.[0] || 'U'}
            </Avatar>
            
            <Typography variant="h5" gutterBottom>
              {user.fullName || user.username}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <RoleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {user.role}
              </Typography>
            </Box>
            
            <Box sx={{ width: '100%', mt: 3 }}>
              <Button 
                variant="outlined" 
                fullWidth 
                startIcon={<PasswordIcon />}
                onClick={() => setPasswordDialog(true)}
              >
                Đổi mật khẩu
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Thông tin chung
              </Typography>
              <IconButton color={editMode ? 'error' : 'primary'} onClick={handleEditToggle}>
                {editMode ? <CancelIcon /> : <EditIcon />}
              </IconButton>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tên đăng nhập"
                    value={user.username}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <AccountIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      ),
                    }}
                    disabled
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Họ và tên"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    InputProps={{
                      readOnly: !editMode,
                      startAdornment: (
                        <AccountIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      ),
                    }}
                    disabled={!editMode}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    InputProps={{
                      readOnly: !editMode,
                      startAdornment: (
                        <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      ),
                    }}
                    disabled={!editMode}
                  />
                </Grid>
                
                {editMode && (
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      type="submit"
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
                      disabled={loading}
                    >
                      Lưu thay đổi
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quyền người dùng
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SecurityIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Vai trò: {user.role}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Danh sách quyền:
                </Typography>
                
                <List dense>
                  {user.permissions?.map((permission, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 30 }}>•</ListItemIcon>
                      <ListItemText primary={permission} />
                    </ListItem>
                  )) || (
                    <ListItem>
                      <ListItemText primary="Không có quyền nào" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Password Change Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)}>
        <DialogTitle>Đổi mật khẩu</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Để đổi mật khẩu, vui lòng nhập mật khẩu hiện tại và mật khẩu mới.
          </DialogContentText>
          
          <Box component="form" onSubmit={handlePasswordSubmit}>
            <TextField
              margin="normal"
              fullWidth
              name="currentPassword"
              label="Mật khẩu hiện tại"
              type="password"
              autoComplete="current-password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
            />
            <TextField
              margin="normal"
              fullWidth
              name="newPassword"
              label="Mật khẩu mới"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
            />
            <TextField
              margin="normal"
              fullWidth
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
              helperText={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== '' ? 'Mật khẩu không khớp' : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Hủy</Button>
          <Button 
            onClick={handlePasswordSubmit} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Đổi mật khẩu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
