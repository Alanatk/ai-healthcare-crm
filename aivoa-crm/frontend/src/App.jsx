import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import store from './store/store';
import { ThemeProvider, CssBaseline } from '@mui/material';
import getTheme from './theme';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LogInteraction from './pages/LogInteraction';

function ProtectedRoute({ children, mode, toggleMode }) {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout mode={mode} toggleMode={toggleMode}>{children}</Layout>;
}

function MainApp() {
  const [mode, setMode] = useState('dark'); // Sleek dark mode by default

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = getTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute mode={mode} toggleMode={toggleMode}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log"
            element={
              <ProtectedRoute mode={mode} toggleMode={toggleMode}>
                <LogInteraction />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <MainApp />
    </Provider>
  );
}
