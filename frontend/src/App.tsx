import { JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManagementAnalytics from './pages/ManagementAnalytics';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';
import PersonalTracking from './pages/PersonalTracking';
import History from './pages/History';
import UserManagement from './pages/UserManagement';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

interface PrivateRouteProps {
    children: JSX.Element;
    allowedRoles?: string[];
}

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) return <Navigate to="/login" />;

    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        // Redirect to home if unauthorized
        return <Navigate to="/" />;
    }

    return children;
};

// Intelligently route based on role for /admin path
const AdminRoute = () => {
    const role = localStorage.getItem('role');
    return role === 'management' ? <ManagementAnalytics /> : <AdminDashboard />;
};

function AppContent() {
    const location = useLocation();
    // Hide footer on auth pages
    const hideFooter = ['/login', '/register', '/forgot-password'].includes(location.pathname);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <div style={{ flex: 1 }}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* Main Landing is the Student Dashboard (Course Selection) for EVERYONE */}
                    <Route path="/" element={
                        <PrivateRoute>
                            <StudentDashboard />
                        </PrivateRoute>
                    } />

                    {/* Admin/Mgmt specific route accessed via menu */}
                    <Route path="/admin" element={
                        <PrivateRoute allowedRoles={['admin', 'management']}>
                            <AdminRoute />
                        </PrivateRoute>
                    } />

                    {/* Profile & Settings */}
                    <Route path="/profile" element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    } />
                    <Route path="/settings" element={
                        <PrivateRoute>
                            <Settings />
                        </PrivateRoute>
                    } />

                    {/* New Feature Pages */}
                    <Route path="/calendar" element={
                        <PrivateRoute>
                            <Calendar />
                        </PrivateRoute>
                    } />
                    <Route path="/tracking" element={
                        <PrivateRoute>
                            <PersonalTracking />
                        </PrivateRoute>
                    } />
                    <Route path="/history" element={
                        <PrivateRoute>
                            <History />
                        </PrivateRoute>
                    } />

                    {/* User Management (Admin) */}
                    <Route path="/users" element={
                        <PrivateRoute allowedRoles={['admin', 'management']}>
                            <UserManagement />
                        </PrivateRoute>
                    } />

                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </div>
            {!hideFooter && <Footer />}
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
