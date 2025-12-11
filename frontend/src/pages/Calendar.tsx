import { useState, useEffect } from 'react';
import api from '../api';

function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);


    // Admin/Role State
    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events');
            setEvents(res.data);
        } catch (err) {
            console.error("Failed to load events", err);
        }
    };



    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };



    // Calendar Logic
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleString('default', { month: 'long' }); // Just month name

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOffset = new Date(year, month, 1).getDay();

    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;


    // Dynamic Grid Logic: Just fill the last row
    const totalCells = startDayOffset + daysInMonth;
    const trailingEmptySlots = (7 - (totalCells % 7)) % 7;

    // Filter events
    const currentMonthEvents = events.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    // Jump Logic
    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMonth = parseInt(e.target.value);
        setCurrentDate(new Date(year, newMonth, 1));
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newYear = parseInt(e.target.value);
        if (!isNaN(newYear) && newYear > 1900 && newYear < 2100) {
            setCurrentDate(new Date(newYear, month, 1));
        }
    };

    return (
        <div className="dashboard-container animate-fade-in calendar-page-container">

            {/* Control Bar: Jump to Date */}
            <div className="calendar-controls">
                <div className="control-group">
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Calendar</h2>
                </div>

                <div className="control-group jump-controls">
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>JUMP TO:</span>
                    <select
                        value={month}
                        onChange={handleMonthChange}
                        className="input-modern"
                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    >
                        {Array.from({ length: 12 }).map((_, i) => (
                            <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'short' })}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={year}
                        onChange={handleYearChange}
                        className="input-modern"
                        style={{ width: '70px', padding: '6px', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    />
                </div>
            </div>

            {/* Calendar Container */}
            <div className="calendar-box" style={{ width: '100%' }}>
                {/* Blue Header */}
                <div className="calendar-header-bar">
                    <button onClick={handlePrevMonth} className="nav-btn">←</button>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{monthName} {year}</h2>
                    <button onClick={handleNextMonth} className="nav-btn">→</button>
                </div>

                {/* Day Names Header */}
                <div className="calendar-grid-header">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="day-name">{day}</div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="calendar-grid-body">
                    {/* Leading Empty Slots */}
                    {Array.from({ length: startDayOffset }).map((_, i) => (
                        <div key={`empty-start-${i}`} className="calendar-cell empty"></div>
                    ))}

                    {/* Active Days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const isToday = isCurrentMonth && dayNum === today.getDate();
                        const daysEvents = currentMonthEvents.filter(e => new Date(e.date).getDate() === dayNum);

                        return (
                            <div key={dayNum} className={`calendar-cell ${isToday ? 'today' : ''}`}>
                                <span className="cell-number">{dayNum}</span>
                                <div className="cell-events">
                                    {daysEvents.map((evt: any) => (
                                        <div key={evt.id} className={`evt-dot evt-${evt.type}`} title={evt.title}>
                                            {evt.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Trailing Empty Slots (Fill to 42) */}
                    {Array.from({ length: Math.max(0, trailingEmptySlots) }).map((_, i) => (
                        <div key={`empty-end-${i}`} className="calendar-cell empty"></div>
                    ))}
                </div>
            </div>

            {/* Modal Logic Remains Same */}
            {/* Removed Modal JSX */}

            {/* Mobile Agenda View (Visible only on mobile) */}
            <div className="mobile-agenda-view">
                {/* Week Strip (simplified) */}
                <div className="mobile-week-strip">
                    {Array.from({ length: 7 }).map(() => {
                        // Logic to show a rolling week or just the first week of month?
                        // Let's just show the first 7 days of the selected month or today's week?
                        // Simpler: Just show "Today" if in current month, else just dates.
                        // Let's show a horizontal scrollable strip of the whole month.
                        return null; // Implemented in body below
                    })}
                    <div className="agenda-month-title">{monthName} {year}</div>
                </div>

                <div className="agenda-list">
                    {currentMonthEvents.length === 0 ? (
                        <div className="no-events-placeholder">
                            <div className="placeholder-icon">📅</div>
                            <p>No events for this month</p>
                        </div>
                    ) : (
                        // Sort events by date
                        currentMonthEvents
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .map(evt => {
                                const d = new Date(evt.date);
                                const dateNum = d.getDate();
                                const dayName = d.toLocaleString('default', { weekday: 'short' });
                                return (
                                    <div key={evt.id} className={`agenda-item evt-${evt.type}-border`}>
                                        <div className="agenda-date is-today">
                                            <span className="agenda-day-name">{dayName}</span>
                                            <span className="agenda-day-num">{dateNum}</span>
                                        </div>
                                        <div className="agenda-details">
                                            <div className="agenda-title">{evt.title}</div>
                                            <div className="agenda-type-badge">{evt.type.replace('_', ' ')}</div>
                                        </div>
                                    </div>
                                );
                            })
                    )}
                </div>
            </div>

            <style>{`
                .calendar-page-container {
                    margin-top: 2rem;
                    max-width: 900px; /* Wider for desktop */
                    margin: 2rem auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding-bottom: 80px; /* Safe space */
                }

                /* Desktop Grid Styles */
                .calendar-box {
                    border: 1px solid var(--calendar-border);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: var(--shadow-md);
                    background: var(--calendar-cell-bg);
                    width: 100%;
                }
                
                .calendar-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    width: 100%;
                }

                .control-group {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }
                
                /* ... (Keep existing desktop specific styles if needed) ... */
                /* I will inline the essential desktop styles here to ensure they aren't lost, 
                   but heavily optimized for the "Agenda" switch */

                .calendar-header-bar {
                    background: var(--surface-color);
                    color: var(--text-main);
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--border-light);
                }
                .calendar-header-bar h2 { font-weight: 800; }

                .nav-btn {
                    background: var(--bg-color);
                    color: var(--text-main);
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    border: 1px solid var(--border-light);
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                }
                .nav-btn:hover { background: var(--border-light); }

                .calendar-grid-header {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    background: var(--bg-color);
                    padding: 0.75rem 0;
                    border-bottom: 1px solid var(--border-light);
                }

                .day-name {
                    text-align: center;
                    color: var(--text-secondary);
                    font-weight: 600;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                }

                .calendar-grid-body {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    background: var(--surface-color);
                }

                .calendar-cell {
                    min-height: 120px;
                    border-right: 1px solid var(--border-light);
                    border-bottom: 1px solid var(--border-light);
                    padding: 0.75rem;
                    position: relative;
                    transition: background 0.2s;
                }
                .calendar-cell:nth-child(7n) { border-right: none; }
                .calendar-cell.empty { background: #F9FAFB; }
                
                .calendar-cell.today {
                    background: #eff6ff;
                }
                .calendar-cell.today .cell-number {
                    color: var(--primary);
                    font-weight: 800;
                }

                .cell-number {
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    display: block;
                    color: var(--text-secondary);
                }

                .cell-events {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .evt-dot {
                    font-size: 0.75rem;
                    padding: 4px 8px;
                    border-radius: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    cursor: pointer;
                    font-weight: 500;
                    border-left-width: 3px;
                    border-left-style: solid;
                }

                /* Mobile Agenda Styles */
                .mobile-agenda-view { display: none; }

                /* Event Colors (Shared) */
                .evt-deadline { background: #fee2e2; color: #991b1b; border-left-color: #b91c1c; }
                .evt-exam { background: #fef3c7; color: #92400e; border-left-color: #b45309; }
                .evt-meeting { background: #e0e7ff; color: #3730a3; border-left-color: #4338ca; }
                .evt-study_goal { background: #d1fae5; color: #065f46; border-left-color: #059669; }
                .evt-resource_plan { background: #fae8ff; color: #86198f; border-left-color: #c026d3; }
                .evt-resource_release { background: #cffafe; color: #155e75; border-left-color: #0891b2; }
                .evt-important_date { background: #ffedd5; color: #9a3412; border-left-color: #ea580c; }

                /* Agenda Border Colors */
                .evt-deadline-border { border-left: 4px solid #ef4444; }
                .evt-exam-border { border-left: 4px solid #f59e0b; }
                .evt-meeting-border { border-left: 4px solid #6366f1; }
                .evt-study_goal-border { border-left: 4px solid #10b981; }

                @media (max-width: 900px) {
                     /* Hide Desktop Grid */
                    .calendar-box { display: none; }
                    .calendar-controls { display: none; } /* Hide complex controls */
                    
                    /* Show Agenda */
                    .mobile-agenda-view {
                        display: flex;
                        flex-direction: column;
                        width: 100%;
                        gap: 1.5rem;
                    }

                    .mobile-week-strip {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: var(--surface-color);
                        padding: 1rem;
                        border-radius: 12px;
                        border: 1px solid var(--border-light);
                        box-shadow: var(--shadow-sm);
                    }
                    .agenda-month-title {
                        font-size: 1.25rem;
                        font-weight: 800;
                        color: var(--text-main);
                    }

                    .agenda-list {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .agenda-item {
                        display: flex;
                        background: var(--surface-color);
                        padding: 1rem;
                        border-radius: 12px;
                        box-shadow: var(--shadow-sm);
                        border: 1px solid var(--border-light);
                        /* Left border set by class */
                    }
                    
                    .agenda-date {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding-right: 1rem;
                        border-right: 1px solid var(--border-light);
                        min-width: 60px;
                        color: var(--text-secondary);
                    }
                    .agenda-day-name { font-size: 0.8rem; text-transform: uppercase; font-weight: 600; }
                    .agenda-day-num { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
                    
                    .agenda-details {
                        padding-left: 1rem;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        gap: 0.25rem;
                    }
                    .agenda-title {
                        font-weight: 600;
                        font-size: 1rem;
                        color: var(--text-main);
                    }
                    .agenda-type-badge {
                        font-size: 0.75rem;
                        color: var(--text-secondary);
                        text-transform: capitalize;
                        background: var(--bg-color);
                        align-self: flex-start;
                        padding: 2px 8px;
                        border-radius: 4px;
                    }

                    .no-events-placeholder {
                        text-align: center;
                        padding: 4rem 2rem;
                        color: var(--text-secondary);
                        background: var(--surface-color);
                        border-radius: 16px;
                        border: 2px dashed var(--border-light);
                    }
                    .placeholder-icon {
                        font-size: 3rem;
                        margin-bottom: 1rem;
                        opacity: 0.5;
                    }
                }
            `}</style>
        </div>
    );
}

export default Calendar;

