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
                            <option value="">All</option>
                            <option value="video">Video</option>
                            <option value="article">Article</option>
                            <option value="pdf">PDF</option>
                        </select>
                    </div>
                    <div>
                        <label className="input-label">Language</label>
                        <select
                            className="form-select-modern"
                            value={selectedLanguage}
                            onChange={e => setSelectedLanguage(e.target.value)}
                        >
                            <option value="English">English</option>
                            <option value="Tamil">Tamil</option>
                            <option value="Sinhala">Sinhala</option>
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

                {/* Action Button */}
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
                {selectedCourse && (
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
                )}

                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

            </aside>

            {/* Main Content: Stats & Results */}
            <main className="main-content">

                {/* Hero / Stats Section */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <h1 className="section-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', marginTop: 0, background: 'linear-gradient(90deg, #4F46E5, #9333EA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
                        Welcome back, {localStorage.getItem('username') || 'Student'}!
                    </h1>
                    {studentInfo && (
                        <div className="animate-slide-up" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#4F46E5', marginBottom: '0.5rem', background: '#EEF2FF', display: 'inline-block', padding: '4px 12px', borderRadius: '20px' }}>
                            🎓 {studentInfo.uni} <span style={{ margin: '0 8px', color: '#CBD5E1' }}>|</span> 📚 {studentInfo.course}
                        </div>
                    )}
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
