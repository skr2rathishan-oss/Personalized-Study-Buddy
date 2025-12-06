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
        university_id: ''
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
                university_id: res.data.university_id || ''
            });
        } catch (err) {
            console.error("Failed to load profile", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/auth/profile', formData);
            alert('Profile updated successfully!');
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
