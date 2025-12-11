import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import api from '../api';

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [profileImage, setProfileImage] = useState(localStorage.getItem('profile_image'));
    const [showStreakModal, setShowStreakModal] = useState(false);

    useEffect(() => {
        const handleStorageChange = () => {
            setProfileImage(localStorage.getItem('profile_image'));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Theme State
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark';
    });

    useEffect(() => {
        // Force light mode on Auth pages
        const authRoutes = ['/login', '/register', '/forgot-password'];
        if (authRoutes.includes(location.pathname)) {
            document.body.classList.remove('dark-mode');
            return;
        }

        if (darkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode, location.pathname]);

    // Sync Profile Image from Server
    useEffect(() => {
        if (token) {
            api.get('/auth/profile')
                .then(res => {
                    if (res.data.profile_image) {
                        setProfileImage(res.data.profile_image);
                        localStorage.setItem('profile_image', res.data.profile_image);
                    }
                })
                .catch(err => console.error("Background profile sync failed", err));
        }
    }, [token]);

    // Theme State Removed

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
                <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <span className="brand-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
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

                {/* Desktop Nav Icons Group */}
                <div className="nav-icons-desktop">
                    <Link to="/" className="nav-icon" title="Home">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </Link>

                    <Link to="/calendar" className="nav-icon" title="Calendar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </Link>

                    {role === 'student' && (
                        <Link to="/tracking" className="nav-icon" title="Personal Tracking">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                        </Link>
                    )}

                    <Link to="/history" className="nav-icon" title="History">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </Link>

                    {/* Streak (Student Only) */}
                    {role === 'student' && (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowStreakModal(!showStreakModal)}
                                className="nav-icon"
                                title="Login Streak"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#F59E0B' // Star Color
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                            </button>

                            {/* Streak Modal */}
                            {showStreakModal && (
                                <div className="streak-modal-popover animate-scale-in">
                                    <h3 className="streak-title">Streak</h3>

                                    <div className="streak-content">
                                        {/* Days Boxes */}
                                        <div className="streak-week">
                                            {[
                                                { d: 'M', s: 'neutral' },
                                                { d: 'T', s: 'neutral' },
                                                { d: 'W', s: 'green' }, // Wed - Logged In
                                                { d: 'T', s: 'red' },   // Thu - Missed
                                                { d: 'F', s: 'green' }, // Fri - Logged In
                                                { d: 'S', s: 'neutral' },
                                                { d: 'S', s: 'neutral' }
                                            ].map((day, idx) => (
                                                <div key={idx} className={`day-box ${day.s}`}>
                                                    {day.d}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="streak-stats-row">
                                            <div className="steak-stat-box">
                                                <span className="stat-label">Current Streak</span>
                                                <div className="stat-value">
                                                    <span className="lightning-bolt">⚡</span> 2 days
                                                </div>
                                            </div>
                                            <div className="steak-stat-box">
                                                <span className="stat-label">Longest Streak</span>
                                                <div className="stat-value-fire">
                                                    <span className="fire-icon">🔥</span> 7 days
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Overlay to close when clicking outside */}
                            {showStreakModal && <div className="modal-backdrop-transparent" onClick={() => setShowStreakModal(false)} />}
                        </div>
                    )}

                    {(role === 'admin' || role === 'management') && (
                        <Link to="/users" className="nav-icon" title="User Management">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </Link>
                    )}

                    {/* Theme Toggle Button */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="nav-icon"
                        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                        {darkMode ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                <line x1="1" y1="12" x2="3" y2="12"></line>
                                <line x1="21" y1="12" x2="23" y2="12"></line>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                        )}
                    </button>

                    <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }}></div>
                </div>


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
                            background: profileImage ? `url(${profileImage}) no-repeat center/cover` : 'linear-gradient(135deg, #6366f1, #ec4899)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '1rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            {!profileImage && (username ? username[0].toUpperCase() : 'U')}
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

                            {/* Mobile Only Menu Items */}
                            <div className="mobile-only-menu">
                                <div className="menu-item" onClick={() => navigate('/')}>🏠 Home</div>
                                <div className="menu-item" onClick={() => navigate('/calendar')}>📅 Calendar</div>
                                {role === 'student' && <div className="menu-item" onClick={() => navigate('/tracking')}>📈 Progress</div>}
                                <div className="menu-item" onClick={() => navigate('/history')}>🕒 History</div>
                                <div className="menu-item" onClick={() => setDarkMode(!darkMode)}>
                                    {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                                </div>
                                <div style={{ height: '1px', background: '#f1f5f9', margin: '0.5rem 0' }}></div>
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
                                        {role === 'management' ? 'Management Dashboard' : 'Admin Dashboard'}
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

            {/* Mobile Bottom Navigation Bar */}
            <div className="mobile-bottom-nav">
                <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                    <div className="icon">🏠</div>
                    <span>Home</span>
                </Link>
                <Link to="/calendar" className={`mobile-nav-item ${location.pathname === '/calendar' ? 'active' : ''}`}>
                    <div className="icon">📅</div>
                    <span>Calendar</span>
                </Link>
                {role === 'student' && (
                    <Link to="/tracking" className={`mobile-nav-item ${location.pathname === '/tracking' ? 'active' : ''}`}>
                        <div className="icon">📈</div>
                        <span>Track</span>
                    </Link>
                )}
                {/* Re-use user profile trigger or simple settings link */}
                <div className="mobile-nav-item" onClick={() => setShowMenu(!showMenu)}>
                    <div className="icon">👤</div>
                    <span>Menu</span>
                </div>
            </div>

            <style>{`
                .nav-icons-desktop {
                    display: flex;
                    align-items: center;
                    gap: 1.2rem;
                }

                .mobile-bottom-nav {
                    display: none;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    background: var(--surface-color);
                    border-top: 1px solid var(--border-light);
                    padding: 0.5rem 1rem;
                    justify-content: space-around;
                    align-items: center;
                    z-index: 1000;
                    box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .mobile-nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-decoration: none;
                    color: var(--text-secondary);
                    font-size: 0.7rem;
                    gap: 4px;
                    padding: 4px;
                    border-radius: 8px;
                    transition: all 0.2s;
                }

                .mobile-nav-item .icon {
                    font-size: 1.25rem;
                }

                .mobile-nav-item.active {
                    color: var(--primary);
                    background: rgba(79, 70, 229, 0.05); /* Very subtle tint */
                }

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
                
                .mobile-only-menu {
                    display: none;
                }

                @media (max-width: 768px) {
                    .desktop-only {
                        display: none;
                    }
                    .nav-icons-desktop {
                        display: none;
                    }
                    .mobile-bottom-nav {
                        display: flex;
                    }
                    /* Ensure main content doesn't get hidden behind bottom nav */
                    body {
                        padding-bottom: 70px; 
                    }
                    .mobile-only-menu {
                        display: block;
                    }
                }
                .streak-modal-popover {
                    position: absolute;
                    top: 50px;
                    right: -50px;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-radius: 16px;
                    padding: 1.5rem;
                    width: 480px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(226, 232, 240, 0.6);
                    z-index: 1000;
                    color: #0F172A;
                }
                
                body.dark-mode .streak-modal-popover {
                    background: rgba(30, 41, 59, 0.9);
                    border-color: rgba(51, 65, 85, 0.6);
                    color: #F8FAFC;
                }
                
                .streak-content {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    align-items: flex-start;
                }

                .streak-week {
                    display: flex;
                    flex-direction: row;
                    gap: 8px;
                    width: 100%;
                    flex-wrap: nowrap;
                    justify-content: space-between;
                }

                .day-box {
                    width: 42px;
                    height: 42px;
                    border-radius: 8px;
                    background: #F1F5F9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    color: #94A3B8;
                    border: 1px solid #E2E8F0;
                    font-size: 0.9rem;
                }
                
                body.dark-mode .day-box {
                    background: #334155;
                    border-color: #475569;
                    color: #CBD5E1;
                }

                .day-box.green {
                    background: #22C55E;
                    color: white;
                    border-color: #16A34A;
                    box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.2);
                } 
                
                body.dark-mode .day-box.green {
                    background: #22C55E;
                    border-color: #16A34A;
                    color: white;
                }

                .day-box.red {
                    background: #EF4444;
                    color: white;
                    border-color: #DC2626;
                }
                
                body.dark-mode .day-box.red {
                    background: #EF4444;
                    border-color: #DC2626;
                    color: white;
                }

                .day-box.neutral {
                    /* Default style */
                }

                .streak-stats-row {
                    display: flex;
                    justify-content: space-between;
                    width: 100%;
                    padding: 0 4px;
                }

                .modal-backdrop-transparent {
                    position: fixed;
                    inset: 0;
                    z-index: 999;
                    cursor: default;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.2s ease-out forwards;
                }

                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in {
                    animation: scaleIn 0.2s ease-out forwards;
                }
            `}</style>
        </nav >
    );
}

export default Navbar;
