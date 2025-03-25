import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MainLayout from './layouts/MainLayout';
import authUtils from './utils/authUtils';
import Profile from './pages/Profile';
import EmployeeManagement from './pages/UserManagement';
import PostsManagement from './pages/PostsManagement';
import CategoriesManagement from './pages/CategoriesManagement';
import PostDetail from './pages/PostDetail';
import PostView from './pages/PostView';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!authUtils.isAuthenticated()) {
    // Lưu lại đường dẫn hiện tại trước khi chuyển hướng
    localStorage.setItem('returnUrl', location.pathname + location.search);
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    // Không cần basename vì đã có domain
    <BrowserRouter>
      <ToastContainer position="top-right" />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/posts" element={<PostsManagement />} />
                  
                  <Route path="/categories" element={<CategoriesManagement />} />
                  <Route path="/posts/view/:slug" element={<PostView />} />
                  <Route path="/users" element={<EmployeeManagement />} />
                  <Route path="/posts/:id" element={<PostDetail />} />




                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;