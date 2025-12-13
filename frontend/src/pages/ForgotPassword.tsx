import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './ForgotPassword.css';

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
                phone_number: identifier,
                purpose: 'password_reset'  // Specify this is for password reset
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
        <div className="forgot-password-container">
            {/* Brand Side (Desktop) */}
            <div className="forgot-brand-sidebar">
                <div className="brand-content">
                    <h1>Reset<br />Password</h1>
                    <p>
                        {step === 1 && "Start by entering your details."}
                        {step === 2 && "Verification is key."}
                        {step === 3 && "Secure your account."}
                        {step === 4 && "Welcome back!"}
                    </p>
                    <div className="shape-circle shape-1"></div>
                    <div className="shape-circle shape-2"></div>
                </div>
            </div>

            {/* Form Side */}
            <div className="forgot-form-sidebar">
                <div className="forgot-card">

                    {/* Mobile Only Header */}
                    <div className="mobile-header">
                        <h2>StudyBuddy</h2>
                    </div>

                    {/* Step 1: Request */}
                    {step === 1 && (
                        <>
                            <div className="forgot-header">
                                <h2>Forgot Password?</h2>
                                <p>No problem. Enter the email or mobile number associated with your account.</p>
                            </div>
                            <form onSubmit={handleRequestOTP}>
                                <div className="form-group-modern">
                                    <label>Email or Mobile Number</label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        disabled={loading}
                                        value={identifier}
                                        onChange={e => setIdentifier(e.target.value)}
                                        placeholder="jane@example.com or 94..."
                                    />
                                </div>
                                <button type="submit" className="btn-primary-action" disabled={loading}>
                                    {loading ? 'Sending Code...' : 'Send OTP Code'}
                                </button>
                                <div className="back-link-container">
                                    <button type="button" onClick={() => navigate('/login')} className="btn-back-link">
                                        Back to Login
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {/* Step 2: Verify OTP */}
                    {step === 2 && (
                        <>
                            <div className="forgot-header">
                                <h2>Enter Verification Code</h2>
                                <p>We've sent a 6-digit code to <strong>{identifier}</strong></p>
                            </div>
                            <form onSubmit={handleVerifyOTP}>
                                <div className="form-group-modern">
                                    <label style={{ textAlign: 'center' }}>Code</label>
                                    <input
                                        type="text"
                                        className="otp-input"
                                        required
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        placeholder="------"
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>
                                <button type="submit" className="btn-primary-action" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Verify & Continue'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-outline-action"
                                    onClick={() => setStep(1)}
                                >
                                    Change Email/Phone
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 3: New Password */}
                    {step === 3 && (
                        <>
                            <div className="forgot-header">
                                <h2>New Password</h2>
                                <p>Create a strong password that you haven't used before.</p>
                            </div>
                            <form onSubmit={handleResetPassword}>
                                <div className="form-group-modern">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={6}
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group-modern">
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
                                <button type="submit" className="btn-primary-action" disabled={loading}>
                                    {loading ? 'Resetting...' : 'Set New Password'}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div style={{ textAlign: 'center' }}>
                            <div className="success-icon-circle">
                                ✓
                            </div>
                            <div className="forgot-header" style={{ textAlign: 'center' }}>
                                <h2>Password Reset!</h2>
                                <p>Your password has been successfully updated. You can now log in with your new credentials.</p>
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary-action"
                            >
                                Back to Login
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
