import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import UserLayout from './components/layout/UserLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import FileManagement from './pages/FileManagement';
import LogManagement from './pages/LogManagement';
import MyLogs from './pages/MyLogs';
import Login from './pages/Login';
import Register from './pages/Register';

import "./index.css"
import ViewLogs from './pages/ViewLogs';
import UserProfile from './pages/UserProfile';
import UserDashboard from './pages/UserDashboard';
import LoginHistory from './pages/LoginHistory';
import AuditTrail from './pages/AuditTrail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/login" element={<Login />} />
        <Route path='/register' element={<Register/>} />

        {/* --- Admin Protected Routes --- */}
        <Route path="/admin" element={<ProtectedRoute> <AdminLayout /> </ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="files" element={<FileManagement />} />
          <Route path="logs" element={<LogManagement />} />
          <Route path="audit" element={<AuditTrail />} />
        </Route>

        {/* --- User Protected Routes --- */}
        <Route path="/user" element={<ProtectedRoute> <UserLayout /> </ProtectedRoute>}>
          {/* Matches /user/dashboard */}
           <Route path="dashboard" element={<UserDashboard />} />
          
          {/* Matches /user/my-logs (The File Management view for users) */}
          <Route path="my-logs" element={<MyLogs />} />
          
          {/* Matches /user/view-logs (The Log Explorer view for users) */}
          <Route path="view-logs" element={<ViewLogs />} />
          
          <Route path="security" element={<LoginHistory />} />
          {/* Matches /user/profile */}
          <Route path="profile" element={<UserProfile />} />
        </Route>

        {/* --- Global Redirects --- */}
        {/* If user hits "/", redirect to login (safer than forcing /admin) */}
         <Route path="profile" element={<UserProfile />} />
        
        {/* Catch-all route for 404s */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}