import { useEffect, useState, useRef } from 'react';
import api from '../api';

interface Resource {
    id: number;
    title: string;
    url: string;
    format: 'video' | 'article' | 'pdf';
    quality_score?: number;
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
        <div className="dashboard-container relative" style={{
            padding: '2rem',
            maxWidth: '1280px',
            margin: '4rem auto',
            paddingBottom: '4rem'
        }}>
            {/* Decorative Background Blob */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-5%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0) 70%)',
                zIndex: -1,
                pointerEvents: 'none'
            }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 800,
                        background: 'linear-gradient(to right, #2563EB, #7C3AED)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        margin: 0
                    }}>
                        {localStorage.getItem('role') === 'management' ? 'Management Dashboard' : 'Admin Console'}

                    </h1>
                    <div style={{ marginTop: '0.5rem', color: '#64748B', fontWeight: 600, fontSize: '1.1rem' }}>
                        {[localStorage.getItem('university'), localStorage.getItem('university_course')].filter(Boolean).join(' • ')}
                    </div>
                    <p style={{ color: '#94A3B8', marginTop: '0.25rem', fontSize: '1rem' }}>Manage your curriculum and content efficiently.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleExport} className="btn-secondary">Export Excel 📥</button>
                    <button onClick={handleImportClick} className="btn-secondary">Import Sync 📤</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".xlsx" />
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary-glow">+ Add New Module</button>
                </div>
            </div>

            {/* Courses Grid */}
            {courses.length === 0 ? (
                <div className="empty-state-card" style={{
                    textAlign: 'center',
                    padding: '5rem 2rem',
                    background: 'white',
                    borderRadius: '24px',
                    border: '2px dashed #CBD5E1',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📚</div>
                    <h3 style={{ color: '#1E293B', fontSize: '1.5rem', marginBottom: '0.5rem' }}>No modules found</h3>
                    <p style={{ color: '#64748B', maxWidth: '400px', margin: '0 auto 2rem' }}>Get started by creating your first course module. You can add resources and topics later.</p>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary-glow">Create Module</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                    {courses.map(course => (
                        <div key={course.id} className="course-card-premium">
                            <div className="card-header-gradient">
                                <span className="badge-glass">MODULE</span>
                                <span className="card-id">#{course.module_id || course.code || course.id}</span>
                            </div>
                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <h3 className="course-card-title">{course.name}</h3>
                                <div style={{ marginTop: '1.5rem' }}>
                                    <button onClick={() => openManageModal(course)} className="btn-manage">Manage Content ⚙️</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content animate-scale-in">
                        <h2 style={{ marginTop: 0 }}>Add Module</h2>
                        <input className="input-modern" placeholder="Module Name" value={newCourseName} onChange={e => setNewCourseName(e.target.value)} />
                        <input className="input-modern" placeholder="Module ID" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
                            <button onClick={handleCreateCourse} className="btn-primary" style={{ flex: 1 }}>Create</button>
                            <button onClick={() => setIsCreateModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>

                        </div>
                    </div>
                </div>

            )}


            {/* Manager Modal */}
            {isManageModalOpen && activeCourse && (
                <div className="modal-overlay">
                    <div className="manager-modal animate-scale-in">
                        <div className="modal-header">
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0F172A' }}>{activeCourse.name}</h2>
                                <p style={{ margin: '5px 0 0', color: '#64748B', fontSize: '0.9rem' }}>Resource & Topic Management</p>
                            </div>
                            <button onClick={() => setIsManageModalOpen(false)} className="close-btn">×</button>
                        </div>
                        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                            <div className="settings-sidebar">
                                <h4 className="sidebar-title">General Settings</h4>
                                <label className="input-label">Rename Module</label>
                                <input value={editCourseName} onChange={e => setEditCourseName(e.target.value)} className="input-modern-sm" />
                                <button onClick={handleUpdateCourse} className="btn-secondary-sm" style={{ width: '100%', marginBottom: '2rem' }}>Update Name</button>

                                <h4 className="sidebar-title" style={{ color: '#EF4444' }}>Danger Zone</h4>
                                <button onClick={handleDeleteCourse} className="btn-danger">Delete Module</button>
                            </div>
                            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#1E293B' }}>Topics</h3>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input value={topicInput} onChange={e => setTopicInput(e.target.value)} placeholder="Add topics (comma separated)..." className="input-modern" style={{ flex: 1 }} />
                                        <button onClick={handleAddTopics} className="btn-success">+ Add</button>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.5rem' }}>Tip: You can add multiple topics at once.</p>
                                </div>
                                <div className="topics-list">
                                    {topics.length === 0 ? <div className="empty-topics">No topics added yet. Add one above.</div> : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                            {topics.map(t => (
                                                <div key={t.id} className="topic-card">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontWeight: 600, color: '#334155' }}>{t.name}</span>
                                                        <button onClick={() => handleDeleteTopic(t.id)} className="icon-btn-danger" title="Remove Topic">✕</button>
                                                    </div>

                                                    {/* Resources List */}
                                                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                                        <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resources</p>
                                                        {t.resources && t.resources.length > 0 ? (
                                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                {t.resources.map(r => (
                                                                    <li key={r.id} className="resource-item">
                                                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <span className={`fmt-badge fmt-${r.format}`}>
                                                                                {r.format === 'pdf' ? 'PDF' : (r.format === 'article' ? 'LINK' : 'VID')}
                                                                            </span>
                                                                            {r.quality_score !== undefined && (
                                                                                <span style={{ fontSize: '0.65rem', background: '#F1F5F9', color: '#64748B', padding: '2px 4px', borderRadius: '4px', border: '1px solid #E2E8F0', fontWeight: 600 }} title="AI Quality Score">
                                                                                    QS:{r.quality_score}
                                                                                </span>
                                                                            )}
                                                                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="resource-link" title={r.title}>{r.title}</a>
                                                                        </div>
                                                                        <button onClick={() => handleDeleteResource(r.id)} className="icon-btn-danger-sm">×</button>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : <p style={{ fontSize: '0.8rem', color: '#CBD5E1', fontStyle: 'italic', margin: 0 }}>No resources.</p>}
                                                        <button
                                                            onClick={() => { setActiveTopicId(t.id); setIsResourceModalOpen(true); }}
                                                            className="btn-add-res"
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
                <div className="modal-overlay">
                    <div className="modal-content animate-scale-in" style={{ width: '350px' }}>
                        <h3 style={{ marginTop: '0', marginBottom: '1.5rem' }}>Add Resource</h3>

                        <label className="input-label">Type</label>
                        <select
                            value={resForm.format}
                            onChange={e => setResForm({ ...resForm, format: e.target.value as any })}
                            className="input-select"
                        >
                            <option value="video">YouTube Video</option>
                            <option value="article">Article Link</option>
                            <option value="pdf">PDF Link</option>
                        </select>

                        <label className="input-label">Title</label>
                        <input
                            placeholder="Resource Title"
                            value={resForm.title}
                            onChange={e => setResForm({ ...resForm, title: e.target.value })}
                            className="input-modern"
                            style={{ marginBottom: '1rem' }}
                        />

                        <label className="input-label">URL</label>
                        <input
                            placeholder="https://..."
                            value={resForm.url}
                            onChange={e => setResForm({ ...resForm, url: e.target.value })}
                            className="input-modern"
                            style={{ marginBottom: '1.5rem' }}
                        />

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleAddResource} className="btn-primary" style={{ flex: 1 }}>Add</button>
                            <button onClick={() => setIsResourceModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                /* Container & Layout */
                .dashboard-container {
                    position: relative;
                }

                /* Buttons */
                .btn-primary-glow {
                    padding: 0.75rem 1.5rem;
                    font-size: 1rem;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #2563EB 0%, #4F46E5 100%);
                    color: white;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                    box-shadow: 0 4px 14px 0 rgba(37,99,235,0.39);
                    transition: all 0.2s;
                }
                .btn-primary-glow:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.23); }

                .btn-secondary {
                    padding: 0.75rem 1rem;
                    background: white;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    cursor: pointer;
                    font-weight: 600;
                    color: #475569;
                    transition: all 0.2s;
                }
                .btn-secondary:hover { background: #F8FAFC; border-color: #CBD5E1; }

                .btn-primary { 
                    padding: 10px; 
                    border-radius: 8px; 
                    background: #2563EB; 
                    color: white; 
                    border: none; 
                    cursor: pointer; 
                    font-weight: 600; 
                }
                .btn-success {
                     padding: 0 24px; 
                     background: #10B981; 
                     color: white; 
                     border: none; 
                     border-radius: 8px; 
                     font-weight: 600; 
                     cursor: pointer;
                }
                .btn-manage {
                    width: 100%;
                    padding: 0.75rem;
                    border-radius: 8px;
                    border: 1px solid #E2E8F0;
                    background: white;
                    color: #475569;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-manage:hover {
                    background: #F1F5F9;
                    color: #0F172A;
                    border-color: #CBD5E1;
                }
                .btn-danger {
                    width: 100%; 
                    padding: 10px; 
                    background: #FEF2F2; 
                    border: 1px solid #FECACA; 
                    color: #DC2626; 
                    border-radius: 6px; 
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .btn-danger:hover { background: #FEE2E2; }
                
                .btn-secondary-sm {
                    padding: 8px; 
                    background: white; 
                    border: 1px solid #CBD5E1; 
                    border-radius: 6px; 
                    cursor: pointer;
                }
                .btn-add-res {
                    margin-top: 0.8rem; 
                    width: 100%; 
                    padding: 8px; 
                    border: 1px dashed #CBD5E1; 
                    border-radius: 6px; 
                    background: white; 
                    color: #2563EB; 
                    font-size: 0.85rem; 
                    cursor: pointer; 
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .btn-add-res:hover { background: #EEF2FF; border-color: #93C5FD; }

                .icon-btn-danger, .icon-btn-danger-sm {
                    border: none; background: none; color: #94A3B8; cursor: pointer; padding: 4px; transition: color 0.2s;
                }
                .icon-btn-danger:hover { color: #EF4444; }
                .icon-btn-danger-sm { font-size: 1.1rem; line-height: 1; color: #EF4444; opacity: 0.6; }
                .icon-btn-danger-sm:hover { opacity: 1; }

                /* Course Card */
                .course-card-premium {
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
                    border: 1px solid #E2E8F0;
                    transition: all 0.3s ease;
                    display: flex; 
                    flex-direction: column;
                }
                .course-card-title {
                    font-size: 1.35rem;
                    font-weight: 700;
                    color: #1E293B;
                    margin-bottom: auto;
                    line-height: 1.3;
                }
                .course-card-premium:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                }
                .card-header-gradient {
                    background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .badge-glass {
                    background: rgba(255,255,255,0.2);
                    padding: 4px 10px;
                    border-radius: 20px;
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    backdrop-filter: blur(4px);
                }
                .card-id { color: white; opacity: 0.9; fontWeight: 500; font-size: 0.9rem; }

                /* Inputs */
                .input-modern, .input-modern-sm, .input-select {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #E2E8F0;
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                    font-size: 0.95rem;
                    transition: border-color 0.2s;
                }
                .input-modern:focus, .input-modern-sm:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
                .input-modern-sm { padding: 8px; border-radius: 6px; border-color: #CBD5E1; margin-bottom: 1rem; }
                .input-label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: #475569; font-weight: 500; }

                /* Modals */
                .modal-overlay {
                    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
                    display: flex; align-items: center; justify-content: center; z-index: 9999;
                    backdrop-filter: blur(4px);
                }
                .modal-content {
                    background: white; padding: 2rem; border-radius: 20px; width: 400px;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                    position: relative;
                }
                .manager-modal {
                    background: white; width: 900px; height: 85vh; border-radius: 24px;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden;
                    display: flex; flex-direction: column;
                    position: relative;
                }
                
                /* Dark Mode Overrides */
                body.dark-mode .modal-content,
                body.dark-mode .manager-modal {
                    background: #1e293b; /* Slate 800 */
                    border: 1px solid #334155;
                    color: #f8fafc;
                }
                body.dark-mode .modal-header {
                    background: #0f172a; /* Slate 900 */
                    border-bottom-color: #334155;
                }
                body.dark-mode .modal-header h2 { color: #f8fafc !important; }
                body.dark-mode .settings-sidebar {
                    background: #0f172a;
                    border-right-color: #334155;
                }
                body.dark-mode .topic-card {
                    background: #1e293b;
                    border-color: #334155;
                }
                body.dark-mode .topic-card span { color: #e2e8f0 !important; }
                body.dark-mode .resource-item {
                    background: #0f172a;
                }
                body.dark-mode .resource-link { color: #e2e8f0; }
                body.dark-mode .resource-link:hover { color: #60a5fa; }
                body.dark-mode .input-modern, 
                body.dark-mode .input-modern-sm, 
                body.dark-mode .input-select {
                    background: #0f172a;
                    border-color: #334155;
                    color: white;
                }
                body.dark-mode .input-label { color: #cbd5e1; }
                body.dark-mode .empty-topics {
                    background: #0f172a;
                    border-color: #334155;
                    color: #94a3b8;
                }
                body.dark-mode .btn-manage {
                    background: #0f172a;
                    color: #e2e8f0;
                    border-color: #334155;
                }
                body.dark-mode .btn-manage:hover {
                    background: #334155;
                    color: white;
                }
                body.dark-mode .btn-secondary {
                    background: #0f172a;
                    color: #e2e8f0;
                    border-color: #334155;
                }
                body.dark-mode .btn-secondary:hover {
                    background: #334155;
                    color: white;
                }
                body.dark-mode .course-card-premium {
                    background: #1e293b; /* Smart Filters Color */
                    border-color: #334155;
                }
                body.dark-mode .course-card-title {
                    color: #f8fafc;
                }
                body.dark-mode h2, body.dark-mode h3 { color: #f8fafc !important; }

                .modal-header {
                    padding: 1.5rem; border-bottom: 1px solid #E2E8F0; display: flex;
                    justify-content: space-between; alignItems: center; background: #F8FAFC;
                }
                .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94A3B8; }
                
                .settings-sidebar {
                    width: 260px; background: #F8FAFC; padding: 1.5rem; border-right: 1px solid #E2E8F0; overflow-y: auto;
                }
                .sidebar-title {
                    text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; color: #94A3B8; margin-bottom: 1rem;
                }
                
                .topic-card {
                    background: white; border: 1px solid #E2E8F0; padding: 1rem; border-radius: 12px;
                    display: flex; flexDirection: column; gap: 0.5rem;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: box-shadow 0.2s;
                }
                .topic-card:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                
                .resource-item {
                    display: flex; justify-content: space-between; alignItems: center; fontSize: 0.85rem;
                    background: #F8FAFC; padding: 6px 10px; border-radius: 6px;
                }
                .resource-link { color: #334155; text-decoration: none; font-weight: 500; }
                .resource-link:hover { text-decoration: underline; color: #2563EB; }
                
                .fmt-badge { fontSize: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
                .fmt-video { background: #EEF2FF; color: #4F46E5; }
                .fmt-pdf { background: #FFF7ED; color: #EA580C; }
                .fmt-article { background: #ECFDF5; color: #10B981; }

                .empty-topics {
                    text-align: center; padding: 2rem; color: #94A3B8; font-style: italic; background: #F8FAFC; border-radius: 12px; border: 1px dashed #E2E8F0;
                }

                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-in { animation: scaleIn 0.2s ease-out forwards; }
            `}</style>
        </div >

    );
}

export default AdminDashboard;
