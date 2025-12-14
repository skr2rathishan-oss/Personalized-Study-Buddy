import { useState, FormEvent } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const performLogin = async (u: string, p: string) => {
        try {
            const res = await api.post('/auth/login', { username: u, password: p });
            sessionStorage.setItem('token', res.data.token);
            sessionStorage.setItem('role', res.data.role);
            sessionStorage.setItem('username', res.data.username);
            if (res.data.profile_image) {
                sessionStorage.setItem('profile_image', res.data.profile_image);
            } else {
                sessionStorage.removeItem('profile_image');
            }
            if (res.data.university) sessionStorage.setItem('university', res.data.university);
            if (res.data.university_course) sessionStorage.setItem('university_course', res.data.university_course);

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
        <div className="modern-login-container">
            {/* Visual Side (Desktop Only) */}
            <div className="brand-sidebar">
                <div className="brand-content">
                    <h1>StudyBuddy AI</h1>
                    <p>Your intelligent companion for academic excellence.</p>
                    <div className="abstract-shape shape-1"></div>
                    <div className="abstract-shape shape-2"></div>
                </div>
            </div>

            {/* Form Side */}
            <div className="form-sidebar">
                <div className="form-card">
                    <div className="mobile-brand-header">
                        <h2>StudyBuddy</h2>
                    </div>

                    <div className="form-header">
                        <h2>Welcome Back</h2>
                        <p>Please sign in to continue</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="mobile-form-container">
                            <div className="input-group">
                                <label>Email Address</label>
                                <input
                                    type="text"
                                    placeholder="name@example.com"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Password</label>
                                <div className="password-field">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>

                            <div className="action-row">
                                <label className="remember-me">
                                    <input type="checkbox" />
                                    <span>Remember me</span>
                                </label>
                                <span className="forgot-link" onClick={() => navigate('/forgot-password')}>Forgot Password?</span>
                            </div>

                            <button type="submit" className="signin-btn">Sign In</button>

                            <div className="register-row">
                                <span>Don't have an account?</span>
                                <span className="register-link" onClick={() => navigate('/register')}>Register Now</span>
                            </div>
                        </div>
                    </form>

                    {/* Demo Accounts */}

                </div>
            </div>
        </div>
    );
}

export default Login;
