import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import OtpVerification from '../components/OtpVerification';

const UNIVERSITY_COURSES: { [key: string]: string[] } = {
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
            {/* Hero Section - Hidden on Mobile naturally via CSS */}
            <div className="auth-hero-section register-hero">
                <div className="hero-content">
                    <h1 className="hero-title">Join<br />Study Buddy</h1>
                    <p className="hero-subtitle">
                        Create your account to start your personalized learning journey.
                        Access curated resources tailored just for you.
                    </p>
                    <div className="hero-shapes"></div>
                </div>
            </div>

            <div className="auth-form-section register-form-section">
                <div className="register-card-wizard animate-slide-up">

                    {/* Mobile Only Header */}
                    <div className="mobile-wizard-header">
                        <span className="brand-gradient">StudyBuddy</span>
                        <p>Create Account</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="wizard-progress">
                        <div className={`wizard-step ${step >= 1 ? 'active' : ''}`}>
                            <div className="step-icon">1</div>
                            <span>Details</span>
                        </div>
                        <div className="wizard-line"></div>
                        <div className={`wizard-step ${step >= 2 ? 'active' : ''}`}>
                            <div className="step-icon">2</div>
                            <span>Verify</span>
                        </div>
                    </div>

                    <div className="wizard-content">
                        <div className="login-header desktop-only-header">
                            <h2>{step === 1 ? 'Create Account' : 'Verify Phone'}</h2>
                            <p>{step === 1 ? 'Please fill in your details below' : `We sent a code to ${phoneNumber}`}</p>
                        </div>

                        {step === 1 && (
                            <form onSubmit={handleSaveDetails} className="wizard-form">
                                <div className="scrollable-inputs">
                                    <h4 className="form-section-title">Personal Info</h4>
                                    <div className="register-row">
                                        <div className="form-group-clean">
                                            <label>First Name</label>
                                            <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" />
                                        </div>
                                        <div className="form-group-clean">
                                            <label>Last Name</label>
                                            <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" />
                                        </div>
                                    </div>

                                    <div className="register-row">
                                        <div className="form-group-clean">
                                            <label>NIC No.</label>
                                            <input type="text" required value={nic} onChange={e => setNic(e.target.value)} />
                                        </div>
                                        <div className="form-group-clean">
                                            <label>Phone Number</label>
                                            <input type="text" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+94..." />
                                        </div>
                                    </div>

                                    <h4 className="form-section-title">Academic Details</h4>
                                    <div className="form-group-clean">
                                        <label>University</label>
                                        <select
                                            required
                                            value={university}
                                            onChange={e => setUniversity(e.target.value)}
                                            className="form-select-register"
                                        >
                                            <option value="">Select your university...</option>
                                            {sriLankaUniversities.map((uni, idx) => (
                                                <option key={idx} value={uni}>{uni}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="register-row course-row">
                                        <div className="form-group-clean" style={{ flex: 2 }}>
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
                                                    className="form-select-register"
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
                                                        className="btn-reset-course"
                                                        title="Back to list"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-group-clean" style={{ flex: 1 }}>
                                            <label>Student ID</label>
                                            <input type="text" required value={studentId} onChange={e => setStudentId(e.target.value)} />
                                        </div>
                                    </div>

                                    <h4 className="form-section-title">Security</h4>
                                    <div className="form-group-clean">
                                        <label>Email</label>
                                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
                                    </div>
                                    <div className="form-group-clean">
                                        <label>Password</label>
                                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} />
                                    </div>
                                </div>

                                <div className="wizard-actions">
                                    <button type="button" onClick={() => navigate('/login')} className="btn-cancel">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-modern-primary btn-register-next" disabled={loading}>
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

                <style>{`
                /* --- Desktop & Shared Styles --- */
                .register-card-wizard {
                    width: 100%;
                    max-width: 600px;
                    background: white;
                    border-radius: 20px;
                    padding: 2.5rem;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    display: flex;
                    flex-direction: column;
                    height: auto;
                    max-height: 90vh;
                }

                .scrollable-inputs {
                    overflow-y: auto;
                    padding-right: 5px;
                    max-height: 60vh; /* Prevent overly tall forms on desktop */
                }

                .register-row {
                    display: flex;
                    gap: 1.5rem;
                    margin-bottom: 0.5rem;
                }
                
                .register-row .form-group-clean {
                    flex: 1;
                }

                .form-section-title {
                    margin: 1.5rem 0 1rem 0;
                    color: var(--primary);
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-weight: 700;
                    border-bottom: 2px solid #F3F4F6;
                    padding-bottom: 0.5rem;
                }
                .form-section-title:first-child { margin-top: 0; }

                .form-select-register {
                    width: 100%;
                    padding: 14px;
                    border-radius: 12px;
                    border: 1px solid var(--border-light);
                    background-color: #F9FAFB;
                    font-size: 1rem;
                    font-family: inherit;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .form-select-register:focus {
                    border-color: var(--primary);
                    background-color: white;
                    outline: none;
                }

                .wizard-actions {
                    margin-top: 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid var(--border-light);
                    padding-top: 1.5rem;
                }

                .btn-cancel {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 1rem;
                }

                .btn-register-next {
                    width: auto;
                    padding: 0.8rem 2rem;
                    font-size: 1rem;
                }

                .btn-reset-course {
                    background: #FECACA;
                    color: #DC2626;
                    border: none;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Wizard Progress Interface */
                .wizard-progress {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 2rem;
                }
                .wizard-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    font-weight: 500;
                }
                .wizard-step.active {
                    color: var(--primary);
                    font-weight: 700;
                }
                .wizard-step .step-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #F3F4F6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    transition: all 0.3s;
                }
                .wizard-step.active .step-icon {
                    background: var(--primary);
                    color: white;
                    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
                }
                .wizard-line {
                    height: 2px;
                    width: 60px;
                    background: #E5E7EB;
                    margin: 0 1rem;
                    margin-bottom: 1.2rem; /* Align with icon center roughly */
                }

                .mobile-wizard-header { display: none; }
                .desktop-only-header { display: block; }

                /* --- Mobile Optimization (Premium Wizard) --- */
                @media (max-width: 768px) {
                    .login-page-wrapper {
                        background: var(--surface-color); /* No split background */
                    }
                    
                    /* Hide Hero completely */
                    .register-hero { display: none !important; }

                    /* Full-screen Form Section */
                    .register-form-section {
                        padding: 0;
                        align-items: flex-start;
                        background: white;
                    }

                    .register-card-wizard {
                        box-shadow: none;
                        max-width: 100%;
                        height: 100vh;
                        border-radius: 0;
                        display: flex;
                        flex-direction: column;
                        padding: 0;
                    }

                    /* Custom Mobile Header */
                    .mobile-wizard-header {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        padding: 1.5rem 1rem 0 1rem;
                        background: white;
                    }
                    .mobile-wizard-header .brand-gradient {
                        font-size: 1.5rem;
                        font-weight: 800;
                    }
                    .mobile-wizard-header p {
                        font-size: 0.9rem;
                        color: var(--text-secondary);
                        margin: 0;
                    }
                    
                    .desktop-only-header { display: none; }

                    .wizard-progress {
                        margin: 1rem 0;
                        padding-bottom: 1rem;
                        border-bottom: 1px solid #F3F4F6;
                    }

                    .wizard-content {
                        flex: 1;
                        padding: 0 1.5rem;
                        overflow-y: hidden; /* Scroll handled by scrollable-inputs */
                        display: flex;
                        flex-direction: column;
                    }

                    .wizard-form {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                    }

                    .scrollable-inputs {
                        flex: 1;
                        padding-bottom: 80px; /* Space for fixed bottom bar */
                        overflow-y: auto;
                    }

                    /* Stack grids */
                    .register-row {
                        flex-direction: column;
                        gap: 0;
                    }
                    
                    .register-row .form-group-clean {
                        margin-bottom: 1.25rem;
                    }

                    /* Large Inputs for Touch */
                    .form-group-clean input,
                    .form-select-register {
                        padding: 1rem;
                        font-size: 1rem;
                        background-color: #F8FAFC;
                        border: 1px solid #E2E8F0;
                    }
                    .form-group-clean label {
                        font-size: 0.85rem;
                        margin-bottom: 0.4rem;
                    }

                    /* Fixed Bottom Actions Bar */
                    .wizard-actions {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        width: 100%;
                        background: white;
                        border-top: 1px solid #E5E7EB;
                        padding: 1rem 1.5rem;
                        /* Safe area for iPhone home bar handled by padding-bottom on container usually, 
                           but fixed elements need env() */
                        padding-bottom: env(safe-area-inset-bottom, 1rem); 
                        z-index: 50;
                        justify-content: space-between;
                        gap: 1rem;
                    }

                    .btn-register-next {
                        flex: 1;
                        border-radius: 50px; /* Pill shape */
                        padding: 1rem;
                    }
                    
                    .btn-cancel {
                        padding: 1rem;
                    }
                }
                `}</style>
            </div>
        </div>
    );
}

export default Register;
