import { useState } from 'react';

function History() {
    // Mock History Data
    const [historyItems, setHistoryItems] = useState([
        { id: 1, title: 'Python For Loops Guide', date: 'Oct 24, 2023 10:30 AM', type: 'article', category: 'Programming' },
        { id: 2, title: 'Introduction to React', date: 'Oct 23, 2023 2:15 PM', type: 'video', category: 'Frontend' },
        { id: 3, title: 'Linear Algebra Notes', date: 'Oct 22, 2023 9:00 AM', type: 'pdf', category: 'Math' },
        { id: 4, title: 'CSS Flexbox Cheatsheet', date: 'Oct 20, 2023 4:45 PM', type: 'article', category: 'Design' },
        { id: 5, title: 'Machine Learning Basics', date: 'Oct 18, 2023 11:20 AM', type: 'video', category: 'AI' },
        { id: 6, title: 'Database Optimization', date: 'Oct 15, 2023 3:20 PM', type: 'pdf', category: 'Backend' },
    ]);

    const handleDelete = (id: number) => {
        setHistoryItems(historyItems.filter(item => item.id !== id));
    };

    const handleClearAll = () => {
        if (window.confirm("Are you sure you want to clear your entire history?")) {
            setHistoryItems([]);
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
                                    className="btn-delete-card mobile-hidden" /* Hidden here on mobile, moved to end */
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
                                <button className="btn-view">Resume</button>
                            </div>

                            {/* Mobile Delete Button (positioned via flex) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                className="btn-delete-card mobile-only-delete"
                                title="Remove"
                                style={{ display: 'none' }} /* Handle via CSS media query if possible or inline style replacement */
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

                /* Mobile Compact List View */
                @media (max-width: 768px) {
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
