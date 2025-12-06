import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (!token) return null;

    return (
        <nav className="navbar">
            <div className="navbar-links">
                <Link to="/" className="navbar-brand">PSBR</Link>
                {/* Everyone sees the main Dashboard link now */}
                <Link to="/" className="nav-link">Home</Link>
            </div>

            <div className="navbar-links" style={{ position: 'relative' }}>
                <div
                    onClick={() => setShowMenu(!showMenu)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <div style={{
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
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
                        minWidth: '200px',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        border: '1px solid #e2e8f0',
                        padding: '0.5rem',
                        zIndex: 1000
                    }}>
                        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{username}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'capitalize' }}>{role}</div>
                        </div>

                        <div className="menu-item" onClick={() => navigate('/profile')}>Profile</div>
                        <div className="menu-item" onClick={() => navigate('/settings')}>Settings</div>

                        {(role === 'admin' || role === 'management') && (
                            <>
                                <div style={{ height: '1px', background: '#f1f5f9', margin: '0.5rem 0' }}></div>
                                <div className="menu-item" onClick={() => navigate('/admin')}>
                                    {role === 'management' ? 'Full Management' : 'Control Users'}
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
                                fontWeight: 500
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>
            <style>{`
                .menu-item {
                    padding: 0.5rem 1rem;
                    cursor: pointer;
                    color: #475569;
                    border-radius: 6px;
                    transition: all 0.2s;
                    font-size: 0.95rem;
                }
                .menu-item:hover {
                    background-color: #f8fafc;
                    color: #6366f1;
                }
            `}</style>
        </nav>
    );
}

export default Navbar;
