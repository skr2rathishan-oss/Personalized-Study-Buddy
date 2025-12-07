import { useState } from 'react';

function History() {
    // Mock History Data
    const [historyItems, setHistoryItems] = useState([
        { id: 1, title: 'Python For Loops Guide', date: 'Oct 24, 2023 10:30 AM', type: 'article' },
        { id: 2, title: 'Introduction to React', date: 'Oct 23, 2023 2:15 PM', type: 'video' },
        { id: 3, title: 'Linear Algebra Notes', date: 'Oct 22, 2023 9:00 AM', type: 'pdf' },
        { id: 4, title: 'CSS Flexbox Cheatsheet', date: 'Oct 20, 2023 4:45 PM', type: 'article' },
        { id: 5, title: 'Machine Learning Basics', date: 'Oct 18, 2023 11:20 AM', type: 'video' },
    ]);

    const handleDelete = (id: number) => {
        setHistoryItems(historyItems.filter(item => item.id !== id));
    };

    const handleClearAll = () => {
        setHistoryItems([]);
    };

    return (
        <div className="dashboard-container animate-fade-in" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="section-title">Learning History</h1>
                <button
                    onClick={handleClearAll}
                    className="btn-modern-outline"
                    style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}
                >
                    Clear History
                </button>
            </div>

            {historyItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <p>No history found.</p>
                </div>
            ) : (
                <div className="history-list">
                    {historyItems.map(item => (
                        <div key={item.id} className="history-item">
                            <div className={`history-icon type-${item.type}`}>
                                {item.type === 'video' ? '▶' : item.type === 'pdf' ? '📄' : '📝'}
                            </div>
                            <div className="history-content">
                                <h4>{item.title}</h4>
                                <span className="history-date">{item.date}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn-action">View Again</button>
                                <button
                                    className="btn-icon-delete"
                                    onClick={() => handleDelete(item.id)}
                                    title="Remove from history"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .history-list {
                    background: var(--surface-color);
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                .history-item {
                    display: flex;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--border-light);
                    transition: background 0.2s;
                }
                .history-item:last-child { border-bottom: none; }
                .history-item:hover { background: var(--bg-color); }
                
                .history-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 1rem;
                    font-size: 1.2rem;
                    transition: transform 0.2s ease;
                }
                .history-icon:hover {
                    transform: scale(1.1);
                }
                .type-video { background: #e0e7ff; color: #4338ca; }
                .type-article { background: #dcfce7; color: #166534; }
                .type-pdf { background: #fee2e2; color: #991b1b; }
                
                .history-content { flex: 1; }
                .history-content h4 { margin: 0 0 0.25rem 0; font-size: 1rem; color: var(--text-main); }
                .history-date { font-size: 0.85rem; color: var(--text-secondary); }
                
                .btn-action {
                    background: transparent;
                    border: 1px solid #e5e7eb;
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    cursor: pointer;
                    color: var(--primary);
                    font-weight: 500;
                    font-size: 0.85rem;
                    transition: all 0.2s;
                }
                .btn-action:hover {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                .btn-icon-delete {
                    background: transparent;
                    border: 1px solid transparent;
                    padding: 0.4rem;
                    border-radius: 6px;
                    cursor: pointer;
                    color: #ef4444; /* Red-500 */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .btn-icon-delete:hover {
                    background: #fee2e2;
                    border-color: #fecaca;
                }
            `}</style>
        </div>
    );
}

export default History;
