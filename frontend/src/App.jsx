import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import FileManagement from './pages/FileManagement';
import LogManagement from './pages/LogManagement';
import Login from './pages/Login'; // Create a simple login page to store token
import "./index.css"
import ProtectedRoute from './routes/ProtectedRoute';
import Register from './pages/Register';
import UserLayout from './components/layout/UserLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path='/register' element={<Register/>} />
        <Route path="/admin" element={<ProtectedRoute > <AdminLayout />  </ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="files" element={<FileManagement />} />
          <Route path="logs" element={<LogManagement />} />
        </Route>
         <Route path="/user" element={<ProtectedRoute > <UserLayout />  </ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="files" element={<FileManagement />} />
          <Route path="logs" element={<LogManagement />} />
        </Route>
        <Route path="/" element={<Navigate to="/admin/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}