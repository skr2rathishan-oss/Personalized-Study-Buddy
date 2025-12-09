import { useState, useEffect } from 'react';
import api from '../api';
import { UNIVERSITY_COURSES } from '../data/UniversityInfo';

interface UserStats {
    id: number;
    name: string;
    email: string;
    university: string;
    role: 'admin' | 'student';
    // Admin specific
    courses?: string[]; // Module names
    degree?: string;
    content_contributions?: number;
    avg_rating?: number;
    active_students?: number;
    // Student specific
    enrolled_courses?: number;
    study_time?: string;
    student_id?: string;
    phone?: string;
    nic?: string;
}

interface DetailedCourse {
    id: number;
    name: string;
    code: string;
    resources: number;
    rating: number;
    students: number;
}

function ManagementAnalytics() {
    const [users, setUsers] = useState<UserStats[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedRole, setSelectedRole] = useState<'admin' | 'student'>('admin');
    const [selectedUni, setSelectedUni] = useState('');
    const [selectedDegree, setSelectedDegree] = useState('');

    // Detailed View Logic (Only for Admins currently)
    const [selectedAdmin, setSelectedAdmin] = useState<UserStats | null>(null);
    const [detailedCourses, setDetailedCourses] = useState<DetailedCourse[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Initial Load
    useEffect(() => {
        // Reset Degree if Uni changes
        if (selectedUni && !UNIVERSITY_COURSES[selectedUni]?.includes(selectedDegree)) {
            setSelectedDegree('');
        }
    }, [selectedUni]);

    useEffect(() => {
        fetchData();
    }, [selectedUni, selectedDegree, selectedRole]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.post('/management/analytics', {
                role: selectedRole,
                university: selectedUni,
                degree: selectedDegree
            });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = async (user: UserStats) => {
        if (user.role !== 'admin') return; // Only admin details deeply implemented for now

        setSelectedAdmin(user);
        setDetailedCourses([]);
        setLoadingDetails(true);
        try {
            const res = await api.get(`/management/admin-details/${user.id}`);
            setDetailedCourses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const getAvailableDegrees = () => {
        if (!selectedUni) return [];
        return UNIVERSITY_COURSES[selectedUni] || [];
    };

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', marginTop: '0' }}>
            {/* Sidebar Filter */}
            <aside className="management-sidebar" style={{
                width: '280px',
                borderRight: '1px solid var(--border-light)',
                padding: '1.5rem',
                position: 'fixed',
                top: '64px',
                bottom: 0,
                left: 0,
                overflowY: 'auto',
                zIndex: 900,
                background: 'var(--surface-color)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>📊</span>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>Filters</h3>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>User Role</label>
                    <div style={{ display: 'flex', background: 'var(--bg-color)', padding: '4px', borderRadius: '8px' }}>
                        <button
                            onClick={() => setSelectedRole('admin')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                border: 'none',
                                borderRadius: '6px',
                                background: selectedRole === 'admin' ? 'var(--surface-color)' : 'transparent',
                                color: selectedRole === 'admin' ? 'var(--primary)' : 'var(--text-secondary)',
                                fontWeight: 600,
                                boxShadow: selectedRole === 'admin' ? 'var(--shadow-sm)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Admins
                        </button>
                        <button
                            onClick={() => setSelectedRole('student')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                border: 'none',
                                borderRadius: '6px',
                                background: selectedRole === 'student' ? 'var(--surface-color)' : 'transparent',
                                color: selectedRole === 'student' ? 'var(--primary)' : 'var(--text-secondary)',
                                fontWeight: 600,
                                boxShadow: selectedRole === 'student' ? 'var(--shadow-sm)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Students
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>University</label>
                    <select
                        className="form-select"
                        value={selectedUni}
                        onChange={e => setSelectedUni(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.9rem', background: 'var(--surface-color)', color: 'var(--text-main)' }}
                    >
                        <option value="">All Universities</option>
                        {Object.keys(UNIVERSITY_COURSES).map(uni => (
                            <option key={uni} value={uni}>{uni}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Degree / Course</label>
                    <select
                        className="form-select"
                        value={selectedDegree}
                        onChange={e => setSelectedDegree(e.target.value)}
                        disabled={!selectedUni}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-light)',
                            fontSize: '0.9rem',
                            background: !selectedUni ? 'var(--bg-color)' : 'var(--surface-color)',
                            color: 'var(--text-main)',
                            cursor: !selectedUni ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <option value="">{selectedUni ? "All Degrees" : "Select University First"}</option>
                        {getAvailableDegrees().map(deg => (
                            <option key={deg} value={deg}>{deg}</option>
                        ))}
                    </select>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ marginLeft: '280px', flex: 1, padding: '2rem', background: 'var(--bg-color)', minHeight: '100vh', boxSizing: 'border-box' }}>
                <div style={{ marginBottom: '2rem', marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                            {selectedRole === 'admin' ? 'Administrator Overview' : 'Student Registry'}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            {selectedRole === 'admin'
                                ? 'Monitor course creators and content quality.'
                                : 'Track student enrollment and engagement metrics.'}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Showing <strong>{users.length}</strong> {selectedRole}s
                    </div>
                </div>

                {loading ? <div className="loading-spinner">Loading Data...</div> : (
                    <>
                        {users.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No users found matching current filters.</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                                {users.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleCardClick(user)}
                                        className="animate-fade-in management-card"
                                        style={{
                                            background: 'var(--surface-color)',
                                            borderRadius: '16px',
                                            boxShadow: 'var(--shadow-md)',
                                            border: '1px solid var(--border-light)',
                                            cursor: user.role === 'admin' ? 'pointer' : 'default',
                                            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}
                                        onMouseEnter={e => {
                                            if (user.role === 'admin') e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                                        }}
                                        onMouseLeave={e => {
                                            if (user.role === 'admin') e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                        }}
                                    >
                                        {/* ID Card Header Detail */}
                                        <div style={{ height: '70px', marginBottom: '1rem', background: user.role === 'admin' ? 'linear-gradient(135deg, #4F46E5, #818CF8)' : 'linear-gradient(135deg, #10B981, #34D399)', position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: '15px', left: '15px', color: 'white', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', opacity: 0.9 }}>STUDY BUDDY ID</div>
                                            <div style={{ position: 'absolute', top: '15px', right: '15px', color: 'white', opacity: 1, fontWeight: 600, fontSize: '0.85rem' }}>
                                                {user.role === 'admin' ? '🛡️ ADMIN' : '🎓 STUDENT'}
                                            </div>
                                        </div>

                                        {/* Avatar & Main Info */}
                                        <div style={{ padding: '0 20px', marginTop: '-50px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                            <div style={{
                                                width: '80px',
                                                height: '80px',
                                                borderRadius: '50%',
                                                border: '4px solid var(--surface-color)',
                                                background: user.role === 'admin' ? 'var(--bg-color)' : 'var(--bg-color)',
                                                color: user.role === 'admin' ? 'var(--primary)' : '#10B981',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800,
                                                fontSize: '2rem',
                                                boxShadow: 'var(--shadow-md)'
                                            }}>
                                                {user.name[0] || '?'}
                                            </div>

                                            <div style={{ textAlign: 'center', marginTop: '10px', width: '100%' }}>
                                                <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)', fontWeight: 700 }}>{user.name}</h3>
                                                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{user.university}</p>
                                            </div>

                                            <div style={{ width: '100%', borderTop: '1px solid var(--border-light)', margin: '15px 0' }}></div>

                                            {/* Dynamic Content based on Role */}
                                            {user.role === 'admin' ? (
                                                <div style={{ width: '100%' }}>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1rem', background: 'var(--bg-color)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Responsible For</div>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                                                            {user.degree ? user.degree : (user.courses && user.courses.length > 0 ? user.courses.slice(0, 1).join(', ') + (user.courses.length > 1 ? ` +${user.courses.length - 1}` : '') : 'General Mgmt')}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', textAlign: 'center' }}>
                                                        <div style={{ padding: '5px' }}>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4F46E5' }}>{user.content_contributions}</div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>RESOURCES</div>
                                                        </div>
                                                        <div style={{ padding: '5px', borderLeft: '1px solid var(--border-light)', borderRight: '1px solid var(--border-light)' }}>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F59E0B' }}>{user.avg_rating}</div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>RATING</div>
                                                        </div>
                                                        <div style={{ padding: '5px' }}>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10B981' }}>{user.active_students}</div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>STUDENTS</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ width: '100%' }}>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1rem', background: 'var(--bg-color)', padding: '10px', borderRadius: '8px', textAlign: 'left', border: '1px solid var(--border-light)' }}>
                                                        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>STUDENT ID</span>
                                                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8rem' }}>{user.student_id || 'N/A'}</span>
                                                        </div>
                                                        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>EMAIL</span>
                                                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8rem', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.email}>{user.email}</span>
                                                        </div>
                                                        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>PHONE</span>
                                                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8rem' }}>{user.phone || 'N/A'}</span>
                                                        </div>
                                                        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>NIC</span>
                                                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8rem' }}>{user.nic || 'N/A'}</span>
                                                        </div>
                                                        <div style={{ borderTop: '1px dashed var(--border-light)', margin: '8px 0' }}></div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#15803D', fontSize: '0.75rem', fontWeight: 600 }}>COURSE</span>
                                                            <span style={{ fontWeight: 600, color: '#166534', fontSize: '0.8rem', textAlign: 'right', maxWidth: '150px' }}>
                                                                {user.degree || 'General'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center' }}>
                                                        <div style={{ padding: '5px', borderRight: '1px solid var(--border-light)' }}>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{user.enrolled_courses}</div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ENROLLED</div>
                                                        </div>
                                                        <div style={{ padding: '5px' }}>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3B82F6' }}>{user.study_time?.replace(' Hrs', '')}h</div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>STUDY TIME</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer Barcode Look */}
                                        <div style={{ padding: '15px 20px', marginTop: '15px', background: 'var(--bg-color)', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>ID: {user.id.toString().padStart(6, '0')}</div>
                                            {/* Mock Barcode */}
                                            <div style={{ height: '15px', display: 'flex', gap: '2px', opacity: 0.3 }}>
                                                {[...Array(10)].map((_, i) => (
                                                    <div key={i} style={{ width: Math.random() > 0.5 ? '2px' : '4px', background: 'var(--text-main)' }}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Detailed View Modal (Only for admins for now) */}
            {selectedAdmin && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
                    onClick={() => setSelectedAdmin(null)}
                >
                    <div
                        className="animate-slide-up modal-container"
                        style={{ background: 'var(--surface-color)', width: '90%', maxWidth: '900px', borderRadius: '16px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-color)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.5rem' }}>
                                    {selectedAdmin.name[0]}
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)' }}>{selectedAdmin.name}</h2>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedAdmin.university} • {selectedAdmin.degree}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedAdmin(null)}
                                style={{ border: 'none', background: 'none', fontSize: '2rem', cursor: 'pointer', color: 'var(--text-secondary)', lineHeight: 1 }}
                                title="Close"
                            >
                                ×
                            </button>
                        </div>

                        {loadingDetails ? <div className="loading-spinner">Loading Course Details...</div> : (
                            <>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>Course Performance</h3>
                                {detailedCourses.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No active courses managed by this admin.</p> : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--bg-color)', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    <th style={{ padding: '12px 16px', borderRadius: '8px 0 0 8px' }}>Code</th>
                                                    <th style={{ padding: '12px 16px' }}>Course Name</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Resources</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Avg Rating</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'center', borderRadius: '0 8px 8px 0' }}>Enrolled Students</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailedCourses.map(course => (
                                                    <tr key={course.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                                        <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{course.code || '-'}</td>
                                                        <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: 500 }}>{course.name}</td>
                                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                                            <span style={{ background: 'var(--bg-color)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                                {course.resources}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#F59E0B', fontWeight: 700 }}>
                                                                {course.rating > 0 ? (
                                                                    <><span>★</span> {course.rating}</>
                                                                ) : (
                                                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>N/A</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '16px', textAlign: 'center', color: '#10B981', fontWeight: 600 }}>{course.students}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                body.dark-mode .management-sidebar {
                    border-right-color: var(--border-light);
                }
                body.dark-mode select option {
                    background: var(--surface-color);
                    color: var(--text-main);
                }
            `}</style>
        </div>
    );
}

export default ManagementAnalytics;
