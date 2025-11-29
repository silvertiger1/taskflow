import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Services
import { authService } from './services/authService';
import { socketService } from './services/socketService';

// Styles
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          socketService.connect(token);
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
    socketService.connect(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    socketService.disconnect();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading TaskFlow...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/register" element={
            user ? <Navigate to="/dashboard" /> : <Register onLogin={handleLogin} />
          } />
          
          {/* Private Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute user={user}>
              <Dashboard user={user} />
            </PrivateRoute>
          } />
          <Route path="/projects" element={
            <PrivateRoute user={user}>
              <Projects user={user} />
            </PrivateRoute>
          } />
          <Route path="/tasks" element={
            <PrivateRoute user={user}>
              <Tasks user={user} />
            </PrivateRoute>
          } />
          
          {/* Default Route */}
          <Route path="/" element={
            user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          } />
        </Routes>

        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </Router>
  );
}

export default App;
