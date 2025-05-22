import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

export const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar onToggleSidebar={handleDrawerToggle} />
      
      {isAuthenticated && (
        <Sidebar 
          drawerWidth={drawerWidth} 
          mobileOpen={mobileOpen} 
          handleDrawerToggle={handleDrawerToggle} 
        />
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${isAuthenticated ? drawerWidth : 0}px)` },
          ml: { sm: isAuthenticated ? `${drawerWidth}px` : 0 }
        }}
      >
        <Toolbar /> {/* Adds spacing below app bar */}
        <Outlet />
      </Box>
    </Box>
  );
};
