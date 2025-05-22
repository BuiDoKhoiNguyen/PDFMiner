import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export const AdminPanel = () => {
  const { user, hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userDialog, setUserDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Mock users for demonstration
  const [users, setUsers] = useState([
    {
      id: '1',
      username: 'admin',
      fullName: 'Admin User',
      email: 'admin@example.com',
      role: 'ADMIN',
      enabled: true,
      createdAt: '2023-01-15T10:30:00'
    },
    {
      id: '2',
      username: 'user1',
      fullName: 'Standard User 1',
      email: 'user1@example.com',
      role: 'STANDARD_USER',
      enabled: true,
      createdAt: '2023-03-20T14:15:00'
    },
    {
      id: '3',
      username: 'user2',
      fullName: 'Standard User 2',
      email: 'user2@example.com',
      role: 'STANDARD_USER',
      enabled: false,
      createdAt: '2023-04-10T09:45:00'
    },
    {
      id: '4',
      username: 'moderator',
      fullName: 'Content Moderator',
      email: 'moderator@example.com',
      role: 'MODERATOR',
      enabled: true,
      createdAt: '2023-02-05T11:20:00'
    }
  ]);
  
  const [userForm, setUserForm] = useState({
    id: '',
    username: '',
    fullName: '',
    email: '',
    role: 'STANDARD_USER',
    password: '',
    confirmPassword: '',
    enabled: true
  });
  
  // Check if user has admin access
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      setError('Bạn không có quyền truy cập trang quản trị');
    }
  }, [user]);
  
  const handleSearch = () => {
    // In a real app, implement search functionality
    console.log('Searching for:', searchTerm);
  };
  
  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserForm(prev => ({ ...prev, role: e.target.value }));
  };
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserForm(prev => ({ ...prev, enabled: e.target.checked }));
  };
  
  const handleEditUser = (userId: string) => {
    const userToEdit = users.find(u => u.id === userId);
    if (userToEdit) {
      setUserForm({
        id: userToEdit.id,
        username: userToEdit.username,
        fullName: userToEdit.fullName,
        email: userToEdit.email,
        role: userToEdit.role,
        password: '',
        confirmPassword: '',
        enabled: userToEdit.enabled
      });
      setUserDialog(true);
    }
  };
  
  const handleCreateUser = () => {
    setUserForm({
      id: '',
      username: '',
      fullName: '',
      email: '',
      role: 'STANDARD_USER',
      password: '',
      confirmPassword: '',
      enabled: true
    });
    setUserDialog(true);
  };
  
  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete) {
      setSelectedUser(userToDelete);
      setConfirmDialog(true);
    }
  };
  
  const confirmDeleteUser = () => {
    if (selectedUser) {
      setLoading(true);
      
      // Simulating API call
      setTimeout(() => {
        setUsers(users.filter(u => u.id !== selectedUser.id));
        setSuccess(`Người dùng ${selectedUser.username} đã được xóa thành công`);
        setSelectedUser(null);
        setConfirmDialog(false);
        setLoading(false);
      }, 1000);
    }
  };
  
  const handleSubmitUser = () => {
    // Validate form
    if (!userForm.username || !userForm.email || !userForm.fullName) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    if (!userForm.id && (!userForm.password || userForm.password.length < 6)) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    if (!userForm.id && userForm.password !== userForm.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Simulating API call
    setTimeout(() => {
      if (userForm.id) {
        // Update existing user
        setUsers(users.map(u => 
          u.id === userForm.id 
            ? { 
                ...u, 
                fullName: userForm.fullName,
                email: userForm.email,
                role: userForm.role,
                enabled: userForm.enabled
              } 
            : u
        ));
        setSuccess(`Người dùng ${userForm.username} đã được cập nhật thành công`);
      } else {
        // Create new user
        const newUser = {
          id: Math.random().toString(36).substr(2, 9),
          username: userForm.username,
          fullName: userForm.fullName,
          email: userForm.email,
          role: userForm.role,
          enabled: userForm.enabled,
          createdAt: new Date().toISOString()
        };
        setUsers([...users, newUser]);
        setSuccess(`Người dùng ${userForm.username} đã được tạo thành công`);
      }
      
      setUserDialog(false);
      setLoading(false);
    }, 1000);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  // If not admin, show access denied
  if (user?.role !== 'ADMIN') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Bạn không có quyền truy cập trang quản trị
        </Alert>
        <Button 
          variant="contained" 
          href="/"
        >
          Quay về trang chủ
        </Button>
      </Container>
    );
  }
  
  const filteredUsers = searchTerm 
    ? users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;
  
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Trang quản trị
      </Typography>
      
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Quản lý người dùng
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleCreateUser}
          >
            Thêm người dùng
          </Button>
        </Box>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Tìm kiếm người dùng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên đăng nhập</TableCell>
                <TableCell>Họ tên</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role} 
                      color={user.role === 'ADMIN' ? 'secondary' : 'primary'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.enabled ? 'Hoạt động' : 'Bị khóa'} 
                      color={user.enabled ? 'success' : 'error'} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      size="small" 
                      onClick={() => handleEditUser(user.id)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      size="small" 
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={user.username === 'admin'} // Prevent deleting admin
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* User Form Dialog */}
      <Dialog 
        open={userDialog} 
        onClose={() => setUserDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {userForm.id ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tên đăng nhập"
                name="username"
                value={userForm.username}
                onChange={handleUserFormChange}
                required
                disabled={!!userForm.id} // Disable username editing for existing users
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Họ và tên"
                name="fullName"
                value={userForm.fullName}
                onChange={handleUserFormChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={userForm.email}
                onChange={handleUserFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vai trò"
                name="role"
                select
                SelectProps={{ native: true }}
                value={userForm.role}
                onChange={handleRoleChange}
              >
                <option value="ADMIN">Admin</option>
                <option value="MODERATOR">Moderator</option>
                <option value="STANDARD_USER">Standard User</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Trạng thái"
                name="enabled"
                select
                SelectProps={{ native: true }}
                value={userForm.enabled ? 'active' : 'inactive'}
                onChange={(e) => setUserForm(prev => ({ ...prev, enabled: e.target.value === 'active' }))}
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Bị khóa</option>
              </TextField>
            </Grid>
            
            {!userForm.id && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mật khẩu"
                    name="password"
                    type="password"
                    value={userForm.password}
                    onChange={handleUserFormChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Xác nhận mật khẩu"
                    name="confirmPassword"
                    type="password"
                    value={userForm.confirmPassword}
                    onChange={handleUserFormChange}
                    required
                    error={userForm.password !== userForm.confirmPassword && userForm.confirmPassword !== ''}
                    helperText={userForm.password !== userForm.confirmPassword && userForm.confirmPassword !== '' ? 'Mật khẩu không khớp' : ''}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Hủy</Button>
          <Button 
            onClick={handleSubmitUser} 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : userForm.id ? 'Cập nhật' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
      >
        <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography>
                Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser.username}</strong>?
              </Typography>
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                Thao tác này không thể hoàn tác.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Hủy</Button>
          <Button 
            onClick={confirmDeleteUser} 
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
