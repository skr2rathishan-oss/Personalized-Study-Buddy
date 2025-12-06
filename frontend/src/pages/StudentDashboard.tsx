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
        if (!selectedCourse || !selectedTopic) {
            alert("Please select both a course and a topic.");
            return;
        }
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
