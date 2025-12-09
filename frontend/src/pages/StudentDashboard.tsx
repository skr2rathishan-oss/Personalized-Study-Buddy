import { useEffect, useState } from 'react';
import api from '../api';
import '../dashboard.css';

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
        <div className="dashboard-container" style={{ maxWidth: '1400px', padding: '2rem' }}>
            <div className={`dashboard-split-layout ${resources.length > 0 ? 'results-active' : ''}`}>

            {/* LEFT PANEL: Filters */}
            <aside className="filters-panel">
                <div className="filters-header">
                    <span className="lightning-icon">⚡</span>
                    <h3>Smart Filters</h3>
                </div>

                <div className="filters-body">
                    <div className="filter-group">
                        <label>Course</label>
                        <select
                            className="form-select-modern glassy-input"
                            value={selectedCourse || ''}
                            onChange={handleCourseChange}
                        >
                            <option value="">Select a module...</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Topic</label>
                        <select
                            className="form-select-modern glassy-input"
                            value={selectedTopic || ''}
                            onChange={handleTopicChange}
                            disabled={!selectedCourse}
                        >
                            <option value="">{selectedCourse ? (topics.length > 0 ? "Select a topic..." : "No topics available") : "Select module first"}</option>
                            {topics.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-row">
                        <div className="filter-group">
                            <label>Format</label>
                            <select
                                className="form-select-modern glassy-input"
                                value={selectedFormat}
                                onChange={e => setSelectedFormat(e.target.value)}
                            >
                                <option value="">Any</option>
                                <option value="video">Video</option>
                                <option value="article">Article</option>
                                <option value="pdf">PDF</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Lang</label>
                            <select
                                className="form-select-modern glassy-input"
                                value={selectedLanguage}
                                onChange={e => setSelectedLanguage(e.target.value)}
                            >
                                <option value="English">EN</option>
                                <option value="Tamil">TA</option>
                                <option value="Sinhala">SI</option>
                            </select>
                        </div>
                    </div>

                    <div className="filter-group">
                        <label>Smart Search</label>
                        <textarea
                            className="smart-search-input glassy-input"
                            placeholder="Tell me specifically what you want to learn..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <button className="btn-find-resources" onClick={() => handleFetch(20)}>
                        {loading ? 'Searching...' : 'Find Resources 🚀'}
                    </button>

                    {selectedCourse && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Try searching for:</label>
                            <div className="chip" onClick={() => {
                                const c = courses.find(c => c.id === selectedCourse);
                                if (c) setDescription(c.name);
                            }}>
                                {courses.find(c => c.id === selectedCourse)?.name}
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* RIGHT PANEL: Content */}
            <main className="content-panel">
                <div className="welcome-header">
                    <h1 className="gradient-text">Welcome back, {localStorage.getItem('username') || 'Student'}!</h1>
                    <p className="subtitle">Ready to learn something new today?</p>
                </div>

                <div className="content-body">
                    {resources.length === 0 && (
                        <div className="stats-stack">
                            <div className="stat-card-wide">
                                <div className="stat-icon-wrapper" style={{ background: 'white', color: '#4F46E5' }}>
                                    <img src="https://cdn-icons-png.flaticon.com/512/2232/2232688.png" alt="Courses" width="24" />
                                </div>
                                <div className="stat-info">
                                    <h3>4 Courses</h3>
                                    <span>Enrolled</span>
                                </div>
                            </div>
                            <div className="stat-card-wide">
                                <div className="stat-icon-wrapper" style={{ background: 'white', color: '#EC4899' }}>
                                    ⏱️
                                </div>
                                <div className="stat-info">
                                    <h3>12.5 Hrs</h3>
                                    <span>Study Time</span>
                                </div>
                            </div>
                            <div className="stat-card-wide">
                                <div className="stat-icon-wrapper" style={{ background: 'white', color: '#F59E0B' }}>
                                    🔥
                                </div>
                                <div className="stat-info">
                                    <h3>3 Day</h3>
                                    <span>Streak</span>
                                </div>
                            </div>
                            <div className="stat-card-wide">
                                <div className="stat-icon-wrapper" style={{ background: 'white', color: '#10B981' }}>
                                    ⭐
                                </div>
                                <div className="stat-info">
                                    <h3>150 pts</h3>
                                    <span>Learner Score</span>
                                </div>
                            </div>
                        </div>
                    )}

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
                </div>
            </main>

            <footer className="dashboard-footer">
                <span>© 2025 Personalized Study Buddy. All rights reserved.</span>
                <div className="footer-links">
                    <a href="#" className="footer-link">help@studybuddy.com</a>
                    <a href="#" className="footer-link">@studybuddy_app</a>
                    <a href="#" className="footer-link">Privacy & Terms</a>
                </div>
            </footer>
            </div>
        </div>
    );
}
export default StudentDashboard;
