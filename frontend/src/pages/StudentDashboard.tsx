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

                        <button className="btn-find-resources" onClick={handleFetch}>
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
                            <div className="animate-fade-in" style={{ marginTop: '0' }}>
                                <h3 className="section-title">Recommended Resources</h3>
                                <div className="resource-list">
                                    {resources.map((r, idx) => (
                                        <div key={r.id} className="resource-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                                            <div className="res-icon">
                                                {r.format === 'video' ? '📺' : r.format === 'pdf' ? '📄' : '🔗'}
                                            </div>
                                            <div className="res-content">
                                                <h4>{r.title}</h4>
                                                <div className="res-meta">
                                                    <span className={`badge badge-${r.format}`}>{r.format}</span>
                                                    <span className="rating">★ {r.average_rating}</span>
                                                </div>
                                            </div>
                                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn-icon">
                                                ↗
                                            </a>
                                        </div>
                                    ))}
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
