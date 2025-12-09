import { useState, FormEvent } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { username, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('username', res.data.username);
            if (res.data.profile_image) {
                localStorage.setItem('profile_image', res.data.profile_image);
            } else {
                localStorage.removeItem('profile_image');
            }

            if (res.data.role === 'admin' || res.data.role === 'management') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            // In a real app, use a toast
            alert('Login failed: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="login-page-wrapper">
            {/* Left Side: Branding / Hero */}
            <div className="login-hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Welcome to<br />Study Buddy</h1>
                    <p className="hero-subtitle">
                        Your personalized AI-driven learning companion.
                        Master your courses with tailored recommendations.
                    </p>
                    <div className="hero-shapes"></div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="login-form-section">
                <div className="login-card-clean animate-slide-up">
                    <div className="login-header">
                        <h2>Sign In</h2>
                        <p>Enter your credentials to access your account</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="form-group-clean">
                            <label>Email or Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Enter your email or username"
                                required
                            />
                        </div>
                        <div className="form-group-clean">
                            <label>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}>Forgot password?</a>
                        </div>

                        <button type="submit" className="btn-modern-primary">
                            Sign In
                        </button>
                    </form>

                    <div className="register-callout">
                        <p>New here?</p>
                        <button onClick={() => navigate('/register')} className="btn-modern-outline">
                            Create an Account
                        </button>
                    </div>

                    <div className="demo-credentials-clean" style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Demo Accounts</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                            <div onClick={() => { setUsername('student1'); setPassword('password'); }} style={{ cursor: 'pointer', padding: '4px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}>
                                <strong>Student</strong><br /><span style={{ color: '#64748b' }}>student1</span>
                            </div>
                            <div onClick={() => { setUsername('admin1'); setPassword('password'); }} style={{ cursor: 'pointer', padding: '4px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}>
                                <strong>Admin</strong><br /><span style={{ color: '#64748b' }}>admin1</span>
                            </div>
                            <div onClick={() => { setUsername('manager1'); setPassword('password'); }} style={{ cursor: 'pointer', padding: '4px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}>
                                <strong>Mgmt</strong><br /><span style={{ color: '#64748b' }}>manager1</span>
                            </div>
                        </div>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center' }}>Password for all: <strong>password</strong></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
