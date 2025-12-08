import { useEffect, useState } from 'react';
import api from '../api';

interface Course {
    id: number;
    name: string;
    code: string;
}

interface Topic {
    id: number;
    name: string;
}

interface Resource {
    id: number;
    title: string;
    url: string;
    format: string;
    average_rating: number;
    rating_count: number;
    source: string;
}

function StudentDashboard() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(false);

    // Format Filter Logic
    const [selectedFormat, setSelectedFormat] = useState<string>('');
    const [description, setDescription] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('English');

    // Student Details
    const [studentInfo, setStudentInfo] = useState<{ uni: string, course: string } | null>(null);

    useEffect(() => {
        // Fetch Profile Data
        api.get('/auth/profile').then(res => {
            setStudentInfo({
                uni: res.data.university || 'University Not Set',
                course: res.data.university_course || 'Course Not Set'
            });
        }).catch(console.error);
    }, []);

    useEffect(() => {
        fetchCourses();
    }, []);

    // Re-fetch recommendations when filters change (ONLY if resources are already showing)
    useEffect(() => {
        if (selectedTopic && resources.length > 0) {
            // Optional: You could auto-fetch here
        }
    }, [selectedFormat]);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCourseChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const courseId = Number(e.target.value);
        if (!courseId) {
            setSelectedCourse(null);
            setTopics([]);
            return;
        }

        setSelectedCourse(courseId);
        setSelectedTopic(null);
        setResources([]);
        try {
            const res = await api.get(`/courses/${courseId}/topics`);
            setTopics(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const topicId = Number(e.target.value);
        setSelectedTopic(topicId || null);
    };

    const handleFetch = async () => {
        if (!selectedCourse && !description.trim()) {
            alert("Please select a module or enter a search query.");
            return;
        }

        setLoading(true);
        // Clear resources to show fresh state
        setResources([]);

        try {
            const payload = {
                course_id: selectedCourse,
                topic_id: selectedTopic,
                search_query: description,
                language: selectedLanguage,
                format: selectedFormat
            };

            // Stage 1: Fast (DB Only)
            const resFast = await api.post('/recommend', { ...payload, execution_mode: 'fast' });
            setResources(resFast.data);

            // Stage 2: Agent (Background Fetch for new items)
            // We force fetch new items to satisfy "dynamic showing"
            const resAgent = await api.post('/recommend', { ...payload, execution_mode: 'agent' });

            const newItems = resAgent.data;
            if (newItems.length > 0) {
                // Append new items to existing list, avoiding duplicates
                setResources(prev => {
                    const existingUrls = new Set(prev.map(r => r.url));
                    const uniqueNew = newItems.filter((r: Resource) => !existingUrls.has(r.url));
                    return [...prev, ...uniqueNew];
                });
            }

        } catch (err) {
            console.error(err);
            // Don't alert if first stage worked but second failed
        } finally {
            setLoading(false);
        }
    };

    const handleRate = async (resourceId: number, score: number) => {
        try {
            await api.post('/rate', {
                resource_id: resourceId,
                score: score,
                time_spent: 30 // Mock
            });
            alert('Rated successfully!');
        } catch (err) {
            alert('Error rating resource');
        }
    };

    return (
        <div className="dashboard-layout animate-fade-in" style={{ marginTop: '1rem' }}>

            <aside className="sidebar" style={{
                background: 'white',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ background: '#EEF2FF', padding: '8px', borderRadius: '10px', color: '#4F46E5', fontSize: '1.1rem' }}>⚡</div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 700 }}>Discovery Filters</h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Customize your learning</p>
                    </div>
                </div>

                {/* Scope Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div className="search-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', display: 'block', letterSpacing: '0.5px' }}>
                            Target Module
                        </label>
                        <select
                            className="form-select-modern"
                            value={selectedCourse || ''}
                            onChange={handleCourseChange}
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#334155', outline: 'none', transition: 'box-shadow 0.2s' }}
                        >
                            <option value="">Select a module...</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="search-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', marginBottom: '6px', display: 'block', letterSpacing: '0.5px' }}>
                            Specific Topic
                        </label>
                        <select
                            className="form-select-modern"
                            value={selectedTopic || ''}
                            onChange={handleTopicChange}
                            disabled={!selectedCourse}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.9rem',
                                color: '#334155',
                                background: selectedCourse ? 'white' : '#f8fafc',
                                opacity: selectedCourse ? 1 : 0.6,
                                cursor: selectedCourse ? 'pointer' : 'not-allowed'
                            }}
                        >
                            <option value="">{selectedCourse ? (topics.length > 0 ? "Select a topic..." : "No topics available") : "Select module first"}</option>
                            {topics.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Preferences Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Format</label>
                        <select
                            value={selectedFormat}
                            onChange={e => setSelectedFormat(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}
                        >
                            <option value="">All</option>
                            <option value="video">Video</option>
                            <option value="article">Article</option>
                            <option value="pdf">PDF</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Language</label>
                        <select
                            value={selectedLanguage}
                            onChange={e => setSelectedLanguage(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#334155' }}
                        >
                            <option value="English">English</option>
                            <option value="Tamil">Tamil</option>
                            <option value="Sinhala">Sinhala</option>
                        </select>
                    </div>
                </div>

                {/* AI Search */}
                <div className="search-group" style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4F46E5', fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px' }}>
                        <span>✨</span> AI Custom Request
                    </label>
                    <textarea
                        placeholder="e.g. 'Explain recursion with simple examples'..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            minHeight: '80px',
                            fontSize: '0.9rem',
                            resize: 'vertical',
                            background: 'white',
                            fontFamily: 'inherit',
                            color: '#334155'
                        }}
                    />
                </div>

                {/* Action Button */}
                <button
                    onClick={handleFetch}
                    style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        color: 'white',
                        padding: '14px',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '1rem',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                        transition: 'transform 0.1s, box-shadow 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 15px rgba(37, 99, 235, 0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)'; }}
                >
                    {loading ? (
                        <>
                            <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            <span style={{ fontSize: '0.95rem' }}>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span>🔍</span> Find Resources
                        </>
                    )}
                </button>
{selectedCourse && (
    <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
        <p style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Try searching for:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <span
                onClick={() => {
                    const c = courses.find(c => c.id === selectedCourse);
                    if (c) setDescription(c.name);
                }}
                style={{
                    background: '#f1f5f9',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: '1px solid #e2e8f0',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
            >
                <span>📚</span>
                {courses.find(c => c.id === selectedCourse)?.name}
            </span>
        </div>
    </div>
)}

<style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

            </aside>

            {/* Main Content: Stats & Results */}
            <main className="main-content">

                {/* Hero / Stats Section */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <h1 className="section-title" style={{ fontSize: '2rem', marginBottom: '1rem', marginTop: 0, background: 'linear-gradient(90deg, #4F46E5, #9333EA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Welcome back, {localStorage.getItem('username') || 'Student'}!
                    </h1>
                    {studentInfo && (
                        <div className="animate-slide-up" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#4F46E5', marginBottom: '1rem', background: '#EEF2FF', display: 'inline-block', padding: '6px 16px', borderRadius: '20px', border: '1px solid #E0E7FF' }}>
                            🎓 {studentInfo.uni} <span style={{ margin: '0 8px', color: '#CBD5E1' }}>|</span> 📚 {studentInfo.course}
                        </div>
                    )}
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'block' }}>
                        Ready to learn something new today?
                    </p>

                    <div className="dashboard-stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>📚</div>
                            <div>
                                <h4>4 Courses</h4>
                                <span className="stat-label">Enrolled</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>⏱️</div>
                            <div>
                                <h4>12.5 Hrs</h4>
                                <span className="stat-label">Study Time</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>🔥</div>
                            <div>
                                <h4>3 Day</h4>
                                <span className="stat-label">Streak</span>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>⭐</div>
                            <div>
                                <h4>150 pts</h4>
                                <span className="stat-label">Learner Score</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                {resources.length > 0 && (
                    <div className="animate-fade-in">
                        <h3 className="section-title" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '2rem' }}>
                            Recommended Resources
                        </h3>

                        <div className="resource-grid-modern">
                            {resources.map((r, idx) => (
                                <div key={r.id} className="resource-card-modern" style={{ animationDelay: `${idx * 0.05}s` }}>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <span className={`modern-badge badge-${r.format}`}>{r.format}</span>
                                        <span className={`modern-badge badge-source ${r.source === 'manual' ? 'source-db' : 'source-web'}`}>
                                            {r.source === 'manual' ? 'database' : 'internet'}
                                        </span>
                                    </div>
                                    <h4 className="card-title">{r.title}</h4>

                                    <div className="card-rating">
                                        <span>★</span>
                                        <span>{r.average_rating}</span>
                                        <span className="rating-count">({r.rating_count} ratings)</span>
                                    </div>

                                    <div className="card-footer">
                                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn-open-resource">
                                            Open Resource
                                        </a>

                                        <select
                                            className="rate-dropdown"
                                            onChange={(e) => handleRate(r.id, Number(e.target.value))}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Rate...</option>
                                            <option value="5">5 - Excellent</option>
                                            <option value="4">4 - Very Good</option>
                                            <option value="3">3 - Good</option>
                                            <option value="2">2 - Fair</option>
                                            <option value="1">1 - Poor</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>Finding the best resources for you...</p>}
            </main>
        </div>
    );
}
export default StudentDashboard;
