function PersonalTracking() {
    return (
        <div className="dashboard-container animate-fade-in" style={{ marginTop: '2rem' }}>
            <h1 className="section-title">Personal Tracking</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Track your learning progress and goals.</p>

            <div className="tracking-grid">
                {/* Weekly Activity Card */}
                <div className="tracking-card full-width">
                    <h3>Weekly Learning Activity</h3>
                    <div className="chart-placeholder">
                        {/* Mock Bar Chart */}
                        {[65, 40, 75, 50, 90, 30, 80].map((h, i) => (
                            <div key={i} className="bar-container">
                                <div className="bar" style={{ height: `${h}%` }}></div>
                                <span className="day-label">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Course Completion */}
                <div className="tracking-card">
                    <h3>Course Completion</h3>
                    <div className="course-progress-item">
                        <div className="cp-header">
                            <span>Python Basics</span>
                            <span>75%</span>
                        </div>
                        <div className="progress-bg"><div className="progress-fill" style={{ width: '75%' }}></div></div>
                    </div>
                    <div className="course-progress-item">
                        <div className="cp-header">
                            <span>Data Structures</span>
                            <span>40%</span>
                        </div>
                        <div className="progress-bg"><div className="progress-fill" style={{ width: '40%' }}></div></div>
                    </div>
                    <div className="course-progress-item">
                        <div className="cp-header">
                            <span>Web Development</span>
                            <span>90%</span>
                        </div>
                        <div className="progress-bg"><div className="progress-fill" style={{ width: '90%' }}></div></div>
                    </div>
                </div>

                {/* Goals */}
                <div className="tracking-card">
                    <h3>Weekly Goals</h3>
                    <ul className="goals-list">
                        <li>
                            <input type="checkbox" checked readOnly />
                            <span>Complete 5 Video Lessons</span>
                        </li>
                        <li>
                            <input type="checkbox" checked readOnly />
                            <span>Submit Assignment 1</span>
                        </li>
                        <li>
                            <input type="checkbox" />
                            <span>Read 2 Research Articles</span>
                        </li>
                        <li>
                            <input type="checkbox" />
                            <span>Practice Coding for 3 Hrs</span>
                        </li>
                    </ul>
                </div>
            </div>

            <style>{`
                .tracking-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                }
                .tracking-card {
                    background: var(--surface-color);
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                    display: flex;
                    flex-direction: column;
                }
                .full-width {
                    grid-column: 1 / -1;
                }
                .chart-placeholder {
                    height: 200px;
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    padding-top: 2rem;
                    gap: 10px;
                }
                .bar-container {
                    flex: 1;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    align-items: center;
                }
                .bar {
                    width: 100%;
                    max-width: 40px;
                    background: var(--primary);
                    border-radius: 4px 4px 0 0;
                    opacity: 0.8;
                    transition: height 0.3s ease;
                }
                .bar:hover { opacity: 1; }
                .day-label { margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); }
                
                .course-progress-item { margin-bottom: 1.5rem; }
                .cp-header { display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; }
                .progress-bg { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
                .progress-fill { height: 100%; background: var(--secondary); border-radius: 4px; }
                
                .goals-list { list-style: none; padding: 0; }
                .goals-list li { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border-light); }
                .goals-list li:last-child { border-bottom: none; }
            `}</style>
        </div>
    );
}

export default PersonalTracking;
