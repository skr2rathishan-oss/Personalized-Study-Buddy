import { useEffect, useState } from 'react';
import api from '../api';

interface Course {
    id: number;
    name: string;
}

function AdminDashboard() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [topics, setTopics] = useState<{ id: number, name: string }[]>([]);

    // UI States
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);

    // Form States
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseCode, setNewCourseCode] = useState('');
    const [topicInput, setTopicInput] = useState('');
    const [editCourseName, setEditCourseName] = useState('');

    const fetchMyCourses = async () => {
        try {
            const res = await api.get('/admin/my-courses');
            setCourses(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchTopics = async (courseId: number) => {
        try {
            const res = await api.get(`/courses/${courseId}/topics`);
            setTopics(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchMyCourses(); }, []);

    // Course Actions
    const handleCreateCourse = async () => {
        if (!newCourseName || !newCourseCode) return alert('Fill all fields');
        try {
            await api.post('/admin/courses', { name: newCourseName, code: newCourseCode });
            setNewCourseName(''); setNewCourseCode(''); setIsCreateModalOpen(false);
            fetchMyCourses();
        } catch (err: any) { alert(err.response?.data?.error || 'Error creating course'); }
    };

    const handleUpdateCourse = async () => {
        if (!activeCourse) return;
        try {
            await api.put(`/admin/courses/${activeCourse.id}`, { name: editCourseName });
            const updated = { ...activeCourse, name: editCourseName };
            setActiveCourse(updated);
            setCourses(courses.map(c => c.id === updated.id ? updated : c));
            alert('Course updated successfully');
        } catch (err: any) { alert(err.message); }
    };

    const handleDeleteCourse = async () => {
        if (!activeCourse || !confirm('Delete this course permanently?')) return;
        try {
            await api.delete(`/admin/courses/${activeCourse.id}`);
            setIsManageModalOpen(false);
            fetchMyCourses();
        } catch (err: any) { alert(err.message); }
    };

    // Topic Actions
    const handleAddTopics = async () => {
        if (!activeCourse || !topicInput) return;
        const list = topicInput.split(',').map(t => t.trim()).filter(t => t);
        if (list.length === 0) return;

        try {
            await Promise.all(list.map(name => api.post(`/admin/courses/${activeCourse.id}/topics`, { name })));
            setTopicInput('');
            fetchTopics(activeCourse.id);
        } catch (err: any) { alert('Error adding topics'); }
    };

    const handleDeleteTopic = async (topicId: number) => {
        if (!confirm('Remove this topic?')) return;
        try {
            await api.delete(`/admin/topics/${topicId}`);
            if (activeCourse) fetchTopics(activeCourse.id);
        } catch (err: any) { alert('Error deleting topic'); }
    };

    // Open Manager
    const openManageModal = (course: Course) => {
        setActiveCourse(course);
        setEditCourseName(course.name);
        fetchTopics(course.id);
        setIsManageModalOpen(true);
    };

    return (
        <div className="dashboard-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(to right, #2563EB, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        Admin Console
                    </h1>
                    <p style={{ color: '#64748B', marginTop: '0.5rem', fontSize: '1.1rem' }}>Manage your curriculum and content efficiently.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary-glow"
                    style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '12px', background: '#2563EB', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 14px 0 rgba(37,99,235,0.39)' }}
                >
                    + Create New Course
                </button>
            </div>

            {/* Courses Grid */}
            {courses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #CBD5E1' }}>
                    <h3 style={{ color: '#94A3B8' }}>No courses found. Create one to get started!</h3>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {courses.map(course => (
                        <div key={course.id} className="course-card-premium" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', transition: 'transform 0.2s', border: '1px solid #E2E8F0' }}>
                            <div style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>COURSE</span>
                                <span style={{ color: 'white', opacity: 0.9, fontWeight: 500 }}>#{course.id}</span>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem', height: '2.8rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {course.name}
                                </h3>
                                <button
                                    onClick={() => openManageModal(course)}
                                    style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E2E8F0' }}
                                >
                                    Manage Content ⚙️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ marginTop: 0 }}>Add Course</h2>
                        <input className="input-modern" placeholder="Course Name (e.g. Adv. Algorithms)" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                        <input className="input-modern" placeholder="Course Code (e.g. CS404)" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                            <button onClick={handleCreateCourse} className="btn-primary" style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#2563EB', color: 'white', border: 'none', cursor: 'pointer' }}>Create</button>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#E2E8F0', border: 'none', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manager Modal */}
            {isManageModalOpen && activeCourse && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', width: '800px', height: '80vh', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                        {/* Modal Header */}
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0F172A' }}>{activeCourse.name}</h2>
                                <p style={{ margin: '5px 0 0', color: '#64748B', fontSize: '0.9rem' }}>Resource & Topic Management</p>
                            </div>
                            <button onClick={() => setIsManageModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748B' }}>×</button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                            {/* Sidebar Settings */}
                            <div style={{ width: '250px', background: '#F1F5F9', padding: '1.5rem', borderRight: '1px solid #E2E8F0', overflowY: 'auto' }}>
                                <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#94A3B8', marginBottom: '1rem' }}>General Settings</h4>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>Rename Course</label>
                                <input value={editCourseName} onChange={e => setEditCourseName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', marginBottom: '1rem' }} />
                                <button onClick={handleUpdateCourse} style={{ width: '100%', padding: '8px', background: 'white', border: '1px solid #CBD5E1', borderRadius: '6px', cursor: 'pointer', marginBottom: '2rem' }}>Update Name</button>

                                <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#EF4444', marginBottom: '1rem' }}>Danger Zone</h4>
                                <button onClick={handleDeleteCourse} style={{ width: '100%', padding: '10px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '6px', cursor: 'pointer' }}>Delete Course</button>
                            </div>

                            {/* Main Content: Topics */}
                            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#1E293B' }}>Topics</h3>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            value={topicInput}
                                            onChange={e => setTopicInput(e.target.value)}
                                            placeholder="Add topics (comma separated)... e.g. Arrays, Trees"
                                            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '1rem' }}
                                        />
                                        <button onClick={handleAddTopics} style={{ padding: '0 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.5rem' }}>Tip: You can add multiple topics at once.</p>
                                </div>

                                <div className="topics-list">
                                    {topics.length === 0 ? <p style={{ color: '#94A3B8', fontStyle: 'italic' }}>No topics added yet.</p> : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                            {topics.map(t => (
                                                <div key={t.id} style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <span style={{ fontWeight: 500, color: '#334155' }}>{t.name}</span>
                                                    <button
                                                        onClick={() => handleDeleteTopic(t.id)}
                                                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                                                        title="Remove Topic"
                                                        onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                                                        onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
