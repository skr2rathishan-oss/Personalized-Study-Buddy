import { useEffect, useState, useRef } from 'react';
import api from '../api';

interface Resource {
    id: number;
    title: string;
    url: string;
    format: 'video' | 'article' | 'pdf';
}

interface Topic {
    id: number;
    name: string;
    resources: Resource[];
}

interface Course {
    id: number;
    name: string;
    module_name?: string;
    module_id?: string;
    code?: string;
}

function AdminDashboard() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);

    // UI States
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);

    // Resource Modal State
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [activeTopicId, setActiveTopicId] = useState<number | null>(null);
    const [resForm, setResForm] = useState({ title: '', url: '', format: 'video' });

    // Form States
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseCode, setNewCourseCode] = useState('');
    const [topicInput, setTopicInput] = useState('');
    const [editCourseName, setEditCourseName] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchMyCourses = async () => {
        try {
            const res = await api.get('/admin/my-courses');
            if (Array.isArray(res.data)) {
                setCourses(res.data);
            } else {
                console.error("Expected array for courses, got:", res.data);
                setCourses([]);
            }
        } catch (err) { console.error(err); }
    };

    const fetchTopics = async (courseId: number) => {
        try {
            const res = await api.get(`/admin/courses/${courseId}/full_structure`);
            if (Array.isArray(res.data)) {
                setTopics(res.data);
            } else {
                console.error("Expected array for topics, got:", res.data);
                setTopics([]);
            }
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

    // Resource Actions
    const handleAddResource = async () => {
        if (!activeTopicId || !resForm.title || !resForm.url) return alert('Fill all fields');
        try {
            await api.post('/admin/resources', { ...resForm, topic_id: activeTopicId });
            setIsResourceModalOpen(false);
            setResForm({ title: '', url: '', format: 'video' });
            if (activeCourse) fetchTopics(activeCourse.id);
        } catch (err: any) { alert(err.response?.data?.error || 'Error adding resource'); }
    }

    const handleDeleteResource = async (resId: number) => {
        if (!confirm('Delete this resource?')) return;
        try {
            await api.delete(`/admin/resources/${resId}`);
            if (activeCourse) fetchTopics(activeCourse.id);
        } catch (err) { alert('Error deleting resource'); }
    }


    const openManageModal = (course: Course) => {
        setActiveCourse(course);
        setEditCourseName(course.name);
        fetchTopics(course.id);
        setIsManageModalOpen(true);
    };

    // Data Sync
    const handleExport = async () => {
        try {
            const response = await api.get('/admin/export-data', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `studybuddy_data_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { alert('Export failed'); console.error(err); }
    };

    const handleImportClick = () => { fileInputRef.current?.click(); };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/admin/import-data', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const stats = res.data.stats;
            alert(`Sync Complete!\nCreated: ${stats.created}\nUpdated: ${stats.updated}\nErrors: ${stats.errors}`);

            fetchMyCourses();
        } catch (err: any) {
            alert('Import failed: ' + (err.response?.data?.error || err.message));

        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="dashboard-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(to right, #2563EB, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        {localStorage.getItem('role') === 'management' ? 'Management Dashboard' : 'Admin Console'}
                    </h1>
                    <p style={{ color: '#64748B', marginTop: '0.5rem', fontSize: '1.1rem' }}>Manage your curriculum and content efficiently.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleExport} style={{ padding: '0.75rem 1rem', background: 'white', border: '1px solid #CBD5E1', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>Export Excel 📥</button>
                    <button onClick={handleImportClick} style={{ padding: '0.75rem 1rem', background: 'white', border: '1px solid #CBD5E1', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>Import Sync 📤</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".xlsx" />
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary-glow" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '12px', background: '#2563EB', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 14px 0 rgba(37,99,235,0.39)' }}>+ Add New Module</button>
                </div>
            </div>

            {/* Courses Grid */}
            {courses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #CBD5E1' }}>
                    <h3 style={{ color: '#94A3B8' }}>No modules found. Create one to get started!</h3>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {courses.map(course => (
                        <div key={course.id} className="course-card-premium" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', transition: 'transform 0.2s', border: '1px solid #E2E8F0' }}>
                            <div style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>MODULE</span>
                                <span style={{ color: 'white', opacity: 0.9, fontWeight: 500 }}>#{course.module_id || course.code || course.id}</span>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem', height: '2.8rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{course.name}</h3>
                                <button onClick={() => openManageModal(course)} style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Manage Content ⚙️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h2 style={{ marginTop: 0 }}>Add Module</h2>
                        <input className="input-modern" placeholder="Module Name" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                        <input className="input-modern" placeholder="Module ID" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
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
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0F172A' }}>{activeCourse.name}</h2>
                                <p style={{ margin: '5px 0 0', color: '#64748B', fontSize: '0.9rem' }}>Resource & Topic Management</p>
                            </div>
                            <button onClick={() => setIsManageModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748B' }}>×</button>
                        </div>
                        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                            <div style={{ width: '250px', background: '#F1F5F9', padding: '1.5rem', borderRight: '1px solid #E2E8F0', overflowY: 'auto' }}>
                                <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#94A3B8', marginBottom: '1rem' }}>General Settings</h4>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>Rename Module</label>
                                <input value={editCourseName} onChange={e => setEditCourseName(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', marginBottom: '1rem' }} />
                                <button onClick={handleUpdateCourse} style={{ width: '100%', padding: '8px', background: 'white', border: '1px solid #CBD5E1', borderRadius: '6px', cursor: 'pointer', marginBottom: '2rem' }}>Update Name</button>
                                <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', color: '#EF4444', marginBottom: '1rem' }}>Danger Zone</h4>
                                <button onClick={handleDeleteCourse} style={{ width: '100%', padding: '10px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '6px', cursor: 'pointer' }}>Delete Module</button>
                            </div>
                            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#1E293B' }}>Topics</h3>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input value={topicInput} onChange={e => setTopicInput(e.target.value)} placeholder="Add topics (comma separated)..." style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '1rem' }} />
                                        <button onClick={handleAddTopics} style={{ padding: '0 24px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.5rem' }}>Tip: You can add multiple topics at once.</p>
                                </div>
                                <div className="topics-list">
                                    {topics.length === 0 ? <p style={{ color: '#94A3B8', fontStyle: 'italic' }}>No topics added yet.</p> : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                            {topics.map(t => (
                                                <div key={t.id} style={{ background: 'white', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 600, color: '#334155' }}>{t.name}</span>
                                                        <button onClick={() => handleDeleteTopic(t.id)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }} title="Remove Topic">✕</button>
                                                    </div>

                                                    {/* Resources List */}
                                                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                                        <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resources</p>
                                                        {t.resources && t.resources.length > 0 ? (
                                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                {t.resources.map(r => (
                                                                    <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', background: '#F8FAFC', padding: '4px 8px', borderRadius: '4px' }}>
                                                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <span style={{ fontSize: '0.65rem', padding: '2px 4px', borderRadius: '3px', background: r.format === 'video' ? '#EEF2FF' : (r.format === 'pdf' ? '#FFF7ED' : '#ECFDF5'), color: r.format === 'video' ? '#4F46E5' : (r.format === 'pdf' ? '#EA580C' : '#10B981'), fontWeight: 600 }}>
                                                                                {r.format === 'pdf' ? 'PDF' : (r.format === 'article' ? 'LINK' : 'VID')}
                                                                            </span>
                                                                            <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: '#334155', textDecoration: 'none' }} title={r.title}>{r.title}</a>
                                                                        </div>
                                                                        <button onClick={() => handleDeleteResource(r.id)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}>×</button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : <p style={{ fontSize: '0.8rem', color: '#CBD5E1', fontStyle: 'italic', margin: 0 }}>No resources.</p>}
                                                        <button
                                                            onClick={() => { setActiveTopicId(t.id); setIsResourceModalOpen(true); }}
                                                            style={{ marginTop: '0.8rem', width: '100%', padding: '6px', border: '1px dashed #CBD5E1', borderRadius: '6px', background: 'white', color: '#2563EB', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}
                                                        >
                                                            + Add Resource
                                                        </button>
                                                    </div>
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

            {/* Add Resource Modal */}
            {isResourceModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '350px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Add Resource</h3>

                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Type</label>
                        <select
                            value={resForm.format}
                            onChange={e => setResForm({ ...resForm, format: e.target.value as any })}
                            style={{ width: '100%', padding: '10px', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                        >
                            <option value="video">YouTube Video</option>
                            <option value="article">Article Link</option>
                            <option value="pdf">PDF Link</option>
                        </select>

                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Title</label>
                        <input
                            placeholder="Resource Title"
                            value={resForm.title}
                            onChange={e => setResForm({ ...resForm, title: e.target.value })}
                            style={{ width: '100%', padding: '10px', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                        />

                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>URL</label>
                        <input
                            placeholder="https://..."
                            value={resForm.url}
                            onChange={e => setResForm({ ...resForm, url: e.target.value })}
                            style={{ width: '100%', padding: '10px', marginBottom: '1.5rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                        />

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleAddResource} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#2563EB', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Add</button>
                            <button onClick={() => setIsResourceModalOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#E2E8F0', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
