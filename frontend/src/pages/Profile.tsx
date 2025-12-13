import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

function Profile() {
    const navigate = useNavigate();
    const role = localStorage.getItem('role');
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
        window.dispatchEvent(new Event('theme-change'));
    };

    const confirmLogout = () => {
        localStorage.clear();
        navigate('/login');
    };
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [view, setView] = useState<'menu' | 'edit'>('menu');

    // Profile Data
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        university: '',
        university_course: '',
        university_id: '',
        profile_image: ''
    });

    // Subscription State
    const [subStatus, setSubStatus] = useState<'active' | 'inactive' | 'pending' | null>(null);
    const [subLoading, setSubLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
        fetchSubscriptionStatus();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/profile');
            setFormData({
                first_name: res.data.first_name || '',
                last_name: res.data.last_name || '',
                email: res.data.username || '', // Use username as email for display
                phone_number: res.data.phone_number || '',
                university: res.data.university || '',
                university_course: res.data.university_course || '',
                university_id: res.data.university_id || '',
                profile_image: res.data.profile_image || ''
            });
        } catch (err) {
            console.error("Failed to load profile", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubscriptionStatus = async () => {
        try {
            const res = await api.get('/api/subscription/status');
            setSubStatus(res.data.subscription_status);
        } catch (err) {
            console.error("Failed to fetch subscription status", err);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                // Immediate separate update
                try {
                    // Optimistic UI update
                    setFormData(prev => ({ ...prev, profile_image: base64String }));

                    // Separate API call to update only image logic (simulated via full update for now, 
                    // but could be separate endpoint if backend supported PATCH)
                    // For now, we just update the full profile with the new image immediately.
                    await api.put('/auth/profile', { ...formData, profile_image: base64String });

                    localStorage.setItem('profile_image', base64String);
                    window.dispatchEvent(new Event('storage'));
                    alert('Profile photo updated!');
                } catch (err) {
                    console.error("Failed to upload photo", err);
                    alert("Failed to upload photo");
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/auth/profile', formData);
            if (formData.profile_image) {
                localStorage.setItem('profile_image', formData.profile_image);
            }
            alert('Profile updated successfully!');
            // Trigger storage event for Navbar update (optional, or just reload)
            window.dispatchEvent(new Event('storage'));
        } catch (err: any) {
            alert('Failed to update: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };



    const handleUnsubscribe = async () => {
        const confirmed = window.confirm("Are you sure you want to unsubscribe? You will lose access to premium features.");
        if (confirmed) {
            setSubLoading(true);
            try {
                const res = await api.post('/api/subscription/unsubscribe');

                if (res.data.subscription_status === 'deleted') {
                    alert("Successfully unsubscribed. Your account and data have been deleted.");
                    localStorage.clear();
                    window.location.href = '/login';
                } else {
                    alert("Successfully unsubscribed.");
                    setSubStatus('inactive');
                    setShowLogoutModal(false);
                }
            } catch (err: any) {
                alert("Unsubscribe failed: " + (err.response?.data?.details || err.message));
            } finally {
                setSubLoading(false);
            }
        }
    };

    const handleSubscribe = async () => {
        const confirmed = window.confirm("Do you want to re-subscribe to the service? Charges may apply.");
        if (confirmed) {
            setSubLoading(true);
            try {
                await api.post('/api/subscription/subscribe');
                alert("Successfully subscribed!");
                setSubStatus('active');
                setShowLogoutModal(false);
            } catch (err: any) {
                alert("Subscription failed: " + (err.response?.data?.details || err.message));
            } finally {
                setSubLoading(false);
            }
        }
    };

    if (loading) return <div className="loading-spinner">Loading...</div>;

    return (
        <>
            {/* Custom Mobile Header for Profile Page */}
            <div className="profile-mobile-header">
                My Profile
            </div>

            <div className="dashboard-container dashboard-page-container animate-fade-in" style={{ marginTop: '2rem', maxWidth: '800px' }}>
                <h1 className="section-title desktop-only-title">My Profile</h1>

                {/* --- View Switching Logic --- */}
                {/* If view is 'menu', show options including 'My Profile' */}
                {view === 'menu' ? (
                    <div className="profile-content-card" style={{ marginTop: '0' }}>

                        {/* Header for Menu View */}
                        <div className="section-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '50px', height: '50px', borderRadius: '50%',
                                background: formData.profile_image ? `url(${formData.profile_image}) no-repeat center/cover` : 'var(--primary)',
                                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem', fontWeight: 700
                            }}>
                                {!formData.profile_image && (formData.first_name ? formData.first_name[0] : 'U')}
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{formData.first_name} {formData.last_name}</h2>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{formData.email}</span>
                            </div>
                        </div>

                        <h3 className="section-subtitle">App Settings & Links</h3>
                        <div className="profile-menu-grid">

                            {/* 1. My Profile Option */}
                            <div className="menu-item-card" onClick={() => setView('edit')}>
                                <span className="icon">👤</span>
                                <div className="info">
                                    <h4>My Profile</h4>
                                    <p>Edit personal details & photo</p>
                                </div>
                            </div>

                            <div className="menu-item-card" onClick={toggleTheme}>
                                <span className="icon">{darkMode ? '☀️' : '🌙'}</span>
                                <div className="info" style={{ flex: 1 }}>
                                    <h4>Appearance</h4>
                                    <p>{darkMode ? 'Dark Mode' : 'Light Mode'}</p>
                                </div>
                                {/* Toggle Switch UI */}
                                <div className={`toggle-switch ${darkMode ? 'active' : ''}`}>
                                    <div className="toggle-thumb"></div>
                                </div>
                            </div>

                            <Link to="/history" className="menu-item-card" style={{ textDecoration: 'none' }}>
                                <span className="icon">🕒</span>
                                <div className="info">
                                    <h4>History</h4>
                                    <p>View your activity log</p>
                                </div>
                            </Link>

                            <Link to="/settings" className="menu-item-card" style={{ textDecoration: 'none' }}>
                                <span className="icon">⚙️</span>
                                <div className="info">
                                    <h4>Settings</h4>
                                    <p>Manage app preferences</p>
                                </div>
                            </Link>

                            {role === 'student' && (
                                <Link to="/tracking" className="menu-item-card" style={{ textDecoration: 'none' }}>
                                    <span className="icon">📈</span>
                                    <div className="info">
                                        <h4>Progress Tracking</h4>
                                        <p>Check your learning stats</p>
                                    </div>
                                </Link>
                            )}

                            {(role === 'admin' || role === 'management') && (
                                <Link to="/admin" className="menu-item-card" style={{ textDecoration: 'none' }}>
                                    <span className="icon">🛡️</span>
                                    <div className="info">
                                        <h4>{role === 'management' ? 'Management' : 'Admin'} Dashboard</h4>
                                        <p>Access admin controls</p>
                                    </div>
                                </Link>
                            )}

                            {role === 'management' && (
                                <Link to="/subscriptions" className="menu-item-card" style={{ textDecoration: 'none' }}>
                                    <span className="icon">💳</span>
                                    <div className="info">
                                        <h4>Subscription Management</h4>
                                        <p>View all user subscriptions</p>
                                    </div>
                                </Link>
                            )}

                            <div className="menu-item-card danger" onClick={handleLogoutClick}>
                                <span className="icon">🚪</span>
                                <div className="info">
                                    <h4>Logout</h4>
                                    <p>Sign out of your account</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- Edit Profile View --- */
                    <div className="animate-fade-in">
                        <button onClick={() => setView('menu')} className="btn-back" style={{
                            background: 'none', border: 'none', color: 'var(--primary)',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            marginBottom: '1rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 600
                        }}>
                            ← Back to Settings
                        </button>

                        <div className="profile-content-card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                            <h3 className="section-subtitle" style={{ marginBottom: '1rem', textAlign: 'center' }}>Profile Photo</h3>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: '50%',
                                        background: formData.profile_image ? `url(${formData.profile_image}) no-repeat center/cover` : 'linear-gradient(135deg, #6366f1, #ec4899)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '3rem',
                                        fontWeight: '700',
                                        border: '4px solid white',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                    }}>
                                        {!formData.profile_image && formData.first_name ? formData.first_name[0] : (!formData.profile_image && 'U')}
                                    </div>
                                    <label htmlFor="profile-upload" style={{
                                        position: 'absolute',
                                        bottom: '0',
                                        right: '0',
                                        background: 'white',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        border: '1px solid #e5e7eb',
                                        transition: 'all 0.2s'
                                    }} className="camera-btn">
                                        📷
                                    </label>
                                    <input
                                        id="profile-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Click the camera icon to update your photo.<br />Changes are saved automatically.
                            </p>
                        </div>

                        <div className="profile-content-card">
                            <form onSubmit={handleSave} className="animate-fade-in">
                                <div className="grid-2">
                                    <div className="form-group-clean">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            value={formData.first_name}
                                            onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group-clean">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group-clean">
                                    <label>Email / Username (Read-Only)</label>
                                    <input type="text" value={formData.email} disabled className="disabled-input" />
                                </div>

                                <div className="form-group-clean">
                                    <label>Phone Number</label>
                                    <input
                                        type="text"
                                        value={formData.phone_number}
                                        onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                        placeholder="+1 234 567 890"
                                    />
                                </div>

                                <hr className="divider" />
                                <h3 className="section-subtitle">Academic Details</h3>

                                <div className="form-group-clean">
                                    <label>University</label>
                                    <input
                                        type="text"
                                        value={formData.university}
                                        onChange={e => setFormData({ ...formData, university: e.target.value })}
                                    />
                                </div>

                                <div className="grid-2">
                                    <div className="form-group-clean">
                                        <label>Course / Major</label>
                                        <input
                                            type="text"
                                            value={formData.university_course}
                                            onChange={e => setFormData({ ...formData, university_course: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group-clean">
                                        <label>Student ID</label>
                                        <input
                                            type="text"
                                            value={formData.university_id}
                                            onChange={e => setFormData({ ...formData, university_id: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="btn-modern-primary" disabled={saving} style={{ marginTop: '1.5rem' }}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Logout/Unsubscribe Modal */}
                {showLogoutModal && (
                    <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
                        <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Account Actions</h3>
                                <button className="close-btn" onClick={() => setShowLogoutModal(false)}>×</button>
                            </div>
                            <p className="modal-desc">What would you like to do?</p>
                            <div className="modal-actions">
                                <button className="btn-logout-primary" onClick={confirmLogout}>
                                    Logout
                                </button>

                                {subStatus === 'active' ? (
                                    <button className="btn-unsubscribe" onClick={handleUnsubscribe} disabled={subLoading}>
                                        {subLoading ? 'Processing...' : 'Unsubscribe'}
                                    </button>
                                ) : (
                                    <button className="btn-subscribe" onClick={handleSubscribe} disabled={subLoading} style={{
                                        background: '#d1fae5', color: '#059669', padding: '0.8rem', borderRadius: '8px',
                                        border: '1px solid #a7f3d0', fontWeight: 600, fontSize: '1rem', cursor: 'pointer'
                                    }}>
                                        {subLoading ? 'Processing...' : 'Subscribe'}
                                    </button>
                                )}
                            </div>
                            <button className="btn-cancel-wide" onClick={() => setShowLogoutModal(false)}>Cancel</button>
                        </div>
                    </div>
                )}


                <style>{`
                    .profile-content-card {
                        background: var(--surface-color);
                        padding: 2rem;
                        border-radius: 12px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    }
                    .grid-2 {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1.5rem;
                    }
                    .disabled-input {
                        background-color: var(--bg-color);
                        color: var(--text-secondary);
                        cursor: not-allowed;
                    }
                    .divider {
                        border: 0;
                        border-top: 1px solid #e5e7eb;
                        margin: 2rem 0;
                    }
                    .section-subtitle {
                        font-size: 1.1rem;
                        margin-bottom: 1.5rem;
                        color: var(--text-main);
                        font-weight: 600;
                    }

                    /* Toggle Switch Styles */
                    .toggle-switch {
                        width: 44px;
                        height: 24px;
                        background-color: #e5e7eb;
                        border-radius: 12px;
                        position: relative;
                        transition: background-color 0.2s;
                    }
                    .toggle-switch.active {
                        background-color: var(--primary);
                    }
                    .toggle-thumb {
                        width: 20px;
                        height: 20px;
                        background-color: white;
                        border-radius: 50%;
                        position: absolute;
                        top: 2px;
                        left: 2px;
                        transition: transform 0.2s;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                    }
                    .toggle-switch.active .toggle-thumb {
                        transform: translateX(20px);
                    }

                    /* Modal Styles */
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.5);
                        z-index: 2000;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: 1rem;
                        backdrop-filter: blur(4px);
                    }
                    .modal-content {
                        background: var(--surface-color);
                        width: 100%;
                        max-width: 320px;
                        border-radius: 16px;
                        padding: 1.5rem;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                        text-align: center;
                    }
                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1rem;
                    }
                    .modal-header h3 {
                        margin: 0;
                        font-size: 1.25rem;
                        color: var(--text-main);
                    }
                    .close-btn {
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        color: var(--text-secondary);
                        cursor: pointer;
                    }
                    .modal-desc {
                        color: var(--text-secondary);
                        margin-bottom: 2rem;
                        font-size: 0.95rem;
                    }
                    .modal-actions {
                        display: flex;
                        flex-direction: column;
                        gap: 0.8rem;
                        margin-bottom: 1rem;
                    }
                    .btn-logout-primary {
                        background: var(--primary);
                        color: white;
                        padding: 0.8rem;
                        border-radius: 8px;
                        border: none;
                        font-weight: 600;
                        font-size: 1rem;
                        cursor: pointer;
                        transition: opacity 0.2s;
                    }
                    .btn-logout-primary:hover {
                         opacity: 0.9;
                    }
                    .btn-unsubscribe {
                        background: #fee2e2;
                        color: #ef4444;
                        padding: 0.8rem;
                        border-radius: 8px;
                        border: 1px solid #fecaca;
                        font-weight: 600;
                        font-size: 1rem;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    .btn-unsubscribe:hover {
                        background: #fecaca;
                    }
                    .btn-cancel-wide {
                         background: transparent;
                         color: var(--text-secondary);
                         padding: 0.5rem;
                         border: none;
                         cursor: pointer;
                         font-size: 0.9rem;
                         text-decoration: underline;
                    }

                    /* Custom Header Styles */
                    .profile-mobile-header {
                        display: none;
                    }

                    @media (max-width: 768px) {
                        .profile-mobile-header {
                            display: flex;
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            height: 50px;
                            background: var(--surface-color);
                            border-bottom: 1px solid var(--border-light);
                            z-index: 1000;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.1rem;
                            font-weight: 700;
                            color: var(--text-main);
                            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                        }
                        
                        .desktop-only-title {
                            display: none;
                        }

                        .grid-2 {
                            grid-template-columns: 1fr;
                            gap: 1rem;
                        }
                        .profile-content-card {
                            padding: 1.5rem;
                        }
                        /* Adjusted padding for fixed header */
                        .dashboard-page-container {
                            padding-top: 60px !important; 
                        }
                        
                         /* Center Modal in mobile viewport correctly */
                         .modal-overlay {
                            align-items: flex-end; /* Bottom sheet feeling on mobile if desired, but user said popup. Centered is fine too */
                            align-items: center;
                         }
                    }

                    /* Menu Grid Styles */
                    .profile-menu-grid {
                        display: grid;
                        gap: 1rem;
                    }
                    .menu-item-card {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1rem;
                        border: 1px solid var(--border-light);
                        border-radius: 12px;
                        transition: all 0.2s;
                        cursor: pointer;
                        color: var(--text-main);
                    }
                    .menu-item-card:hover {
                        background: var(--bg-color);
                        border-color: var(--primary);
                        transform: translateY(-2px);
                    }
                    .menu-item-card .icon {
                        font-size: 1.5rem;
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: var(--bg-color);
                        border-radius: 50%;
                    }
                    .menu-item-card .info h4 {
                        margin: 0;
                        font-size: 1rem;
                        font-weight: 600;
                    }
                    .menu-item-card .info p {
                        margin: 2px 0 0 0;
                        font-size: 0.8rem;
                        color: var(--text-secondary);
                    }
                    .menu-item-card.danger {
                        border-color: #fecaca;
                        background: #fef2f2;
                    }
                    .menu-item-card.danger:hover {
                        background: #fee2e2;
                        border-color: #ef4444;
                    }
                    .menu-item-card.danger .info h4 {
                        color: #ef4444;
                    }
                `}</style>
            </div >
        </>
    );
}

export default Profile;
