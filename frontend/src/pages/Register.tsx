import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import OtpVerification from '../components/OtpVerification';
import './Register.css';

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
        <div className="modern-register-container">
            {/* Visual Side (Desktop Only) */}
            <div className="register-brand-sidebar">
                <div className="brand-content">
                    <h1>Join<br />Study Buddy</h1>
                    <p>Create your account to start your personalized learning journey.</p>
                    <div className="shape-circle shape-1"></div>
                    <div className="shape-circle shape-2"></div>
                </div>
            </div>

            {/* Form Side */}
            <div className="register-form-sidebar">
                <div className="register-card">

                    {/* Mobile Header */}
                    <div className="mobile-header">
                        <h2>StudyBuddy</h2>
                    </div>

                    {/* Progress Steps */}
                    <div className="wizard-progress">
                        <div className={`wizard-step ${step >= 1 ? 'active' : ''}`}>
                            <div className="step-circle">1</div>
                            <span>Details</span>
                        </div>
                        <div className={`progress-line ${step >= 2 ? 'filled' : ''}`}></div>
                        <div className={`wizard-step ${step >= 2 ? 'active' : ''}`}>
                            <div className="step-circle">2</div>
                            <span>Verify</span>
                        </div>
                    </div>

                    <div className="register-content-scroll">
                        <div className="register-header">
                            <h2>{step === 1 ? 'Create Account' : 'Verify Phone'}</h2>
                            <p>{step === 1 ? 'Please fill in your details below' : `We sent a code to ${phoneNumber}`}</p>
                        </div>

                        {step === 1 && (
                            <form onSubmit={handleSaveDetails}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>First Name</label>
                                        <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" />
                                    </div>
                                    <div className="form-group">
                                        <label>Last Name</label>
                                        <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>NIC No.</label>
                                        <input type="text" required value={nic} onChange={e => setNic(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input type="text" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="94..." />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>University</label>
                                    <select
                                        required
                                        value={university}
                                        onChange={e => setUniversity(e.target.value)}
                                    >
                                        <option value="">Select your university...</option>
                                        {sriLankaUniversities.map((uni, idx) => (
                                            <option key={idx} value={uni}>{uni}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 2 }}>
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
                                                style={{ background: !university ? '#F3F4F6' : 'white' }}
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
                                                    placeholder="Enter Course name..."
                                                    style={{ flex: 1 }}
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => { setIsCustomCourse(false); setCourse(''); }}
                                                    style={{ background: '#FECACA', color: '#DC2626', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}
                                                    title="Back to list"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Student ID</label>
                                        <input type="text" required value={studentId} onChange={e => setStudentId(e.target.value)} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
                                </div>

                                <div className="wizard-actions">
                                    <button type="button" onClick={() => navigate('/login')} className="btn-back">
                                        Back to Login
                                    </button>
                                    <button type="submit" className="btn-next" disabled={loading}>
                                        {loading ? 'Processing...' : 'Next Step →'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 2 && (
                            <div className="otp-container-wrapper">
                                <OtpVerification
                                    phoneNumber={phoneNumber}
                                    onBack={() => setStep(1)}
                                    onSuccess={(otpCode) => handleVerifyAndRegister(otpCode)}
                                />
                                <div className="wizard-actions">
                                    {/* OTP Component handles its own actions, but we keep this div for spacing/consistency if needed */}
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="login-redirect">
                                Already have an account? <span onClick={() => navigate('/login')}>Sign In</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
