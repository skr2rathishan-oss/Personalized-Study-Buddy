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

    useEffect(() => {
        fetchCourses();
    }, []);

    // Re-fetch recommendations when filters change (ONLY if resources are already showing)
    useEffect(() => {
        if (selectedTopic && resources.length > 0) {
            // Optional: You could auto-fetch here, but image implies manual button click/flow
            // For now, let's keep it manual or rigorous on the button
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
                format: selectedFormat || null
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
        <div className="dashboard-container animate-fade-in" style={{ marginTop: '2rem' }}>
            {/* 1. Welcome & Stats Hero */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 className="section-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
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

            <style>{`
                .dashboard-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                }
                .stat-card {
                    background: var(--surface-color);
                    padding: 1.25rem;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    transition: transform 0.2s;
                }
                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                }
                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }
                .stat-card h4 {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--text-main);
                }
                .stat-label {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                }
            `}</style>


            {/* 2. Horizontal Search Bar */}
            <div className="search-bar-container">
                <div className="search-group">
                    <label>Select Course</label>
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
                    <label>Select Topic</label>
                    <select
                        className="form-select"
                        value={selectedTopic || ''}
                        onChange={handleTopicChange}
                        disabled={!selectedCourse}
                    >
                        <option value="">{selectedCourse ? "Select a topic..." : "Select course first"}</option>
                        {topics.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                <div className="search-group">
                    <label>Preferred Format</label>
                    <select
                        className="form-select"
                        value={selectedFormat}
                        onChange={e => setSelectedFormat(e.target.value)}
                    >
                        <option value="">Any Format</option>
                        <option value="video">Video</option>
                        <option value="article">Article</option>
                        <option value="pdf">PDF</option>
                    </select>
                </div>

                <button className="btn-search" onClick={handleFetch}>
                    Get Recommendations
                </button>
            </div>

            {/* 3. Results Section */}
            {resources.length > 0 && (
                <div className="animate-fade-in">
                    <h3 className="section-title">Recommended Resources</h3>

                    <div className="resource-grid-modern">
                        {resources.map((r, idx) => (
                            <div key={r.id} className="resource-card-modern" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <span className={`modern-badge badge-${r.format}`}>{r.format}</span>
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

            {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Finding the best resources for you...</p>}
        </div>
    );
}

export default StudentDashboard;
