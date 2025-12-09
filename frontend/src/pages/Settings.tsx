import { useState } from 'react';

function Settings() {
    const [showPassword, setShowPassword] = useState(false);
    const [showAppInfo, setShowAppInfo] = useState(false);

    return (
        <div className="dashboard-container animate-fade-in" style={{ marginTop: '2rem', maxWidth: '800px' }}>
            <h1 className="section-title">Settings</h1>

            <div className="profile-content-card">
                <div className="animate-fade-in">
                    <h3 className="section-subtitle">Preferences</h3>

                    <div className="setting-row">
                        <div>
                            <h4>Email Notifications</h4>
                            <p>Receive updates about new course materials.</p>
                        </div>
                        <label className="switch">
                            <input type="checkbox" defaultChecked />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <div className="setting-row">
                        <div>
                            <h4>SMS Alerts</h4>
                            <p>Get OTPs and urgent alerts via SMS.</p>
                        </div>
                        <label className="switch">
                            <input type="checkbox" />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <hr className="divider" />
                    <h3 className="section-subtitle">Security</h3>

                    <button
                        className="btn-modern-outline"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        Change Password
                    </button>

                    {showPassword && (
                        <div className="password-section animate-fade-in" style={{ marginTop: '1.5rem', background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <div className="form-group-clean">
                                <label>Current Password</label>
                                <input type="password" placeholder="Enter current password" />
                            </div>
                            <div className="form-group-clean">
                                <label>New Password</label>
                                <input type="password" placeholder="Enter new password" />
                            </div>
                            <div className="form-group-clean">
                                <label>Confirm New Password</label>
                                <input type="password" placeholder="Confirm new password" />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button className="btn-modern-primary">Update Password</button>
                                <button className="btn-modern-outline" onClick={() => setShowPassword(false)}>Cancel</button>
                            </div>
                        </div>
                    )}

                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Last changed: 3 months ago
                    </p>

                    <hr className="divider" />
                    <h3 className="section-subtitle">History & Tracking</h3>

                    <div className="setting-row">
                        <div>
                            <h4>Save Browsing History</h4>
                            <p>Keep a record of resources you've viewed.</p>
                        </div>
                        <label className="switch">
                            <input type="checkbox" defaultChecked />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <div className="setting-row">
                        <div>
                            <h4>Share Stats w/ Friends</h4>
                            <p>Allow others to see your study streak.</p>
                        </div>
                        <label className="switch">
                            <input type="checkbox" />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    <hr className="divider" />
                    <div
                        onClick={() => setShowAppInfo(!showAppInfo)}
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        <h3 className="section-subtitle app-info-trigger" style={{ marginBottom: 0, color: showAppInfo ? 'var(--primary)' : undefined }}>App Info</h3>
                    </div>

                    {showAppInfo && (
                        <div className="animate-fade-in" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                {/* Left Side: Project Details */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project</h5>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>Code Blast Project</p>
                                    </div>

                                    <div>
                                        <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Powered By</h5>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '1rem' }}>Mobitel</p>
                                    </div>

                                    <div>
                                        <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Developed At</h5>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}>Faculty of Engineering</p>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)' }}>University of Ruhuna</p>
                                    </div>
                                </div>

                                {/* Right Side: Contact Details */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '1px solid var(--border-light)', paddingLeft: '1.5rem' }}>
                                    <div>
                                        <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Support</h5>
                                        <p style={{ margin: '0 0 2px 0', fontSize: '0.95rem', color: 'var(--text-main)' }}><strong>Email:</strong> support@studybuddy.com</p>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)' }}><strong>Contact:</strong> +94 77 123 4567</p>
                                    </div>

                                    <div>
                                        <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Legal</h5>
                                        <p style={{ margin: 0, fontSize: '0.95rem' }}><a href="#" style={{ color: 'var(--text-main)', textDecoration: 'underline' }}>Privacy Policy</a></p>
                                        <p style={{ margin: 0, fontSize: '0.95rem' }}><a href="#" style={{ color: 'var(--text-main)', textDecoration: 'underline' }}>Terms of Service</a></p>
                                    </div>

                                    <div style={{ marginTop: 'auto' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Version 1.0.0 (Beta)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {!showAppInfo && <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Version 1.0.0 (Beta)</p>}
                </div>
            </div>

            <style>{`
                .profile-content-card {
                    background: var(--surface-color);
                    padding: 2rem;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .divider {
                    border: 0;
                    border-top: 1px solid var(--border-light);
                    margin: 2rem 0;
                }
                .section-subtitle {
                    font-size: 1.1rem;
                    margin-bottom: 1.5rem;
                    color: var(--text-main);
                    font-weight: 600;
                }
                .setting-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .setting-row h4 { margin: 0; font-size: 1rem; color: var(--text-main); }
                .setting-row p { margin: 0; font-size: 0.9rem; color: var(--text-secondary); }

                /* Switch Toggle */
                .switch { position: relative; display: inline-block; width: 50px; height: 26px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border-light); transition: .4s; }
                .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: var(--surface-color); transition: .4s; }
                input:checked + .slider { background-color: var(--primary); }
                input:focus + .slider { box-shadow: 0 0 1px var(--primary); }
                input:checked + .slider:before { transform: translateX(24px); }
                .slider.round { border-radius: 34px; }
                .slider.round:before { border-radius: 50%; }

                .app-info-trigger {
                    transition: color 0.2s;
                    color: var(--text-main);
                }
                .app-info-trigger:hover {
                    color: var(--primary) !important;
                }
            `}</style>
        </div>
    );
}

export default Settings;
