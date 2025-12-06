import { JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';
import PersonalTracking from './pages/PersonalTracking';
import History from './pages/History';
import UserManagement from './pages/UserManagement';
import Navbar from './components/Navbar';

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

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Main Landing: Student Dashboard */}
                <Route path="/" element={
                    <PrivateRoute>
                        <StudentDashboard />
                    </PrivateRoute>
                } />

                {/* Admin Dashboard */}
                <Route path="/admin" element={
                    <PrivateRoute allowedRoles={['admin', 'management']}>
                        <AdminDashboard />
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
        </Router>
    );
}

export default App;
