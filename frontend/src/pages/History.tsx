import { useState, useEffect } from 'react';
import api from '../api';

interface HistoryItem {
    id: number;
    title: string;
    date: string;
    type: string;
    category: string;
    url: string;
}

function History() {
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/api/history');
                setHistoryItems(res.data);
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const handleDelete = (id: number) => {
        // Optimistic update - in real app would call API to delete log
        setHistoryItems(historyItems.filter(item => item.id !== id));
    };

    const handleClearAll = () => {
        if (window.confirm("Are you sure you want to clear your entire history?")) {
            setHistoryItems([]);
            // TODO: Call API to clear history
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return '▶️';
            case 'pdf': return '📄';
            case 'article': return '📰';
            default: return '📝';
        }
    };

    const handleView = (url: string) => {
        window.open(url, '_blank');
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading history...</div>;
    }

    return (
        <div className="dashboard-container animate-fade-in" style={{ marginTop: '2rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '1rem'
            }}>
                <div>
                    <h1 className="section-title" style={{ marginBottom: '0.2rem' }}>Learning History</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Track your recent study materials and progress.
                    </p>
                </div>

                {historyItems.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="btn-clear"
                    >
                        Clear All History
                    </button>
                )}
            </div>

            {/* Grid Layout */}
            {historyItems.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--surface-color)',
                    borderRadius: '16px',
                    border: '1px dashed var(--border-light)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📚</div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>No History Yet</h3>
                    <p>Start learning to see your activity here!</p>
                </div>
            ) : (
                <div className="history-grid">
                    {historyItems.map(item => (
                        <div key={item.id} className="history-card" onClick={() => handleView(item.url)} style={{ cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className={`card-icon type-${item.type}`}>
                                    {getTypeIcon(item.type)}
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <span className="card-category">{item.category}</span>
                                <h3 className="card-title">{item.title}</h3>
                                <p className="card-date">{item.date}</p>
                            </div>

                            <div className="card-actions">
                                <button className="btn-view" onClick={(e) => {
                                    e.stopPropagation();
                                    handleView(item.url);
                                }}>Resume</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .btn-clear {
                    background: transparent;
                    border: 1px solid #ef4444;
                    color: #ef4444;
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-clear:hover {
                    background: #fee2e2;
                }

                .history-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                }

                .history-card {
                    background: var(--surface-color);
                    border: 1px solid var(--border-light);
                    border-radius: 16px;
                    padding: 1.5rem;
                    position: relative;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    box-shadow: var(--shadow-sm);
                }

                .history-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-md);
                    border-color: var(--primary);
                }

                .card-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }
                .type-video { background: #e0e7ff; color: #4338ca; }
                .type-article { background: #dcfce7; color: #166534; }
                .type-pdf { background: #fee2e2; color: #991b1b; }

                .card-category {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-secondary);
                    font-weight: 600;
                    display: block;
                    margin-bottom: 0.4rem;
                }

                .card-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--text-main);
                    margin: 0 0 0.5rem 0;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .card-date {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin: 0;
                }

                .card-actions {
                    margin-top: 1.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid var(--border-light);
                }

                .btn-view {
                    width: 100%;
                    background: var(--bg-color);
                    border: 1px solid var(--border-light);
                    color: var(--text-main);
                    padding: 8px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-view:hover {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }
            `}</style>
        </div>
    );
}

export default History;
