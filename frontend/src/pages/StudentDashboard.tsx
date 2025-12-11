import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import '../dashboard.css';
import SearchableSelect from '../components/SearchableSelect';

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
    score_breakdown?: {
        content: number;
        collab: number;
        personal: number;
        source: number;
    };
    final_score?: number;
    user_has_rated?: boolean;
    user_rating?: number;
}

const ResourceCard = ({ r, idx, getThumbnail, handleRate, setViewingResource }: any) => {
    const [showScore, setShowScore] = useState(false);

    // Draggable Logic
    const [position, setPosition] = useState({ x: 0, y: 0 }); // Relative offset
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div className="resource-card-modern" style={{ animationDelay: `${idx * 0.05}s` }}>
            {/* Thumbnail / Header Color */}
            <div
                className="card-header-visual"
                style={{
                    backgroundImage: getThumbnail(r) ? `url(${getThumbnail(r)})` : 'none',
                }}
                data-format={r.format}
            >
                {!getThumbnail(r) && (
                    <div className="header-icon">
                        {r.format === 'video' ? '📺' : (r.format === 'article' ? '📄' : '📑')}
                    </div>
                )}

                <div className="card-badges-floating">
                    <span className={`modern-badge badge-${r.format}`}>{r.format}</span>
                    <span className={`modern-badge badge-source ${r.source === 'manual' ? 'source-db' : 'source-web'}`}>
                        {r.source === 'manual' ? 'DB' : 'WEB'}
                    </span>
                </div>
            </div>

            <div className="card-body-content">
                <h4 className="card-title">{r.title}</h4>

                <div className="card-rating">
                    <span>★</span>
                    <span>{r.average_rating}</span>
                    <span className="rating-count">({r.rating_count} ratings)</span>

                    {r.score_breakdown && (
                        <div style={{ position: 'relative', marginLeft: 'auto' }}>
                            <span
                                className="ai-score-badge"
                                onClick={(e) => { e.stopPropagation(); setShowScore(!showScore); }}
                                style={{
                                    fontSize: '0.75rem', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                                    color: '#1E40AF', padding: '4px 8px', borderRadius: '6px',
                                    border: '1px solid #BFDBFE', cursor: 'pointer', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                            >
                                <span style={{ fontSize: '0.9em' }}>🤖</span> AI Score: {r.final_score}
                            </span>

                            {showScore && createPortal(
                                <>
                                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 9998, backdropFilter: 'blur(4px)', cursor: 'default' }} onClick={(e) => { e.stopPropagation(); setShowScore(false); }} />
                                    <div className="score-popup-detailed animate-scale-in" onMouseDown={handleMouseDown} onClick={(e) => e.stopPropagation()} style={{
                                        position: 'fixed',
                                        top: `calc(50% + ${position.y}px)`,
                                        left: `calc(50% + ${position.x}px)`,
                                        transform: 'translate(-50%, -50%)',
                                        background: 'white', padding: '24px', borderRadius: '16px',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                                        border: '1px solid #E2E8F0', width: '90%', maxWidth: '380px', zIndex: 9999,
                                        fontSize: '0.95rem', color: '#334155', fontFamily: 'sans-serif',
                                        cursor: isDragging ? 'grabbing' : 'grab'
                                    }}>
                                        <button onClick={(e) => { e.stopPropagation(); setShowScore(false); }} style={{
                                            position: 'absolute', right: '16px', top: '16px',
                                            background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', fontSize: '1rem'
                                        }}>✕</button>

                                        <div style={{
                                            fontWeight: 800, color: '#0F172A', marginBottom: '20px',
                                            fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px'
                                        }}>
                                            <span>🤖 AI Analysis</span>
                                        </div>

                                        <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #F1F5F9' }}>
                                            {/* Breakdown Rows */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
                                                {/* Topic Relevance - Tooltip */}
                                                <div title="Matches course syllabus & keywords" style={{ color: '#64748B', cursor: 'help', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    Topic Relevance <span style={{ fontSize: '0.8em', opacity: 0.6 }}>ⓘ</span>
                                                </div>
                                                <div style={{ fontWeight: 600 }}>{r.score_breakdown.content} <span style={{ fontSize: '0.75em', color: '#94A3B8' }}>×0.3</span></div>

                                                {/* Community Trend - Tooltip */}
                                                <div title="Popularity & ratings from peers" style={{ color: '#64748B', cursor: 'help', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    Community Trend <span style={{ fontSize: '0.8em', opacity: 0.6 }}>ⓘ</span>
                                                </div>
                                                <div style={{ fontWeight: 600 }}>{r.score_breakdown.collab} <span style={{ fontSize: '0.75em', color: '#94A3B8' }}>×2.0</span></div>

                                                {/* Your Impact - Tooltip */}
                                                <div title="Personalized boost from your history" style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                                                    Your Impact <span style={{ fontSize: '0.8em', opacity: 0.6 }}>ⓘ</span>
                                                    {r.score_breakdown.personal !== 0 && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.score_breakdown.personal > 0 ? '#10B981' : '#EF4444' }}></span>}
                                                </div>
                                                <div style={{ fontWeight: 700, color: r.score_breakdown.personal > 0 ? '#059669' : (r.score_breakdown.personal < 0 ? '#DC2626' : '#64748B') }}>
                                                    {r.score_breakdown.personal > 0 ? '+' : ''}{r.score_breakdown.personal}
                                                </div>

                                                {/* Source Quality - Tooltip */}
                                                <div title="Credibility of the resource origin" style={{ color: '#64748B', cursor: 'help', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    Source Quality <span style={{ fontSize: '0.8em', opacity: 0.6 }}>ⓘ</span>
                                                </div>
                                                <div style={{ fontWeight: 600 }}>{r.score_breakdown.source}</div>
                                            </div>
                                        </div>

                                        <div style={{ height: '8px', width: '100%', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${Math.min(Math.max((r.final_score / 15) * 100, 5), 100)}%`, // Approx scale visualization
                                                background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
                                                borderRadius: '4px',
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>

                                        {/* Visualization Toggle */}
                                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Toggle logic view (using local state would be better, but for now we can inline toggle or just append)
                                                    const logicEl = document.getElementById(`logic-${r.id}`);
                                                    if (logicEl) logicEl.style.display = logicEl.style.display === 'none' ? 'block' : 'none';
                                                }}
                                                style={{
                                                    background: 'none', border: '1px dashed #CBD5E1', padding: '6px 12px',
                                                    borderRadius: '20px', color: '#64748B', fontSize: '0.85rem', cursor: 'pointer'
                                                }}
                                            >
                                                🧠 See Calculation Logic
                                            </button>
                                        </div>

                                        {/* Hidden Logic View */}
                                        <div id={`logic-${r.id}`} style={{ display: 'none', background: '#F0F9FF', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
                                            <p style={{ fontWeight: 700, color: '#0369A1', marginBottom: '8px' }}>Scoring Formula:</p>
                                            <code style={{ display: 'block', background: 'rgba(255,255,255,0.5)', padding: '8px', borderRadius: '4px', marginBottom: '12px', color: '#0C4A6E' }}>
                                                Score = (Topic × 0.3) + (Trend × 2.0) + Impact + Quality
                                            </code>

                                            <div style={{ marginTop: '8px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span>⏱️ Time Spent Impact:</span>
                                                    <span style={{ fontWeight: 600, color: r.score_breakdown.personal > 1 ? '#10B981' : '#64748B' }}>
                                                        {r.score_breakdown.personal > 1 ? 'High Engagement' : 'Normal'}
                                                    </span>
                                                </div>
                                                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${Math.min((r.score_breakdown.personal / 5) * 100, 100)}%`,
                                                        background: '#10B981',
                                                        transition: 'width 0.5s'
                                                    }}></div>
                                                </div>
                                                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                                                    *Longer watch time boosts this score automatically even without a rating.
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <span style={{ fontWeight: 600, color: '#475569' }}>Total Score</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563EB', lineHeight: 1 }}>{r.final_score}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>out of 100 (est)</span>
                                            </div>
                                        </div>

                                        {r.score_breakdown.personal > 0 && (
                                            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: '#059669', background: '#ECFDF5', padding: '8px', borderRadius: '8px', fontWeight: 600 }}>
                                                Boosted by your rating! 🚀
                                            </div>
                                        )}
                                    </div>
                                </>,
                                document.body
                            )}
                        </div>
                    )}
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

                    {r.user_has_rated && r.user_rating > 0 ? (
                        <div style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>✓ Rated: {r.user_rating}★</span>
                        </div>
                    ) : (
                        <select
                            className="rate-dropdown"
                            onChange={(e) => handleRate(r.id, Number(e.target.value))}
                            defaultValue=""
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="" disabled>Rate...</option>
                            <option value="5">5 - Excellent</option>
                            <option value="4">4 - Very Good</option>
                            <option value="3">3 - Good</option>
                            <option value="2">2 - Fair</option>
                            <option value="1">1 - Poor</option>
                        </select>
                    )}
                </div>
            </div> {/* End card-body-content */}
        </div> /* End resource-card-modern */
    );
};

function StudentDashboard() {
    // Initialize state from sessionStorage or defaults
    const [courses, setCourses] = useState<Course[]>([]);

    // Helper to get typed session data
    const getSession = <T,>(key: string, def: T): T => {
        const stored = sessionStorage.getItem(`sd_${key}`);
        return stored ? JSON.parse(stored) : def;
    };

    const [selectedCourse, setSelectedCourse] = useState<number | null>(() => getSession('selectedCourse', null));
    const [topics, setTopics] = useState<Topic[]>(() => getSession('topics', []));
    const [selectedTopic, setSelectedTopic] = useState<number | null>(() => getSession('selectedTopic', null));
    const [resources, setResources] = useState<Resource[]>(() => getSession('resources', []));
    const [loading, setLoading] = useState(false);

    // Format Filter Logic
    const [selectedFormat, setSelectedFormat] = useState<string>(() => getSession('selectedFormat', ''));
    const [description, setDescription] = useState(() => getSession('description', ''));
    const [selectedLanguage, setSelectedLanguage] = useState(() => getSession('selectedLanguage', 'English'));
    const [agentQuery, setAgentQuery] = useState(() => getSession('agentQuery', ""));

    const [agentStatus, setAgentStatus] = useState("Idle");
    const [isAgentDetailsExpanded, setIsAgentDetailsExpanded] = useState(false);

    const [limit, setLimit] = useState(20);
    const [viewingResource, setViewingResource] = useState<Resource | null>(() => getSession('viewingResource', null));

    const [ratingSuccess, setRatingSuccess] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false); // Mobile Filter State
    const startTimeRef = useRef<number>(0);

    const handleOpenResource = (r: Resource) => {
        setViewingResource(r);
        startTimeRef.current = Date.now();
    };

    const handleCloseResource = async () => {
        if (!viewingResource) return;
        const duration = (Date.now() - startTimeRef.current) / 1000;

        // Log interaction
        try {
            await api.post('/api/log-interaction', {
                resource_id: viewingResource.id,
                type: 'view',
                meta: { duration: duration }
            });
        } catch (e) {
            console.error("Failed to log interaction", e);
        }

        setViewingResource(null);
    };

    // Persist State Effects
    useEffect(() => { sessionStorage.setItem('sd_selectedCourse', JSON.stringify(selectedCourse)); }, [selectedCourse]);
    useEffect(() => { sessionStorage.setItem('sd_topics', JSON.stringify(topics)); }, [topics]);
    useEffect(() => { sessionStorage.setItem('sd_selectedTopic', JSON.stringify(selectedTopic)); }, [selectedTopic]);
    useEffect(() => { sessionStorage.setItem('sd_resources', JSON.stringify(resources)); }, [resources]);
    useEffect(() => { sessionStorage.setItem('sd_selectedFormat', JSON.stringify(selectedFormat)); }, [selectedFormat]);
    useEffect(() => { sessionStorage.setItem('sd_description', JSON.stringify(description)); }, [description]);
    useEffect(() => { sessionStorage.setItem('sd_selectedLanguage', JSON.stringify(selectedLanguage)); }, [selectedLanguage]);
    useEffect(() => { sessionStorage.setItem('sd_agentQuery', JSON.stringify(agentQuery)); }, [agentQuery]);
    useEffect(() => { sessionStorage.setItem('sd_viewingResource', JSON.stringify(viewingResource)); }, [viewingResource]);

    const getYouTubeEmbedUrl = (url: string) => {
        try {
            let videoId = '';
            if (url.includes('youtube.com/watch?v=')) {
                videoId = url.split('v=')[1].split('&')[0];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            }
            return `https://www.youtube.com/embed/${videoId}`;
        } catch (error) {
            return url;
        }
    };

    const getThumbnail = (r: Resource) => {
        if (r.format === 'video' && (r.url.includes('youtube.com') || r.url.includes('youtu.be'))) {
            try {
                let videoId = '';
                if (r.url.includes('v=')) videoId = r.url.split('v=')[1].split('&')[0];
                else if (r.url.includes('youtu.be/')) videoId = r.url.split('youtu.be/')[1].split('?')[0];

                if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            } catch (e) { return null; }
        }
        return null;
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

    // Agent Process Simulation
    useEffect(() => {
        if (loading) {
            const steps = [
                "Analyzing requirements...",
                "Optimizing search query...",
                "Scanning knowledge base...",
                "Fetching from external sources...",
                "Ranking results by relevance..."
            ];
            let i = 0;
            setAgentStatus(steps[0]);
            const interval = setInterval(() => {
                i = (i + 1) % steps.length;
                setAgentStatus(steps[i]);
            }, 800);
            return () => clearInterval(interval);
        }
    }, [loading]);

    // Fetch when limit increases (Load More)
    useEffect(() => {
        if (selectedTopic && limit > 20) {
            handleFetch(limit);
        }
    }, [limit]);

    // Re-fetch recommendations when filters change (ONLY if resources are already showing)
    useEffect(() => {
        // Only trigger fetch if we aren't just restoring state
        // Check if resources are empty to allow initial load without auto-fetch if preferred, 
        // OR rely on user action. 
        // For now, let's keep the existing logic but safeguard against loop if state restored.
        if (selectedTopic && resources.length > 0 && limit <= 20) {
            // We can assume if resources > 0 it might be a restore or an update.
            // If manual filter change, we want to refetch. 
            // Providing we don't have a "restoring" flag, this effect might trigger on mount.
            // However, since we persist resources, re-fetching identical params is okay but maybe redundant.
            // Let's rely on standard behavior for now.
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

    const handleCourseChange = async (courseId: number) => {
        if (!courseId) {
            setSelectedCourse(null);
            setTopics([]);
            return;
        }

        setSelectedCourse(courseId);
        setSelectedTopic(null);
        // setResources([]); // Keep resources visible per user request
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
            if (res.data.results) {
                // New Format
                setResources(res.data.results);
                if (res.data.agent_query) setAgentQuery(res.data.agent_query);
            } else {
                // Fallback for old format
                setResources(res.data);
            }
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
                time_spent: Math.max((Date.now() - startTimeRef.current) / 1000, 10) // Use actual time
            });
            // Show toast instead of alert
            setRatingSuccess(true);
            setTimeout(() => setRatingSuccess(false), 3000);

            handleFetch(limit);
        } catch (err) {
            alert('Error rating resource');
        }
    };

    return (
        <div className="dashboard-container" style={{ maxWidth: '1400px', padding: '2rem', marginTop: '4rem' }}>
            <div className={`dashboard-split-layout ${resources.length > 0 ? 'results-active' : ''}`}>

                {/* LEFT PANEL: Filters */}
                <aside className="filters-panel">
                    {/* Mobile Toggle Button */}
                    <button
                        className="mobile-filter-toggle"
                        onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                    >
                        <span>⚡ Filters & Search</span>
                        <span>{mobileFiltersOpen ? '▲' : '▼'}</span>
                    </button>

                    <div className={`filters-content-wrapper ${mobileFiltersOpen ? 'open' : ''} desktop-visible`}>
                        <div className="filters-header">
                            <span className="lightning-icon">⚡</span>
                            <h3>Smart Filters</h3>
                        </div>

                        <div className="filters-body">
                            <div className="filter-group">
                                <label>Module</label>
                                <SearchableSelect
                                    options={courses.map(c => ({ value: c.id, label: `${c.code} - ${c.name}` }))}
                                    value={selectedCourse}
                                    onChange={(val) => handleCourseChange(Number(val))}
                                    placeholder="Search & Select Module..."
                                    className="form-select-modern"
                                />
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
                                    <label>Language</label>
                                    <select
                                        className="form-select-modern glassy-input"
                                        value={selectedLanguage}
                                        onChange={e => setSelectedLanguage(e.target.value)}
                                    >
                                        <option value="English">English</option>
                                        <option value="Tamil">Tamil</option>
                                        <option value="Sinhala">Sinhala</option>
                                    </select>
                                </div>
                            </div>

                            <div className="filter-group">
                                <label>Smart Search</label>
                                <textarea
                                    className="smart-search-input glassy-input"
                                    placeholder="Ask AI: 'Find best videos for exam revision...'"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            {/* Agent Process / Context Display */}
                            {/* Agent Process / Context Display - Collapsible & Fixed */}
                            {(loading || selectedCourse || agentQuery) && (
                                <div style={{ marginBottom: '0.25rem', marginTop: '-0.5rem' }}>
                                    <div
                                        onClick={() => setIsAgentDetailsExpanded(!isAgentDetailsExpanded)}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                                            marginBottom: '6px'
                                        }}
                                    >
                                        <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                                            {loading ? "Agent Process:" : (agentQuery ? "Agent Action:" : "Agent Interpretation:")}
                                        </label>
                                        <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>{isAgentDetailsExpanded ? '▼' : '▶'}</span>
                                    </div>

                                    <div className={`chip ${loading ? 'pulsing' : ''}`} style={{
                                        fontSize: '0.85rem',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        background: loading ? '#FEF3C7' : (agentQuery ? '#F0F9FF' : '#F8FAFC'),
                                        color: loading ? '#D97706' : (agentQuery ? '#0369A1' : '#334155'),
                                        borderColor: loading ? '#FDE68A' : (agentQuery ? '#E0F2FE' : '#E2E8F0'),
                                        borderWidth: '1px', borderStyle: 'solid',
                                        display: 'flex', flexDirection: 'column', gap: '4px',
                                        transition: 'all 0.3s ease',
                                        overflow: 'hidden',
                                        maxHeight: isAgentDetailsExpanded ? '200px' : '48px', // Collapsible Logic
                                        cursor: 'pointer'
                                    }} onClick={() => setIsAgentDetailsExpanded(!isAgentDetailsExpanded)}>

                                        {/* HEADER LINE (Always Visible) */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '24px' }}>
                                            {loading ? (
                                                <>
                                                    <span className="spinner-small"></span>
                                                    <span style={{ fontWeight: 600 }}>{agentStatus}</span>
                                                </>
                                            ) : (
                                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                    {agentQuery ? "Search Executed ✅" : "Ready to Search ✨"}
                                                </span>
                                            )}
                                        </div>

                                        {/* DETAILS (Hidden when collapsed) */}
                                        <div style={{ opacity: isAgentDetailsExpanded ? 1 : 0, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {!loading && agentQuery && (
                                                <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'rgba(255,255,255,0.5)', padding: '4px', borderRadius: '4px', marginTop: '4px' }}>
                                                    "{agentQuery}"
                                                </div>
                                            )}

                                            {!loading && !agentQuery && selectedCourse && (
                                                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                                                    {(() => {
                                                        const c = courses.find(c => c.id === selectedCourse);
                                                        const t = topics.find(t => t.id === selectedTopic);
                                                        const lang = `in ${selectedLanguage}`;
                                                        const smart = description ? `+ "${description}"` : '';
                                                        return `Targeting: 📚 ${c?.code} ${t ? `> ${t.name}` : ''} ${smart} ${lang}`;
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button className="btn-find-resources" onClick={() => { handleFetch(20); setMobileFiltersOpen(false); /* Close on search */ }}>
                                {loading ? 'Searching...' : 'Find Resources 🚀'}
                            </button>
                        </div>  {/* End filters-body */}
                    </div> {/* End filters-content-wrapper */}
                </aside>

                {/* RIGHT PANEL: Content */}
                <main className="content-panel">
                    <div className="welcome-header">
                        <h1 className="gradient-text">Welcome back, {localStorage.getItem('username') || 'Student'}!</h1>
                        <div className="user-details-subtitle" style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {[localStorage.getItem('university'), localStorage.getItem('university_course')].filter(Boolean).join(' • ')}
                        </div>
                        <p className="subtitle">Ready to learn something new today?</p>
                    </div>

                    <div className="content-body">
                        {resources.length === 0 && (
                            <div className="stats-stack">
                                <div className="stat-card-wide">
                                    <div className="stat-icon-wrapper" style={{ background: 'white', color: '#4F46E5' }}>
                                        <img src="https://cdn-icons-png.flaticon.com/512/2232/2232688.png" alt="Modules" width="24" />
                                    </div>
                                    <div className="stat-info">
                                        <h3>4 Modules</h3>
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
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    marginBottom: '1rem',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 5
                                }}>
                                    <button
                                        onClick={() => {
                                            // 1. Clear Resources
                                            setResources([]);
                                            sessionStorage.setItem('sd_resources', JSON.stringify([]));

                                            // 2. Refresh/Reset Module Details (Smart Filters)
                                            // Reset Module (Course)
                                            setSelectedCourse(null);
                                            sessionStorage.setItem('sd_selectedCourse', 'null');

                                            setTopics([]);
                                            sessionStorage.setItem('sd_topics', JSON.stringify([]));

                                            // Reset Filters
                                            setSelectedTopic(null);
                                            sessionStorage.setItem('sd_selectedTopic', 'null');

                                            setSelectedFormat('');
                                            sessionStorage.setItem('sd_selectedFormat', JSON.stringify(''));

                                            setDescription('');
                                            sessionStorage.setItem('sd_description', JSON.stringify(''));

                                            setAgentQuery('');
                                            sessionStorage.setItem('sd_agentQuery', JSON.stringify(''));

                                            // Optional: Reset language? Keeping it might be better, but "refresh" usually implies full reset.
                                            // setSelectedLanguage('English'); 
                                        }}
                                        title="Close & Reset Filters"
                                        style={{
                                            background: 'var(--dash-card-bg)', // Adapts to theme
                                            border: '1px solid var(--dash-border)',
                                            color: 'var(--dash-text-muted)',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1rem',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = '#EF4444';
                                            e.currentTarget.style.borderColor = '#EF4444';
                                            e.currentTarget.style.transform = 'rotate(90deg)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'var(--dash-text-muted)';
                                            e.currentTarget.style.borderColor = 'var(--dash-border)';
                                            e.currentTarget.style.transform = 'rotate(0deg)';
                                        }}
                                    >
                                        ✖
                                    </button>
                                </div>
                                <div className="resource-grid-modern">
                                    {resources.map((r, idx) => (
                                        <ResourceCard
                                            key={r.id}
                                            r={r}
                                            idx={idx}
                                            getThumbnail={getThumbnail}
                                            handleRate={handleRate}
                                            setViewingResource={handleOpenResource}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>Finding the best resources for you...</p>}

                        {/* Resource Modal */}
                        {viewingResource && (
                            <div className='modal-overlay animate-fade-in' style={{
                                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                                background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', paddingBottom: '20px'
                            }} onClick={handleCloseResource}>
                                <div className='resource-modal-content' style={{
                                    width: '90%', height: '85%', marginTop: '80px'
                                }} onClick={(e) => e.stopPropagation()}>
                                    <div className="resource-modal-header">
                                        <h3 className="resource-modal-title">
                                            {viewingResource.title}
                                        </h3>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <a href={viewingResource.url} target="_blank" rel="noopener noreferrer" className='btn-secondary'>
                                                Open in New Tab ↗
                                            </a>
                                            <button onClick={handleCloseResource} className="btn-close-modal">
                                                &times;
                                            </button>
                                        </div>
                                    </div>

                                    <div className="resource-video-container">
                                        {viewingResource.format === 'video' ? (
                                            <iframe
                                                src={getYouTubeEmbedUrl(viewingResource.url)}
                                                width="100%"
                                                height="100%"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                style={{ border: 'none', borderRadius: '8px' }}
                                            />
                                        ) : (
                                            <iframe
                                                src={viewingResource.url}
                                                width="100%"
                                                height="100%"
                                                style={{ border: 'none', background: 'white', borderRadius: '8px' }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rating Success Toast */}
                        {ratingSuccess && (
                            <div style={{
                                position: 'fixed',
                                bottom: '30px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#10B981',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '50px',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                zIndex: 2000,
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                animation: 'slideUp 0.3s ease-out forwards'
                            }}>
                                <span>✅</span>
                                <span>Rated Successfully!</span>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-in { animation: scaleIn 0.2s ease-out forwards; }

                @keyframes slideUp {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </div>
    );
}
export default StudentDashboard;
