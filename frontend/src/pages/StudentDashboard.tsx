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
    const formats = ['video', 'article', 'pdf'];

    useEffect(() => {
        fetchCourses();
    }, []);

    // Re-fetch recommendations when filters change (and topic is selected)
    useEffect(() => {
        if (selectedTopic) {
            fetchRecommendations();
        }
    }, [selectedTopic, selectedFormat]);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCourseSelect = async (courseId: number) => {
        setSelectedCourse(courseId);
        setSelectedTopic(null);
        setSelectedFormat(''); // Reset format on course change
        setResources([]);
        try {
            const res = await api.get(`/courses/${courseId}/topics`);
            setTopics(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleTopicSelect = (topicId: number) => {
        setSelectedTopic(topicId);
        // The useEffect above will trigger the fetch
    };

    const fetchRecommendations = async () => {
        if (!selectedTopic) return;
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
                time_spent: 30 // Mock time spent
            });
            alert('Rated successfully!');
        } catch (err) {
            alert('Error rating resource');
        }
    };

    return (
        <div className="dashboard-container animate-fade-in">
            <h1 className="section-title">Student Dashboard</h1>

            {/* Step 1: Course Selection */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h3 className="form-label" style={{ fontSize: '1.1rem' }}>1. Select Course</h3>
                <div className="selection-grid">
                    {courses.map(c => (
                        <div
                            key={c.id}
                            onClick={() => handleCourseSelect(c.id)}
                            className={`selection-card ${selectedCourse === c.id ? 'active' : ''}`}
                        >
                            {c.name} <span style={{ opacity: 0.8, fontSize: '0.9em' }}>({c.code})</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 2: Topic Selection */}
            {selectedCourse && (
                <div style={{ marginBottom: '2.5rem' }} className="animate-fade-in">
                    <h3 className="form-label" style={{ fontSize: '1.1rem' }}>2. Select Topic</h3>
                    <div className="selection-grid">
                        {topics.map(t => (
                            <div
                                key={t.id}
                                onClick={() => handleTopicSelect(t.id)}
                                className={`selection-card ${selectedTopic === t.id ? 'active' : ''}`}
                            >
                                {t.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Recommendations with Format Filter */}
            {selectedTopic && (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 className="section-title" style={{ marginBottom: 0 }}>Recommended Documents</h3>

                        {/* Format Filter Chips */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setSelectedFormat('')}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    border: '1px solid var(--border-color)',
                                    background: selectedFormat === '' ? 'var(--primary)' : 'white',
                                    color: selectedFormat === '' ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                All
                            </button>
                            {formats.map(f => (
                                <button
                                    key={f}
                                    onClick={() => setSelectedFormat(f)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        border: '1px solid var(--border-color)',
                                        background: selectedFormat === f ? 'var(--primary)' : 'white',
                                        color: selectedFormat === f ? 'white' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        textTransform: 'capitalize',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? <p>Loading resources...</p> : (
                        <div className="resources-grid">
                            {resources.map((r, idx) => (
                                <div key={r.id} className="resource-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                                    <span className={`resource-badge`}>{r.format}</span>
                                    <h4 className="resource-title">{r.title}</h4>
                                    <div className="resource-meta">
                                        <span className="star-rating">★ {r.average_rating}</span>
                                        <span>({r.rating_count} ratings)</span>
                                    </div>

                                    <div className="resource-footer">
                                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn-open">View Document &rarr;</a>

                                        <div className="rating-actions">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    onClick={() => handleRate(r.id, star)}
                                                    className="btn-rate"
                                                    title={`Rate ${star} stars`}
                                                >
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {resources.length === 0 && !loading && (
                        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                            <p>No documents found for this selection.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default StudentDashboard;
