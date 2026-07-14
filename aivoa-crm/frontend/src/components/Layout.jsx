import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  LayoutDashboard,
  PlusCircle,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  User,
} from 'lucide-react';

const drawerWidth = 240;

export default function Layout({ children, mode, toggleMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { text: 'Log Interaction', icon: <PlusCircle size={20} />, path: '/log' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: mode === 'dark' ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon size={20} />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="span" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                🏥
              </Box>
              AIVOA<Box component="span" sx={{ color: 'primary.main' }}>.AI</Box>
            </Typography>
            <Typography
              variant="caption"
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                px: 1,
                py: 0.2,
                borderRadius: 1,
                fontWeight: 600,
                fontSize: '0.7rem',
                ml: 1,
              }}
            >
              CRM
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={toggleMode} color="inherit">
              {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>

            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Profile settings">
                  <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'secondary.main',
                        width: 36,
                        height: 36,
                        fontSize: '0.95rem',
                        fontWeight: 700,
                      }}
                    >
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  onClick={handleMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: 'divider',
                      minWidth: 180,
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={handleLogout} sx={{ color: 'error.main', gap: 1 }}>
                    <LogOut size={16} /> Logout
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 60,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: open ? drawerWidth : 60,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            overflowX: 'hidden',
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', py: 2 }}>
          <List>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                      mx: 1,
                      borderRadius: '8px',
                      bgcolor: isActive ? 'primary.main' : 'transparent',
                      color: isActive ? 'primary.contrastText' : 'text.primary',
                      '&:hover': {
                        bgcolor: isActive ? 'primary.main' : 'action.hover',
                        transform: 'translateX(2px)',
                        transition: 'transform 0.2s',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 2 : 'auto',
                        justifyContent: 'center',
                        color: 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          {open && user && (
            <Box
              sx={{
                mx: 2,
                p: 2,
                borderRadius: '12px',
                bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                LOGGED IN AS
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, noWrap: true, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', noWrap: true, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    Med Representative
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          transition: (theme) =>
            theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
