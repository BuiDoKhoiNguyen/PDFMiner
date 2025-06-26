import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
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
  Chip,
  FormControl,
  Select,
  InputLabel,
  MenuItem
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../utils/api';

// User data interface matching the API response
interface UserData {
  id: string;
  username: string;
  fullName: string | null;
  email: string;
  role: string;
  enabled: boolean;
  createdAt?: string;
  authorities?: Array<{ authority: string }>;
}

// User form data interface with client-side fields
interface UserFormData {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
  enabled: boolean;
}

export const AdminPanel = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userDialog, setUserDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // User list state
  const [users, setUsers] = useState<UserData[]>([]);
  
  // User form state with typed data
  const [userForm, setUserForm] = useState<UserFormData>({
    id: '',
    username: '',
    fullName: '',
    email: '',
    role: 'STANDARD_USER',
    password: '',
    confirmPassword: '',
    enabled: true
  });
  
  // Load user list when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Check if user has admin access
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      setError('Bạn không có quyền truy cập trang quản trị');
    }
  }, [user]);
  
  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setFetchLoading(true);
      const response = await userApi.getAllUsers();
      setUsers(response.data);
      setError('');
    } catch (err: unknown) {
      console.error('Lỗi khi tải danh sách người dùng:', err);
      const errorMessage = err instanceof Error ? err.message : 
        typeof err === 'object' && err && 'response' in err ? 
          // @ts-expect-error - Handle axios error response
          err.response?.data?.message : 'Không thể tải danh sách người dùng';
      setError(errorMessage);
    } finally {
      setFetchLoading(false);
    }
  };
  
  // Client-side search filtering
  const handleSearch = () => {
    // Filtering is handled in the render method
    console.log('Filtering by:', searchTerm);
  };
  
  // Form field change handlers with proper typing
  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Edit user handler
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
  
  // Create new user handler
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
  
  // Delete user handler
  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete) {
      setSelectedUser(userToDelete);
      setConfirmDialog(true);
    }
  };
  
  // Confirm delete user
  const confirmDeleteUser = async () => {
    if (selectedUser) {
      setLoading(true);
      try {
        await userApi.deleteUser(selectedUser.id);
        setUsers(users.filter(u => u.id !== selectedUser.id));
        setSuccess(`Người dùng ${selectedUser.username} đã được xóa thành công`);
        setConfirmDialog(false);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 
          typeof err === 'object' && err && 'response' in err ? 
            // @ts-expect-error - Handle axios error response
            err.response?.data?.message || `Không thể xóa người dùng ${selectedUser.username}` : 
            `Không thể xóa người dùng ${selectedUser.username}`;
        setError(errorMessage);
      } finally {
        setSelectedUser(null);
        setLoading(false);
      }
    }
  };
  
  // Submit user form handler
  const handleSubmitUser = async () => {
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
    
    try {
      if (userForm.id) {
        // Update existing user
        const updateData = {
          fullName: userForm.fullName,
          email: userForm.email,
          role: userForm.role,
          enabled: userForm.enabled
        };
        
        await userApi.updateUser(userForm.id, updateData);
        
        // Update user list in state
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
        const newUserData = {
          username: userForm.username,
          password: userForm.password,
          fullName: userForm.fullName,
          email: userForm.email,
          role: userForm.role,
          enabled: userForm.enabled
        };
        
        const response = await userApi.createUser(newUserData);
        
        // Add new user to the user list
        const newUser = response.data as UserData;
        setUsers([...users, newUser]);
        setSuccess(`Người dùng ${userForm.username} đã được tạo thành công`);
      }
      
      setUserDialog(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 
        typeof err === 'object' && err && 'response' in err ? 
          // @ts-expect-error - Handle axios error response
          err.response?.data?.message || 'Không thể lưu thông tin người dùng' : 
          'Không thể lưu thông tin người dùng';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date to local string
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
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
  
  // Filter users based on search term
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
      
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Quản lý người dùng
          </Typography>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={fetchUsers}
              sx={{ mr: 1 }}
            >
              Làm mới
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleCreateUser}
            >
              Thêm người dùng
            </Button>
          </Box>
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
        
        {fetchLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
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
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((userData) => (
                    <TableRow key={userData.id}>
                      <TableCell>{userData.username}</TableCell>
                      <TableCell>{userData.fullName}</TableCell>
                      <TableCell>{userData.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={userData.role} 
                          color={userData.role === 'ADMIN' ? 'secondary' : 'primary'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={userData.enabled ? 'Hoạt động' : 'Bị khóa'} 
                          color={userData.enabled ? 'success' : 'error'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{userData.createdAt ? formatDate(userData.createdAt) : 'N/A'}</TableCell>
                      <TableCell>
                        <IconButton 
                          color="primary" 
                          size="small" 
                          onClick={() => handleEditUser(userData.id)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          size="small" 
                          onClick={() => handleDeleteUser(userData.id)}
                          disabled={userData.username === 'admin'} // Prevent deleting admin
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
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
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <TextField
                  fullWidth
                  label="Tên đăng nhập"
                  name="username"
                  value={userForm.username}
                  onChange={handleUserFormChange}
                  required
                  disabled={!!userForm.id} // Disable username editing for existing users
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="Họ và tên"
                  name="fullName"
                  value={userForm.fullName}
                  onChange={handleUserFormChange}
                  required
                />
              </Box>
              <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={userForm.email}
                  onChange={handleUserFormChange}
                  required
                />
              </Box>
              <Box>
                <FormControl fullWidth>
                  <InputLabel id="role-select-label">Vai trò</InputLabel>
                  <Select
                    labelId="role-select-label"
                    id="role-select"
                    value={userForm.role}
                    label="Vai trò"
                    name="role"
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <MenuItem value="ADMIN">Admin</MenuItem>
                    <MenuItem value="MODERATOR">Moderator</MenuItem>
                    <MenuItem value="STANDARD_USER">Standard User</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FormControl fullWidth>
                  <InputLabel id="status-select-label">Trạng thái</InputLabel>
                  <Select
                    labelId="status-select-label"
                    id="status-select"
                    value={userForm.enabled ? 'active' : 'inactive'}
                    label="Trạng thái"
                    onChange={(e) => setUserForm(prev => ({ ...prev, enabled: e.target.value === 'active' }))}
                  >
                    <MenuItem value="active">Hoạt động</MenuItem>
                    <MenuItem value="inactive">Bị khóa</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {!userForm.id && (
                <>
                  <Box>
                    <TextField
                      fullWidth
                      label="Mật khẩu"
                      name="password"
                      type="password"
                      value={userForm.password}
                      onChange={handleUserFormChange}
                      required
                    />
                  </Box>
                  <Box>
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
                  </Box>
                </>
              )}
            </Box>
          </Box>
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
