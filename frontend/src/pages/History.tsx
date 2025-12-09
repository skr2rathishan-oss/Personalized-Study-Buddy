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
                        <div key={item.id} className="history-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className={`card-icon type-${item.type}`}>
                                    {getTypeIcon(item.type)}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                    className="btn-delete-card"
                                    title="Remove"
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <span className="card-category">{item.category}</span>
                                <h3 className="card-title">{item.title}</h3>
                                <p className="card-date">{item.date}</p>
                            </div>

                            <div className="card-actions">
                                <button className="btn-view">Resume</button>
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
                .btn-delete-card:hover {
                    background: #fee2e2;
                    color: #ef4444;
                    opacity: 1;
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
