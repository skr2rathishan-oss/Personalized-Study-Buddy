import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function ForgotPassword() {
    const navigate = useNavigate();

    // 1: Request, 2: OTP, 3: New Password, 4: Success
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [identifier, setIdentifier] = useState(''); // Email or Phone
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // --- Actions ---

    const handleRequestOTP = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/otp/send', {
                phone_number: identifier
            });
            // Assuming simplified flow where identifier is email. Backend resolves.
            setStep(2);
        } catch (err: any) {
            alert('Failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/otp/verify', {
                identifier,
                otp
            });
            setStep(3);
        } catch (err: any) {
            alert('Verification Failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                identifier,
                new_password: newPassword,
                otp // Pass OTP again for security check
            });
            setStep(4);
        } catch (err: any) {
            alert('Reset Failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-wrapper">
            {/* Left Side: Hero */}
            <div className="auth-hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Reset<br />Password</h1>
                    <p className="hero-subtitle">
                        {step === 1 && "Enter your email or phone to receive a verification code."}
                        {step === 2 && "We've sent a code to your device. Please enter it below."}
                        {step === 3 && "Secure your account with a new, strong password."}
                        {step === 4 && "All done! You can now access your account."}
                    </p>
                    <div className="hero-shapes"></div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="auth-form-section">
                <div className="register-card animate-slide-up" style={{ maxWidth: '450px' }}>

                    {/* Render Step 1: Request */}
                    {step === 1 && (
                        <>
                            <div className="login-header">
                                <h2>Forgot Password?</h2>
                                <p>No problem. Enter your email or mobile number.</p>
                            </div>
                            <form onSubmit={handleRequestOTP}>
                                <div className="form-group-clean">
                                    <label>Email or Mobile Number</label>
                                    <input
                                        type="text"
                                        required
                                        value={identifier}
                                        onChange={e => setIdentifier(e.target.value)}
                                        placeholder="jane@example.com or +94..."
                                    />
                                </div>
                                <button type="submit" className="btn-modern-primary" disabled={loading}>
                                    {loading ? 'Sending Code...' : 'Send OTP Code'}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Render Step 2: Verify OTP */}
                    {step === 2 && (
                        <>
                            <div className="login-header">
                                <h2>Enter Code</h2>
                                <p>Enter the 6-digit code sent to {identifier}</p>
                            </div>
                            <form onSubmit={handleVerifyOTP}>
                                <div className="form-group-clean">
                                    <label style={{ textAlign: 'center' }}>Verification Code</label>
                                    <input
                                        type="text"
                                        className="otp-input"
                                        required
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        placeholder="------"
                                        maxLength={6}
                                    />
                                </div>
                                <button type="submit" className="btn-modern-primary" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify & Continue'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-modern-outline"
                                    onClick={() => setStep(1)}
                                    style={{ marginTop: '1rem', border: 'none' }}
                                >
                                    Change Email/Phone
                                </button>
                            </form>
                        </>
                    )}

                    {/* Render Step 3: New Password */}
                    {step === 3 && (
                        <>
                            <div className="login-header">
                                <h2>Reset Password</h2>
                                <p>Create a strong password for your account.</p>
                            </div>
                            <form onSubmit={handleResetPassword}>
                                <div className="form-group-clean">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                                <div className="form-group-clean">
                                    <label>Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                                <button type="submit" className="btn-modern-primary" disabled={loading}>
                                    {loading ? 'Resetting...' : 'Set New Password'}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Render Step 4: Success */}
                    {step === 4 && (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{
                                width: '60px', height: '60px', background: '#ECFDF5', color: '#10B981',
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.5rem', fontSize: '2rem'
                            }}>
                                ✓
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Password Reset!</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                Your password has been successfully updated.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-modern-primary"
                            >
                                Back to Login
                            </button>
                        </div>
                    )}

                    {/* Back Link (Only for Step 1) */}
                    {step === 1 && (
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-modern-outline"
                                style={{ border: 'none', color: 'var(--text-secondary)' }}
                            >
                                ← Back to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>



        </div >
    );
}

export default ForgotPassword;
