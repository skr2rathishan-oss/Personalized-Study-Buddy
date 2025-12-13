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

    const handleMobileSearch = () => {
        // Dispatch event for Dashboard to listen to
        window.dispatchEvent(new CustomEvent('toggle-filters'));
    };



    useEffect(() => {
        const handleStorageChange = () => {
            setProfileImage(localStorage.getItem('profile_image'));
        };
        window.addEventListener('storage', handleStorageChange);

        const handleThemeChange = () => {
            setDarkMode(localStorage.getItem('theme') === 'dark');
        };
        window.addEventListener('theme-change', handleThemeChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('theme-change', handleThemeChange);
        };
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

    const handleLogout = (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setShowMenu(false); // Ensure menu closes
        localStorage.clear();
        navigate('/login');
    };

    const handleLinkClick = (path: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        setShowMenu(false);
        navigate(path);
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
        <>
            {/* --- DESKTOP NAVBAR --- */}
            <nav className="navbar desktop-only-nav">
                <style>{`
                    @media (max-width: 768px) {
                        .desktop-only-nav { display: none !important; }
                    }
                `}</style>
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

                {/* Right Side Icons & Menu (Desktop) */}
                <div className="navbar-links" style={{ gap: '1.2rem', display: 'flex', alignItems: 'center' }}>
                    {/* ... (Existing Desktop Icons) ... */}
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
                    </div>



                    {/* Desktop User Profile */}
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
                                <div className="menu-item" onClick={(e) => handleLinkClick('/profile', e)}>
                                    <span style={{ marginRight: '8px' }}>👤</span> Profile
                                </div>
                                <div className="menu-item" onClick={(e) => handleLinkClick('/settings', e)}>
                                    <span style={{ marginRight: '8px' }}>⚙️</span> Settings
                                </div>
                                {(role === 'admin' || role === 'management') && (
                                    <>
                                        <div style={{ height: '1px', background: '#f1f5f9', margin: '0.5rem 0' }}></div>
                                        <div className="menu-item" onClick={(e) => handleLinkClick('/admin', e)}>
                                            <span style={{ marginRight: '8px' }}>📊</span>
                                            {role === 'management' ? 'Management Dashboard' : 'Admin Dashboard'}
                                        </div>
                                        {role === 'management' && (
                                            <div className="menu-item" onClick={(e) => handleLinkClick('/subscriptions', e)}>
                                                <span style={{ marginRight: '8px' }}>💳</span>
                                                Subscription Management
                                            </div>
                                        )}
                                    </>
                                )}
                                <div style={{ height: '1px', background: '#f1f5f9', margin: '0.5rem 0' }}></div>
                                <button onClick={handleLogout} className="menu-item" style={{ color: '#ef4444', width: '100%' }}>
                                    <span style={{ marginRight: '8px' }}>🚪</span> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav >

            {/* --- MOBILE TOP BAR --- */}
            {/* --- MOBILE TOP BAR --- */}
            {
                location.pathname !== '/profile' && (
                    <div className="mobile-top-bar">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="mobile-brand" style={{ lineHeight: '1.2' }}>Study Buddy</div>
                        </div>
                        <button className="mobile-action-btn" onClick={handleMobileSearch}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </button>
                    </div>
                )
            }

            {/* --- MOBILE BOTTOM BAR --- */}
            <div className="mobile-bottom-bar">
                <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    <span>Home</span>
                </Link>

                {/* Suggestions / Add Button (Placeholder) */}
                <button className="nav-add-btn" onClick={() => {/* Future suggestions logic */ }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>

                <Link to="/profile" className={`bottom-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
                    {/* Tiny Profile Circle */}
                    <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: profileImage ? `url(${profileImage}) no-repeat center/cover` : 'var(--primary)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700
                    }}>
                        {!profileImage && (username ? username[0].toUpperCase() : 'U')}
                    </div>
                    <span>You</span>
                </Link>
            </div>

            <style>{`
                /* Desktop Nav Styles (Copied from original inline styles) */
                .nav-icons-desktop {
                    display: flex;
                    align-items: center;
                    gap: 1.2rem;
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
                    text-decoration: none; /* Ensure links look right */
                }
                .menu-item:hover {
                    background-color: #f8fafc;
                    color: #6366f1;
                }
            `}</style>
        </>
    );
}

export default Navbar;
