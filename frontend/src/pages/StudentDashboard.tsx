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

    const [limit, setLimit] = useState(20);
    const [viewingResource, setViewingResource] = useState<Resource | null>(null);

    const getYouTubeEmbedUrl = (url: string) => {
        try {
            let videoId = '';
            if (url.includes('youtube.com/watch?v=')) {
                videoId = url.split('v=')[1].split('&')[0];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1];
            }
            return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
        } catch (e) {
            return url;
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 50) {
                if (!loading && resources.length >= limit) {
                    setLimit(prev => prev + 20);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, resources, limit]);

    // Fetch when limit increases (Load More)
    useEffect(() => {
        if (selectedTopic && limit > 20) {
            handleFetch(limit);
        }
    }, [limit]);

    // Re-fetch recommendations when filters change (ONLY if resources are already showing)
    useEffect(() => {
        setLimit(20); // Reset limit
        if (selectedTopic && resources.length > 0) {
            handleFetch(20); // Fetch with reset limit
        }
    }, [selectedFormat, selectedLanguage]);

    const fetchCourses = async () => {
        try {
            console.log("Fetching courses...");
            const res = await api.get('/courses');
            console.log("Courses fetched:", res.data);
            setCourses(res.data);
        } catch (err) {
            console.error(err);
            // alert("Failed to load courses. Please Login again."); // Optional, but helps debug
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
        setLimit(20);
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
        setLimit(20);
    };

    const handleFetch = async (currentLimit = 20) => {
        if (!selectedCourse) {
            alert("Please select a course.");
            return;
        }
        // Proceed even if topic is not selected (Course-wide recommendations)
        setLoading(true);
        try {
            const res = await api.post('/recommend', {
                course_id: selectedCourse,
                topic_id: selectedTopic,
                format: selectedFormat || null,
                search_query: description,
                language: selectedLanguage,
                limit: currentLimit
            });
            setResources(res.data);
        } catch (err) {
            console.error(err);
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

            {/* Left Sidebar: Filters & Search */}
            <aside className="sidebar">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', paddingBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', width: '100%' }}>
                    <span style={{ fontSize: '2rem' }}>⚡</span>
                    <h3 className="sidebar-title" style={{
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        textTransform: 'none',
                        fontSize: '1.75rem',
                        fontWeight: '800',
                        lineHeight: '1.2',
                        background: 'linear-gradient(90deg, #f97316, #ef4444)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: 'inline-block'
                    }}>
                        Smart Filters
                    </h3>
                </div>

                <div className="search-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                        <span>📚</span> Course
                    </label>
                    <select
                        className="form-select"
                        value={selectedCourse || ''}
                        onChange={handleCourseChange}
                    >
                        <option value="">Select a course...</option>
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.code} - {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="search-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                        <span>🏷️</span> Topic
                    </label>
                    <select
                        className="form-select"
                        value={selectedTopic || ''}
                        onChange={handleTopicChange}
                        disabled={!selectedCourse}
                    >
                        <option value="">{selectedCourse ? (topics.length > 0 ? "Select a topic..." : "No topics available") : "Select course first"}</option>
                        {topics.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="search-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                            <span>📄</span> Format
                        </label>
                        <select
                            className="form-select"
                            value={selectedFormat}
                            onChange={e => setSelectedFormat(e.target.value)}
                        >
                            <option value="">Any</option>
                            <option value="video">Video</option>
                            <option value="article">Article</option>
                            <option value="pdf">PDF</option>
                        </select>
                    </div>

                    <div className="search-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                            <span>🌐</span> Lang
                        </label>
                        <select
                            className="form-select"
                            value={selectedLanguage}
                            onChange={e => setSelectedLanguage(e.target.value)}
                        >
                            <option value="English">EN</option>
                            <option value="Tamil">TA</option>
                            <option value="Sinhala">SI</option>
                        </select>
                    </div>
                </div>

                <div className="search-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                        <span>🔍</span> Smart Search
                    </label>
                    <textarea
                        className="form-input"
                        placeholder="Tell me specifically what you want to learn..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <button
                    className="btn-search"
                    onClick={() => handleFetch(20)}
                    style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                        color: 'white',
                        padding: '12px',
                        borderRadius: '10px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
                        cursor: 'pointer',
                        border: 'none',
                        transition: 'transform 0.1s'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            Finding...
                        </span>
                    ) : 'Find Resources 🚀'}
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
                    <h1 className="section-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', marginTop: 0, background: 'linear-gradient(90deg, #4F46E5, #9333EA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
                        Welcome back, Student!
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
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
                {/* Results Section */}
                {resources.length > 0 && (
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
                                    <button
                                        className="btn-open-resource"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setViewingResource(r);
                                        }}
                                        style={{ textDecoration: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                                    >
                                        Open Resource
                                    </button>

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
                )}
                {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>Finding the best resources for you...</p>}

                {/* Resource Modal */}
                {viewingResource && (
                    <div className='modal-overlay animate-fade-in' style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div className='modal-content' style={{
                            background: 'white', width: '90%', height: '90%', borderRadius: '12px',
                            display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>
                                    {viewingResource.title}
                                </h3>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <a href={viewingResource.url} target="_blank" rel="noopener noreferrer" className='btn-secondary' style={{ padding: '6px 12px', textDecoration: 'none', fontSize: '0.9rem' }}>
                                        Open in New Tab ↗
                                    </a>
                                    <button onClick={() => setViewingResource(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
                                        &times;
                                    </button>
                                </div>
                            </div>

                            <div style={{ flex: 1, background: '#000' }}>
                                <iframe
                                    src={getYouTubeEmbedUrl(viewingResource.url)}
                                    width="100%"
                                    height="100%"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{ border: 'none' }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
export default StudentDashboard;
