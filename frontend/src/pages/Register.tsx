import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import OtpVerification from '../components/OtpVerification';

const UNIVERSITY_COURSES: { [key: string]: string[] } = {
    "Demo University": ["Computer Science"],
    "University of Colombo": ["Medicine", "Science", "Law", "Arts", "Management & Finance", "Technology", "Nursing", "Computing"],
    "University of Peradeniya": ["Agriculture", "Allied Health Sciences", "Arts", "Dental Sciences", "Engineering", "Management", "Medicine", "Science", "Veterinary Medicine"],
    "University of Sri Jayewardenepura": ["Humanities and Social Sciences", "Applied Sciences", "Management Studies & Commerce", "Medical Sciences", "Technology", "Engineering", "Allied Health Sciences", "Computing"],
    "University of Kelaniya": ["Commerce and Management Studies", "Computing and Technology", "Humanities", "Medicine", "Science", "Social Sciences"],
    "University of Moratuwa": ["Architecture", "Engineering", "Information Technology", "Business"],
    "University of Jaffna": ["Agriculture", "Arts", "Engineering", "Management Studies & Commerce", "Medicine", "Science", "Technology", "Hindu Studies"],
    "University of Ruhuna": ["Agriculture", "Allied Health Sciences", "Engineering", "Fisheries and Marine Sciences & Technology", "Humanities and Social Sciences", "Management and Finance", "Medicine", "Science", "Technology"],
    "Eastern University, Sri Lanka": ["Agriculture", "Arts and Culture", "Commerce and Management", "Health Care Sciences", "Science", "Technology"],
    "South Eastern University of Sri Lanka": ["Applied Sciences", "Arts and Culture", "Engineering", "Management and Commerce", "Islamic Studies & Arabic Language", "Technology"],
    "Rajarata University of Sri Lanka": ["Agriculture", "Applied Sciences", "Management Studies", "Medicine and Allied Health Sciences", "Social Sciences and Humanities", "Technology"],
    "Sabaragamuwa University of Sri Lanka": ["Agricultural Sciences", "Applied Sciences", "Geomatics", "Management Studies", "Medicine", "Social Sciences & Languages", "Technology"],
    "Wayamba University of Sri Lanka": ["Agriculture and Plantation Management", "Applied Sciences", "Business Studies and Finance", "Livestock, Fisheries and Nutrition", "Medicine", "Technology"],
    "Uva Wellassa University": ["Animal Science and Export Agriculture", "Applied Sciences", "Management", "Technological Studies"],
    "University of the Visual & Performing Arts": ["Dance", "Music", "Visual Arts"],
    "Gampaha Wickramarachchi University": ["Indigenous Medicine", "Technology", "Management"],
    "University of Vavuniya": ["Applied Science", "Business Studies", "Technological Studies"],
    "Open University of Sri Lanka": ["Education", "Engineering Technology", "Health Sciences", "Humanities and Social Sciences", "Management", "Natural Sciences"],
    "Ocean University of Sri Lanka": ["Fisheries and Marine Science", "Marine Engineering", "Maritime Transportation Management"],
    "SLIIT (Sri Lanka Institute of Information Technology)": ["Computing", "Business", "Engineering", "Humanities & Sciences", "Architecture"],
    "NSBM Green University": ["Business", "Computing", "Engineering"],
    "CINEC Campus": ["Maritime Sciences", "Engineering", "Management", "IT", "Aviation"],
    "Horizon Campus": ["Education", "IT", "Management", "Science"],
    "SAEGIS Campus": ["Business", "IT"],
    "ESOFT Metro Campus": ["Computing", "Business", "Engineering"],
    "ICBT Campus": ["IT", "Business", "Engineering", "Psychology"],
    "IIT (Informatics Institute of Technology)": ["Software Engineering", "Computer Science", "Business Information Systems"],
    "KDU (Kotelawala Defence University)": ["Defence Studies", "Medicine", "Engineering", "Law", "Management", "Computing"],
    "APIIT (Asia Pacific Institute of Information Technology)": ["Computing", "Business", "Law"],
    "Royal Institute of Colombo": ["Law", "Economics", "International Relations", "Finance"],
    "SLTC Research University": ["Engineering", "Technology", "Music", "Professional Studies"],
    "Aquinas College of Higher Studies": ["Theology", "Psychology", "Management", "IT"],
    "KIU (KAATSU International University)": ["Nursing", "Biomedical Science", "Psychology", "Management"],
    "NIBM (National Institute of Business Management)": ["Business Management", "Computing", "Design", "Engineering"],
    "Standard": ["Computer Science", "software Engineering", "Information Technology", "Business Management", "Accounting", "Marketing", "Medicine", "Engineering", "Law", "Arts", "Psychology", "Other"]
};

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

    const [course, setCourse] = useState('');
    const [studentId, setStudentId] = useState('');

    // Dynamic Course Logic
    const [availableCourses, setAvailableCourses] = useState<string[]>([]);
    const [isCustomCourse, setIsCustomCourse] = useState(false);

    // Credentials
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // OTP is now managed in child component, but we keep state here if needed for final register call OR pass it up
    // Actually, let's just accept it in the final handler

    // List of Universities
    const sriLankaUniversities = [
        "Demo University",
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

    const handleVerifyAndRegister = async (otpCode: string) => {
        // e: FormEvent is no longer passed directly, simpler to just take OTP
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
                otp: otpCode
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

                    <div className="mobile-brand-header">
                        <span className="brand-gradient" style={{ fontSize: '2rem', fontWeight: 800 }}>StudyBuddy</span>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Join the Future of Learning</p>
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
                        <OtpVerification
                            phoneNumber={phoneNumber}
                            onBack={() => setStep(1)}
                            onSuccess={(otpCode) => handleVerifyAndRegister(otpCode)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Register;
