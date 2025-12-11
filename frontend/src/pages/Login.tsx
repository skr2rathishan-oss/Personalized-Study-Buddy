import { useState, FormEvent } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const performLogin = async (u: string, p: string) => {
        try {
            const res = await api.post('/auth/login', { username: u, password: p });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('username', res.data.username);
            if (res.data.profile_image) {
                localStorage.setItem('profile_image', res.data.profile_image);
            } else {
                localStorage.removeItem('profile_image');
            }
            if (res.data.university) localStorage.setItem('university', res.data.university);
            if (res.data.university_course) localStorage.setItem('university_course', res.data.university_course);

            navigate('/', { replace: true });
        } catch (err: any) {
            alert('Login failed: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        await performLogin(username, password);
    };

    return (
        <div className="login-page-wrapper">
            {/* Left Side: Branding / Hero */}
            <div className="login-hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        <span className="hero-welcome">Welcome to</span>
                        <span className="hero-brand">Study Buddy</span>
                    </h1>
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
                    <div className="login-header desktop-only">
                        <h2>Sign In</h2>
                        <p>Enter your credentials to access your account</p>
                    </div>
                    <div className="mobile-brand-header">
                        <span className="brand-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>StudyBuddy</span>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Your AI Learning Companion</p>
                    </div>
                    <div className="mobile-welcome-header">

                        <h1 className="welcome-main">Log In!</h1>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="form-group-clean">
                            <label>EMAIL ADDRESS</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="example@gmail.com"
                                required
                            />
                        </div>
                        <div className="form-group-clean">
                            <label>PASSWORD</label>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="form-options">
                            <label className="checkbox-container">
                                <input type="checkbox" />
                                <span className="checkmark"></span>
                                Remember me
                            </label>
                            <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}>Forgot password?</a>
                        </div>

                        <button type="submit" className="btn-modern-primary">
                            Sign In
                        </button>
                    </form>

                    <div className="register-callout">
                        <p className="auth-switch-text desktop-only" style={{ marginBottom: '0.5rem', marginTop: 0 }}>New here?</p>
                        <button onClick={() => navigate('/register')} className="btn-modern-secondary desktop-only" style={{ width: '100%' }}>
                            Create an Account
                        </button>
                        <button onClick={() => navigate('/register')} className="create-account-link mobile-only">
                            Create a New Account
                        </button>
                    </div>

                    <div className="demo-credentials-clean" style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Demo Accounts (One-Click)</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                            <div onClick={() => performLogin('student1', 'password123')} style={{ cursor: 'pointer', padding: '4px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}>
                                <strong>Student</strong><br /><span style={{ color: '#64748b' }}>student1</span>
                            </div>
                            <div onClick={() => performLogin('admin1', 'password123')} style={{ cursor: 'pointer', padding: '4px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}>
                                <strong>Admin</strong><br /><span style={{ color: '#64748b' }}>admin1</span>
                            </div>
                            <div onClick={() => performLogin('manager1', 'password')} style={{ cursor: 'pointer', padding: '4px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center' }}>
                                <strong>Mgmt</strong><br /><span style={{ color: '#64748b' }}>manager1</span>
                            </div>
                        </div>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center' }}>Click box to Login Instantly</p>
                    </div>
                </div>
            </div>



        </div >
    );
}

export default Login;
