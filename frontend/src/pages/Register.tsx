import { useState, FormEvent, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { UNIVERSITY_COURSES } from '../data/UniversityInfo';

function Register() {
    const navigate = useNavigate();

    // Form States
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [loading, setLoading] = useState(false);

    // Details
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [nic, setNic] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // Academic
    const [university, setUniversity] = useState('');
    const [selectedUniId, setSelectedUniId] = useState('');
    const [course, setCourse] = useState('');
    const [studentId, setStudentId] = useState('');

    // Dynamic Course Logic
    const [availableCourses, setAvailableCourses] = useState<string[]>([]);
    const [isCustomCourse, setIsCustomCourse] = useState(false);

    // Credentials
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');

    // List of Universities
    const sriLankaUniversities = [
        "University of Colombo", "University of Peradeniya", "University of Sri Jayewardenepura",
        "University of Kelaniya", "University of Moratuwa", "University of Jaffna",
        "University of Ruhuna", "Eastern University, Sri Lanka", "South Eastern University of Sri Lanka",
        "Rajarata University of Sri Lanka", "Sabaragamuwa University of Sri Lanka", "Wayamba University of Sri Lanka",
        "Uva Wellassa University", "University of the Visual & Performing Arts", "Gampaha Wickramarachchi University",
        "University of Vavuniya", "Open University of Sri Lanka", "Ocean University of Sri Lanka",
        "SLIIT (Sri Lanka Institute of Information Technology)", "NSBM Green University",
        "CINEC Campus", "Horizon Campus", "SAEGIS Campus", "ESOFT Metro Campus", "ICBT Campus",
        "IIT (Informatics Institute of Technology)", "KDU (Kotelawala Defence University)",
        "APIIT (Asia Pacific Institute of Information Technology)", "Royal Institute of Colombo",
        "SLTC Research University", "Aquinas College of Higher Studies", "KIU (KAATSU International University)",
        "NIBM (National Institute of Business Management)", "Saegis Campus", "Other"
    ].sort();

    // Update available courses when university changes
    useEffect(() => {
        if (university && UNIVERSITY_COURSES[university]) {
            setAvailableCourses(UNIVERSITY_COURSES[university]);
            setIsCustomCourse(false);
            setCourse(''); // Reset course selection
        } else if (university) {
            // Fallback to standard list if specific uni not found in our data map
            setAvailableCourses(UNIVERSITY_COURSES['Standard']);
            setIsCustomCourse(false);
            setCourse('');
        } else {
            setAvailableCourses([]);
        }
    }, [university]);

    const handleSaveDetails = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/otp/send', { phone_number: phoneNumber });
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
                university: university,
                university_course: course,
                university_student_id: studentId,
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

                            <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Academic Details</h4>
                            <div className="form-group-clean">
                                <label>University</label>
                                <select
                                    required
                                    value={university}
                                    onChange={e => setUniversity(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                                >
                                    <option value="">Select your university...</option>
                                    {sriLankaUniversities.map((uni, idx) => (
                                        <option key={idx} value={uni}>{uni}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                <div className="form-group-clean">
                                    <label>Course / Major</label>
                                    {!isCustomCourse ? (
                                        <select
                                            required
                                            disabled={!university}
                                            value={course}
                                            onChange={e => {
                                                if (e.target.value === 'Other') {
                                                    setIsCustomCourse(true);
                                                    setCourse('');
                                                } else {
                                                    setCourse(e.target.value);
                                                }
                                            }}
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', background: !university ? '#F3F4F6' : 'white' }}
                                        >
                                            <option value="">{university ? "Select Course..." : "Select University First"}</option>
                                            {availableCourses.map((c, i) => <option key={i} value={c}>{c}</option>)}
                                            <option value="Other">Other / Not Listed</option>
                                        </select>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                required
                                                value={course}
                                                onChange={e => setCourse(e.target.value)}
                                                placeholder="Enter Course name manually..."
                                                style={{ flex: 1 }}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={() => { setIsCustomCourse(false); setCourse(''); }}
                                                style={{ background: '#FECACA', color: '#DC2626', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                                                title="Back to list"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="form-group-clean">
                                    <label>Student ID</label>
                                    <input type="text" required value={studentId} onChange={e => setStudentId(e.target.value)} />
                                </div>
                            </div>

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
