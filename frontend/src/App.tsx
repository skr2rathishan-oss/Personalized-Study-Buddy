import { JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';

interface PrivateRouteProps {
    children: JSX.Element;
    role?: string;
}

const PrivateRoute = ({ children, role }: PrivateRouteProps) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) return <Navigate to="/login" />;

    if (role && role !== userRole && userRole !== 'management') {
        return <Navigate to="/" />;
    }

    return children;
};

import Footer from './components/Footer';

function App() {
    return (
        <Router>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Navbar />
                <div style={{ flex: 1 }}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Main Landing is the Student Dashboard (Course Selection) for EVERYONE */}
                        <Route path="/" element={
                            <PrivateRoute>
                                <StudentDashboard />
                            </PrivateRoute>
                        } />

                        {/* Admin/Mgmt specific route accessed via menu */}
                        <Route path="/admin" element={
                            <PrivateRoute role="admin">
                                <AdminDashboard />
                            </PrivateRoute>
                        } />

                        {/* Fallback settings/profile pages (placeholders) */}
                        <Route path="/profile" element={
                            <PrivateRoute>
                                <div style={{ padding: '2rem', textAlign: 'center' }}><h2>Profile Page</h2><p>Coming Soon...</p></div>
                            </PrivateRoute>
                        } />
                        <Route path="/settings" element={
                            <PrivateRoute>
                                <div style={{ padding: '2rem', textAlign: 'center' }}><h2>Settings Page</h2><p>Coming Soon...</p></div>
                            </PrivateRoute>
                        } />

                        <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                </div>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
