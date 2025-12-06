import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { useRef, useEffect } from 'react';

function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    if (!token) return null;

    return (
        <nav className="navbar">
            <div className="navbar-links" style={{ alignItems: 'baseline', gap: '2rem' }}>
                <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(to right, #4F46E5, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        StudyBuddy
                    </span>
                </Link>
                {/* Tagline in Header */}
                <div className="desktop-only">
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                        Find Your Perfect Study Material
                    </span>
                </div>
            </div>

            {/* Right Side Icons & Menu */}
            <div className="navbar-links" style={{ gap: '1.2rem', display: 'flex', alignItems: 'center' }}>

                {/* 1. Home */}
                <Link to="/" className="nav-icon" title="Home">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                </Link>

                {/* 2. Calendar */}
                <Link to="/calendar" className="nav-icon" title="Calendar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </Link>

                {/* 3. Personal Tracking (Student Only) */}
                {role === 'student' && (
                    <Link to="/tracking" className="nav-icon" title="Personal Tracking">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                    </Link>
                )}

                {/* 3. User Management (Admin Only) */}
                {(role === 'admin' || role === 'management') && (
                    <Link to="/users" className="nav-icon" title="User Management">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </Link>
                )}

                {/* 4. History */}
                <Link to="/history" className="nav-icon" title="History">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </Link>

                <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }}></div>

                {/* User Profile / Menu Trigger */}
                <div style={{ position: 'relative' }} ref={menuRef}>
                    <div
                        onClick={() => setShowMenu(!showMenu)}
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '1rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            {username ? username[0].toUpperCase() : 'U'}
                        </div>
                    </div>

                    {showMenu && (
                        <div className="animate-fade-in" style={{
                            position: 'absolute',
                            top: '120%',
                            right: 0,
                            background: 'white',
                            minWidth: '220px',
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                            border: '1px solid #e2e8f0',
                            padding: '0.5rem',
                            zIndex: 1000
                        }}>
                            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.5rem' }}>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{username}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'capitalize' }}>{role}</div>
                            </div>



                            <div className="menu-item" onClick={() => navigate('/profile')}>
                                <span style={{ marginRight: '8px' }}>👤</span> Profile
                            </div>
                            <div className="menu-item" onClick={() => navigate('/settings')}>
                                <span style={{ marginRight: '8px' }}>⚙️</span> Settings
                            </div>

                            {(role === 'admin' || role === 'management') && (
                                <>
                                    <div style={{ height: '1px', background: '#f1f5f9', margin: '0.5rem 0' }}></div>
                                    <div className="menu-item" onClick={() => navigate('/admin')}>
                                        {role === 'management' ? 'Full Management' : 'Admin Dashboard'}
                                    </div>
                                </>
                            )}

                            <div style={{ height: '1px', background: '#f1f5f9', margin: '0.5rem 0' }}></div>
                            <button
                                onClick={handleLogout}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '0.5rem 1rem',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <span style={{ marginRight: '8px' }}>🚪</span> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .nav-icon {
                    color: var(--text-secondary);
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 6px;
                    border-radius: 8px;
                }
                .nav-icon:hover {
                    color: var(--primary);
                    background-color: #f1f5f9;
                    transform: translateY(-1px);
                }
                .menu-item {
                    padding: 0.6rem 1rem;
                    cursor: pointer;
                    color: #475569;
                    border-radius: 6px;
                    transition: all 0.2s;
                    font-size: 0.95rem;
                    display: flex;
                    align-items: center;
                }
                .menu-item:hover {
                    background-color: #f8fafc;
                    color: #6366f1;
                }
                @media (max-width: 768px) {
                    .desktop-only {
                        display: none;
                    }
                }
            `}</style>
        </nav>
    );
}

export default Navbar;
