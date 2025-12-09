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
        <div className="dashboard-layout animate-fade-in" style={{ marginTop: '1rem' }}>


            <aside className="sidebar card-surface">
                <div className="sidebar-header">
                    <div className="sidebar-icon">⚡</div>
                    <div>
                        <h3 className="sidebar-title">Discovery Filters</h3>
                        <p className="sidebar-subtitle">Customize your learning</p>
                    </div>
                </div>

                {/* Scope Selection */}
                <div className="sidebar-section">

                    <div className="search-group">
                        <label className="input-label">
                            Target Module
                        </label>
                        <select
                            className="form-select-modern"
                            value={selectedCourse || ''}
                            onChange={handleCourseChange}
                        >
                            <option value="">Select a module...</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="search-group">
                        <label className="input-label">
                            Specific Topic
                        </label>
                        <select
                            className="form-select-modern"
                            value={selectedTopic || ''}
                            onChange={handleTopicChange}
                            disabled={!selectedCourse}
                            style={{ opacity: selectedCourse ? 1 : 0.6, cursor: selectedCourse ? 'pointer' : 'not-allowed' }}
                        >
                            <option value="">{selectedCourse ? (topics.length > 0 ? "Select a topic..." : "No topics available") : "Select module first"}</option>
                            {topics.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Preferences Grid */}
                <div className="sidebar-grid">
                    <div>
                        <label className="input-label">Format</label>
                        <select
                            className="form-select-modern"

                            value={selectedFormat}
                            onChange={e => setSelectedFormat(e.target.value)}
                        >
                            <option value="">Select a module...</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="input-label">Language</label>
                        <select
                            className="form-select-modern"

                            value={selectedLanguage}
                            onChange={e => setSelectedLanguage(e.target.value)}
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
                </div>


                {/* AI Search */}
                <div className="ai-search-box">
                    <label className="ai-label">
                        <span>✨</span> AI Custom Request
                    </label>
                    <textarea
                        className="form-textarea"
                        placeholder="e.g. 'Explain recursion with simple examples'..."

                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <button

                    onClick={handleFetch}

                    className="btn-primary-gradient"
                >
                    {loading ? (
                        <>
                            <div className="spinner"></div>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span>🔍</span> Find Resources
                        </>
                    )}
                </button>
                {
                    selectedCourse && (
                        <div className="quick-search-suggestion">
                            <p>Try searching for:</p>
                            <div className="suggestion-tags">
                                <span
                                    onClick={() => {
                                        const c = courses.find(c => c.id === selectedCourse);
                                        if (c) setDescription(c.name);
                                    }}
                                    className="suggestion-tag"
                                >
                                    <span>📚</span>
                                    {courses.find(c => c.id === selectedCourse)?.name}
                                </span>
                            </div>
                        </div>
                    )
                }

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
                    </div>
                </div >

                {/* Results Section */}
                {
                    resources.length > 0 && (
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
                    )
                }
                {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>Finding the best resources for you...</p>}
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
