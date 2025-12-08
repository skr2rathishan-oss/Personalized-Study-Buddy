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
            <aside style={{
                width: '280px',
                background: 'white',
                borderRight: '1px solid #E2E8F0',
                padding: '1.5rem',
                position: 'fixed',
                top: '64px',
                bottom: 0,
                left: 0,
                overflowY: 'auto',
                zIndex: 900
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>📊</span>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#1E293B' }}>Filters</h3>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginBottom: '0.5rem' }}>User Role</label>
                    <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '8px' }}>
                        <button
                            onClick={() => setSelectedRole('admin')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                border: 'none',
                                borderRadius: '6px',
                                background: selectedRole === 'admin' ? 'white' : 'transparent',
                                color: selectedRole === 'admin' ? '#4F46E5' : '#64748B',
                                fontWeight: 600,
                                boxShadow: selectedRole === 'admin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer'
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
                                background: selectedRole === 'student' ? 'white' : 'transparent',
                                color: selectedRole === 'student' ? '#4F46E5' : '#64748B',
                                fontWeight: 600,
                                boxShadow: selectedRole === 'student' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Students
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginBottom: '0.5rem' }}>University</label>
                    <select
                        value={selectedUni}
                        onChange={e => setSelectedUni(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                    >
                        <option value="">All Universities</option>
                        {Object.keys(UNIVERSITY_COURSES).map(uni => (
                            <option key={uni} value={uni}>{uni}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748B', marginBottom: '0.5rem' }}>Degree / Course</label>
                    <select
                        value={selectedDegree}
                        onChange={e => setSelectedDegree(e.target.value)}
                        disabled={!selectedUni}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.9rem',
                            background: !selectedUni ? '#f8fafc' : 'white',
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
            <main style={{ marginLeft: '280px', flex: 1, padding: '2rem', background: '#F8FAFC', minHeight: '100vh', boxSizing: 'border-box' }}>
                <div style={{ marginBottom: '2rem', marginTop: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                            {selectedRole === 'admin' ? 'Administrator Overview' : 'Student Registry'}
                        </h1>
                        <p style={{ color: '#64748B', marginTop: '0.5rem' }}>
                            {selectedRole === 'admin'
                                ? 'Monitor course creators and content quality.'
                                : 'Track student enrollment and engagement metrics.'}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', color: '#64748B', fontSize: '0.9rem' }}>
                        Showing <strong>{users.length}</strong> {selectedRole}s
                    </div>
                </div>

                {loading ? <div className="loading-spinner">Loading Data...</div> : (
                    <>
                        {users.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>No users found matching current filters.</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                                {users.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleCardClick(user)}
                                        className="animate-fade-in"
                                        style={{
                                            background: 'white',
                                            borderRadius: '16px',
                                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                            border: '1px solid rgba(0,0,0,0.05)',
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
                                        <div style={{ height: '80px', background: user.role === 'admin' ? 'linear-gradient(135deg, #4F46E5, #818CF8)' : 'linear-gradient(135deg, #10B981, #34D399)', position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: '10px', left: '15px', color: 'white', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', opacity: 0.8 }}>STUDY BUDDY ID</div>
                                            <div style={{ position: 'absolute', top: '10px', right: '15px', color: 'white', opacity: 0.9 }}>
                                                {user.role === 'admin' ? '🛡️ ADMIN' : '🎓 STUDENT'}
                                            </div>
                                        </div>

                                        {/* Avatar & Main Info */}
                                        <div style={{ padding: '0 20px', marginTop: '-40px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                            <div style={{
                                                width: '80px',
                                                height: '80px',
                                                borderRadius: '50%',
                                                border: '4px solid white',
                                                background: user.role === 'admin' ? '#EEF2FF' : '#ECFDF5',
                                                color: user.role === 'admin' ? '#4F46E5' : '#10B981',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 800,
                                                fontSize: '2rem',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                            }}>
                                                {user.name[0] || '?'}
                                            </div>

                                            <div style={{ textAlign: 'center', marginTop: '10px', width: '100%' }}>
                                                <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#1E293B', fontWeight: 700 }}>{user.name}</h3>
                                                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{user.university}</p>
                                            </div>

                                            <div style={{ width: '100%', borderTop: '1px solid #F1F5F9', margin: '15px 0' }}></div>

                                            {/* Dynamic Content based on Role */}
                                            {user.role === 'admin' ? (
                                                <div style={{ width: '100%' }}>
                                                    <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', background: '#F8FAFC', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                                                        <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Responsible For</div>
                                                        <div style={{ fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                                                            {user.degree ? user.degree : (user.courses && user.courses.length > 0 ? user.courses.slice(0, 1).join(', ') + (user.courses.length > 1 ? ` +${user.courses.length - 1}` : '') : 'General Mgmt')}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px', textAlign: 'center' }}>
                                                        <div style={{ padding: '5px' }}>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4F46E5' }}>{user.content_contributions}</div>
                                                            <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>RESOURCES</div>
                                                        </div>
                                                        <div style={{ padding: '5px', borderLeft: '1px solid #F1F5F9', borderRight: '1px solid #F1F5F9' }}>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F59E0B' }}>{user.avg_rating}</div>
                                                            <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>RATING</div>
                                                        </div>
                                                        <div style={{ padding: '5px' }}>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10B981' }}>{user.active_students}</div>
                                                            <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>STUDENTS</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ width: '100%' }}>
                                                    <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', background: '#F0FDF4', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #DCFCE7' }}>
                                                        <div style={{ fontSize: '0.7rem', color: '#15803D', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Program</div>
                                                        <div style={{ fontWeight: 600, color: '#166534', marginTop: '2px' }}>
                                                            {user.degree || 'General Studies'}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center' }}>
                                                        <div style={{ padding: '5px', borderRight: '1px solid #F1F5F9' }}>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>{user.enrolled_courses}</div>
                                                            <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>ENROLLED</div>
                                                        </div>
                                                        <div style={{ padding: '5px' }}>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3B82F6' }}>{user.study_time?.replace(' Hrs', '')}h</div>
                                                            <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>STUDY TIME</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer Barcode Look */}
                                        <div style={{ padding: '15px 20px', marginTop: '15px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontFamily: 'monospace' }}>ID: {user.id.toString().padStart(6, '0')}</div>
                                            {/* Mock Barcode */}
                                            <div style={{ height: '15px', display: 'flex', gap: '2px', opacity: 0.3 }}>
                                                {[...Array(10)].map((_, i) => (
                                                    <div key={i} style={{ width: Math.random() > 0.5 ? '2px' : '4px', background: 'black' }}></div>
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
                        className="animate-slide-up"
                        style={{ background: 'white', width: '90%', maxWidth: '900px', borderRadius: '16px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.5rem' }}>
                                    {selectedAdmin.name[0]}
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#1E293B' }}>{selectedAdmin.name}</h2>
                                    <p style={{ margin: 0, color: '#64748B' }}>{selectedAdmin.university} • {selectedAdmin.degree}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedAdmin(null)}
                                style={{ border: 'none', background: 'none', fontSize: '2rem', cursor: 'pointer', color: '#94A3B8', lineHeight: 1 }}
                                title="Close"
                            >
                                ×
                            </button>
                        </div>

                        {loadingDetails ? <div className="loading-spinner">Loading Course Details...</div> : (
                            <>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#1E293B', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>Course Performance</h3>
                                {detailedCourses.length === 0 ? <p style={{ color: '#64748B' }}>No active courses managed by this admin.</p> : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                            <thead>
                                                <tr style={{ background: '#F8FAFC', color: '#475569', fontSize: '0.85rem', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    <th style={{ padding: '12px 16px', borderRadius: '8px 0 0 8px' }}>Code</th>
                                                    <th style={{ padding: '12px 16px' }}>Course Name</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Resources</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Avg Rating</th>
                                                    <th style={{ padding: '12px 16px', textAlign: 'center', borderRadius: '0 8px 8px 0' }}>Enrolled Students</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailedCourses.map(course => (
                                                    <tr key={course.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                        <td style={{ padding: '16px', fontWeight: 600, color: '#334155' }}>{course.code || '-'}</td>
                                                        <td style={{ padding: '16px', color: '#1E293B', fontWeight: 500 }}>{course.name}</td>
                                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                                            <span style={{ background: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                                {course.resources}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#F59E0B', fontWeight: 700 }}>
                                                                {course.rating > 0 ? (
                                                                    <><span>★</span> {course.rating}</>
                                                                ) : (
                                                                    <span style={{ color: '#CBD5E1', fontWeight: 400 }}>N/A</span>
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
        </div>
    );
}

export default ManagementAnalytics;
