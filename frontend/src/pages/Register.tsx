import { useState, FormEvent } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function Register() {
    const navigate = useNavigate();

    // Form States
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [loading, setLoading] = useState(false);

    // Details - Split into logical groups
    // Personal
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [nic, setNic] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // Academic
    const [university, setUniversity] = useState('');
    const [course, setCourse] = useState('');
    const [uniId, setUniId] = useState('');

    // Credentials
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // OTP
    const [otp, setOtp] = useState('');

    const handleSaveDetails = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Trigger OTP Send
            await api.post('/auth/otp/send', { phone_number: phoneNumber });
            // If successful, move to next step
            setStep(2);
        } catch (err: any) {
            alert('Failed to send OTP: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndRegister = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/register', {
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                nic,
                university,
                university_course: course,
                university_id: uniId,
                phone_number: phoneNumber,
                otp
            });
            alert('Registration verified and successful!');
            navigate('/login');
        } catch (err: any) {
            alert('Registration failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-wrapper">
            {/* Left Side: Branding / Hero */}
            <div className="auth-hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Join<br />Study Buddy</h1>
                    <p className="hero-subtitle">
                        Create your account to start your personalized learning journey.
                        Access curated resources tailored just for you.
                    </p>
                    <div className="hero-shapes"></div>
                </div>
            </div>

            {/* Right Side: Registration Form */}
            <div className="auth-form-section">
                <div className="register-card animate-slide-up">
                    <div className="auth-progress">
                        <div className={`step-dot ${step >= 1 ? 'active' : ''}`} title="Details"></div>
                        <div className={`step-dot ${step >= 2 ? 'active' : ''}`} title="Verification"></div>
                    </div>

                    <div className="login-header">
                        <h2>{step === 1 ? 'Create Account' : 'Verify Phone'}</h2>
                        <p>{step === 1 ? 'Please fill in your details below' : `We sent a code to ${phoneNumber}`}</p>
                    </div>

                    {step === 1 && (
                        <form onSubmit={handleSaveDetails}>
                            {/* Personal Info Grid */}
                            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Personal Info</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 1fr', gap: '20px' }}>
                                <div className="form-group-clean">
                                    <label>First Name</label>
                                    <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" />
                                </div>
                                <div className="form-group-clean">
                                    <label>Last Name</label>
                                    <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group-clean">
                                    <label>NIC No.</label>
                                    <input type="text" required value={nic} onChange={e => setNic(e.target.value)} />
                                </div>
                                <div className="form-group-clean">
                                    <label>Phone Number</label>
                                    <input type="text" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+94..." />
                                </div>
                            </div>

                            {/* Academic Info */}
                            <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Academic Details</h4>
                            <div className="form-group-clean">
                                <label>University</label>
                                <input type="text" required value={university} onChange={e => setUniversity(e.target.value)} placeholder="e.g. University of Colombo" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                <div className="form-group-clean">
                                    <label>Course / Major</label>
                                    <input type="text" required value={course} onChange={e => setCourse(e.target.value)} placeholder="Computer Science" />
                                </div>
                                <div className="form-group-clean">
                                    <label>Student ID</label>
                                    <input type="text" required value={uniId} onChange={e => setUniId(e.target.value)} />
                                </div>
                            </div>

                            {/* Credentials */}
                            <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Account Security</h4>
                            <div className="form-group-clean">
                                <label>Email Address</label>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
                            </div>
                            <div className="form-group-clean">
                                <label>Password</label>
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
                                <button type="button" onClick={() => navigate('/login')} style={{ border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-modern-primary" disabled={loading} style={{ width: 'auto', paddingLeft: '2rem', paddingRight: '2rem' }}>
                                    {loading ? 'Processing...' : 'Next Step →'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyAndRegister}>
                            <div className="form-group-clean" style={{ textAlign: 'center' }}>
                                <label style={{ textAlign: 'center', marginBottom: '1rem' }}>One-Time Password (OTP)</label>
                                <input
                                    type="text"
                                    className="otp-input"
                                    placeholder="----"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    required
                                    maxLength={6}
                                />
                                <small style={{ display: 'block', marginTop: '1rem', color: 'var(--text-secondary)' }}>
                                    Please enter the verification code sent to your mobile.
                                </small>
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button type="submit" className="btn-modern-primary" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Complete Registration'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-modern-outline"
                                    onClick={() => setStep(1)}
                                    style={{ border: 'none' }}
                                >
                                    ← Back to Details
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Register;
