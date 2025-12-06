import { useState, FormEvent } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function Register() {
    const navigate = useNavigate();

    // Form States
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [loading, setLoading] = useState(false);

    // Details
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [nic, setNic] = useState('');
    const [university, setUniversity] = useState('');
    const [course, setCourse] = useState('');
    const [uniId, setUniId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

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
        <div className="auth-container">
            <div className="auth-card animate-fade-in" style={{ maxWidth: step === 1 ? '600px' : '400px' }}>
                <h2 className="auth-title">
                    {step === 1 ? 'Register User' : 'Verify OTP'}
                </h2>

                {step === 1 && (
                    <form onSubmit={handleSaveDetails} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label className="form-label">First Name</label>
                            <input type="text" className="form-input" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last Name</label>
                            <input type="text" className="form-input" required value={lastName} onChange={e => setLastName(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">NIC</label>
                            <input type="text" className="form-input" required value={nic} onChange={e => setNic(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input type="text" className="form-input" required placeholder="+94..." value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                        </div>

                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">University</label>
                            <input type="text" className="form-input" required value={university} onChange={e => setUniversity(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Select Course</label>
                            <input type="text" className="form-input" required placeholder="e.g. IT, Engineering" value={course} onChange={e => setCourse(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">University ID</label>
                            <input type="text" className="form-input" required value={uniId} onChange={e => setUniId(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input type="email" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Set Password</label>
                            <input type="password" className="form-input" required value={password} onChange={e => setPassword(e.target.value)} />
                        </div>

                        <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Sending OTP...' : 'Save & Send OTP'}
                            </button>
                            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                                Already have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/login')}>Login</span>
                            </p>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyAndRegister}>
                        <div className="form-notification success">
                            OTP Sent to {phoneNumber}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Enter OTP</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify & Register'}
                        </button>
                        <button
                            type="button"
                            style={{ width: '100%', marginTop: '10px', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}
                            onClick={() => setStep(1)}
                        >
                            Back to Details
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Register;
