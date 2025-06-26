import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Divider, Toolbar } from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Description as DocumentsIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  SupervisedUserCircle as AdminIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
}

export const Sidebar = ({ drawerWidth, mobileOpen, handleDrawerToggle }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      permission: null,
    },
    {
      text: 'Documents',
      icon: <DocumentsIcon />,
      path: '/documents',
      permission: 'DOCUMENT_READ',
    },
    {
      text: 'Upload',
      icon: <UploadIcon />,
      path: '/upload',
      permission: 'DOCUMENT_CREATE',
    },
    {
      text: 'Search',
      icon: <SearchIcon />,
      path: '/search',
      permission: 'DOCUMENT_SEARCH',
    },
    {
      text: 'Trợ lý thông minh',
      icon: <ChatIcon />,
      path: '/chatbot',
      permission: null,
    },
    {
      text: 'Admin Panel',
      icon: <AdminIcon />,
      path: '/admin',
      permission: null, // Đổi thành null để không kiểm tra quyền
      role: 'ADMIN',
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      permission: null,
    },
  ];
  
  const filteredItems = menuItems.filter(item => {
    // Filter by permission
    if (item.permission && !hasPermission(item.permission)) {
      return false;
    }
    
    // Filter by role
    if (item.role && user?.role !== item.role) {
      return false;
    }
    
    return true;
  });

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {filteredItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};
