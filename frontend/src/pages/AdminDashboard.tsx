import { useEffect, useState } from 'react';
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

    useEffect(() => {
        const fetchMyCourses = async () => {
            try {
                const res = await api.get('/admin/my-courses');
                setCourses(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMyCourses();
    }, []);

    const handleCourseSelect = async (courseId: number) => {
        setSelectedCourse(courseId);
        try {
            const res = await api.get(`/admin/students/${courseId}`);
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="dashboard-container animate-fade-in">
            <h1 className="section-title">Admin Dashboard</h1>

            <div style={{ display: 'flex', gap: '3rem', flexDirection: 'row', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px', maxWidth: '400px' }}>
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
