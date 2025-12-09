import { useState, useEffect, FormEvent } from 'react';
import api from '../api';

function Profile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

    useEffect(() => {
        fetchProfile();
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

    if (loading) return <div className="loading-spinner">Loading...</div>;

    return (
        <div className="dashboard-container animate-fade-in" style={{ marginTop: '2rem', maxWidth: '800px' }}>
            <h1 className="section-title">My Profile</h1>

            {/* Separate Profile Photo Card */}
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
            `}</style>
        </div>
    );
}

export default Profile;
