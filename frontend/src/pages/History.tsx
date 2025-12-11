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
        <div className="dashboard-container animate-fade-in history-container">
            {/* Header */}
            <div className="history-header">
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
                        <div key={item.id} className="history-card">
                            <div className="card-header-row">
                                <div className={`card-icon type-${item.type}`}>
                                    {getTypeIcon(item.type)}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                    className="btn-delete-card desktop-only"
                                    title="Remove"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="card-content-block">
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

                            {/* Mobile Delete Button (positioned via flex) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                className="btn-delete-card mobile-only-delete"
                                title="Remove"
                            >
                                ✕
                            </button>
                            <style>{`
                /* Global container override */
                .history-container {
                    /* Managed by dashboard-page-container */
                }

                .history-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid var(--border-light);
                    padding-bottom: 1rem;
                }

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
                .btn-clear:hover { background: #fee2e2; }

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

                .card-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    /* width: 100%; Desktop default */
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

                .btn-delete-card {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 1rem;
                    padding: 4px;
                    border-radius: 50%;
                    transition: all 0.2s;
                    opacity: 0.6;
                }
                .btn-delete-card:hover { opacity: 1; background: #fee2e2; color: #ef4444; }

                .mobile-only-delete { display: none; }

                .card-content-block {
                    margin-top: 1rem;
                }
                    padding: 4px;
                    border-radius: 50%;
                    transition: all 0.2s;
                    opacity: 0.6;
                }
                .btn-delete-card:hover { opacity: 1; background: #fee2e2; color: #ef4444; }

                .mobile-only-delete { display: none; }

                .card-content-block {
                    margin-top: 1rem;
                }

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
                .btn-view:hover { background: var(--primary); color: white; border-color: var(--primary); }

                @media (max-width: 768px) {
                    .history-container {
                         margin-top: 80px;
                         padding-top: 1rem;
                    }
                    .desktop-only { display: none; }
                    .history-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    
                    .history-grid {
                        grid-template-columns: 1fr;
                        gap: 0.75rem; /* Tighter gap */
                    }

                    .history-card {
                        flex-direction: row; /* Horizontal layout */
                        align-items: center;
                        padding: 1rem;
                        gap: 1rem;
                        min-height: auto;
                    }

                    .card-header-row {
                        flex: 0 0 auto;
                        width: auto;
                    }
                    
                    .card-content-block {
                        margin-top: 0;
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }

                    .card-title {
                        font-size: 1rem;
                        margin-bottom: 0.2rem;
                    }
                    
                    .card-category { display: none; /* Hide category to save space, or show small */ }
                    .card-date { font-size: 0.75rem; }

                    .card-actions {
                        margin-top: 0;
                        padding-top: 0;
                        border-top: none;
                        width: auto;
                        display: none; /* Hide resume button on mobile list for cleanliness? Or make icon? */
                    }
                    
                    .btn-delete-card {
                        position: static;
                        margin-left: auto;
                    }
                    
                    .mobile-only-delete {
                        display: block;
                        font-size: 1.2rem;
                        padding: 8px;
                    }
                }
            `}</style>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default History;
