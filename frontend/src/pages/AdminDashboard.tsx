import { useEffect, useState, useRef } from 'react';
import api from '../api';

interface Course {
    id: number;
    name: string;
}

interface Student {
    id: number;
    username: string;
}

function AdminDashboard() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const exportRef = useRef<HTMLDivElement>(null);

    // Create Mode States
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseCode, setNewCourseCode] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);

    const fetchMyCourses = async () => {
        try {
            const res = await api.get('/admin/my-courses');
            setCourses(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateCourse = async () => {
        if (!newCourseName || !newCourseCode) {
            alert('Please fill in both fields');
            return;
        }
        try {
            await api.post('/admin/courses', {
                name: newCourseName,
                code: newCourseCode
            });
            alert('Course created!');
            setNewCourseName('');
            setNewCourseCode('');
            fetchMyCourses(); // Refresh list
        } catch (err: any) {
            alert('Failed to create: ' + (err.response?.data?.error || err.message));
        }
    };

    useEffect(() => {
        fetchMyCourses();
    }, []);

    // Close export popup when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setShowExportModal(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [exportRef]);

    const handleCourseSelect = async (courseId: number) => {
        setSelectedCourse(courseId);
        try {
            const res = await api.get(`/admin/students/${courseId}`);
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleExportData = () => {
        setShowExportModal(true);
    };

    const handleExportConfirm = async (mode: 'new' | 'update') => {
        setShowExportModal(false);
        try {
            const res = await api.get(`/admin/export-data?mode=${mode}`);
            // Show alert with the path where file is saved
            alert(`Data exported successfully!\nFile saved at: ${res.data.file_path}`);
        } catch (err: any) {
            console.error(err);
            alert('Failed to export data: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="dashboard-container animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ margin: 0 }}>Admin Dashboard</h1>

                {/* Export Button & Popup Container */}
                <div style={{ position: 'relative' }} ref={exportRef}>
                    <button onClick={handleExportData} className="btn-modern-outline" style={{ width: 'auto', marginTop: 0 }}>
                        📥 Export Data
                    </button>

                    {showExportModal && (
                        <div className="animate-fade-in" style={{
                            position: 'absolute',
                            top: '110%',
                            right: 0,
                            background: 'white',
                            minWidth: '200px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            border: '1px solid #e2e8f0',
                            zIndex: 50,
                            overflow: 'hidden'
                        }}>
                            <button
                                onClick={() => handleExportConfirm('new')}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '0.75rem 1rem',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: '1px solid #f1f5f9',
                                    cursor: 'pointer',
                                    color: '#1e293b',
                                    fontSize: '0.9rem'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                🆕 Create Snapshot
                            </button>
                            <button
                                onClick={() => handleExportConfirm('update')}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '0.75rem 1rem',
                                    background: 'none',
                                    border: 'none',
                                    color: '#1e293b',
                                    fontSize: '0.9rem'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                🔄 Update Master
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '3rem', flexDirection: 'row', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px', maxWidth: '400px' }}>

                    {/* Create Course Form */}
                    <div className="login-card-clean" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <h4 className="form-label" style={{ marginBottom: '1rem' }}>Add New Course</h4>
                        <div className="form-group-clean">
                            <input
                                type="text"
                                placeholder="Course Name (e.g. AI Basics)"
                                value={newCourseName}
                                onChange={e => setNewCourseName(e.target.value)}
                            />
                        </div>
                        <div className="form-group-clean">
                            <input
                                type="text"
                                placeholder="Course Code (e.g. AI101)"
                                value={newCourseCode}
                                onChange={e => setNewCourseCode(e.target.value)}
                            />
                        </div>
                        <button onClick={handleCreateCourse} className="btn-modern-primary" style={{ padding: '0.75rem' }}>
                            + Create Course
                        </button>
                    </div>

                    <h3 className="form-label" style={{ fontSize: '1.2rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border-color)' }}>Assigned Courses</h3>
                    {courses.length === 0 && <p style={{ marginTop: '1rem' }}>No courses assigned.</p>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1.5rem' }}>
                        {courses.map(c => (
                            <button
                                key={c.id}
                                onClick={() => handleCourseSelect(c.id)}
                                className={`selection-card ${selectedCourse === c.id ? 'active' : ''}`}
                                style={{ textAlign: 'left', width: '100%' }}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: '2 1 400px' }}>
                    <h3 className="form-label" style={{ fontSize: '1.2rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--border-color)' }}>Enrolled Students</h3>
                    {!selectedCourse && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--card-bg)', borderRadius: '8px', marginTop: '1.5rem' }}>Select a course to view details.</div>}
                    {selectedCourse && (
                        <div style={{ marginTop: '1.5rem' }} className="animate-fade-in">
                            {students.length === 0 ? <p>No students enrolled.</p> : (
                                <div style={{ background: 'var(--card-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead style={{ background: '#f1f5f9' }}>
                                            <tr>
                                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ID</th>
                                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Username</th>
                                                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.map(s => (
                                                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '1rem' }}>{s.id}</td>
                                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{s.username}</td>
                                                    <td style={{ padding: '1rem' }}><span style={{ color: '#10b981', background: '#d1fae5', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>Active</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
