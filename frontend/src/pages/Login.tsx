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
                            <label>Username / Email</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="name@university.edu"
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
                            <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); alert('Password reset placeholder'); }}>Forgot password?</a>
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

                    <div className="demo-credentials-clean">
                        <small>Demo: student1 / password</small>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
