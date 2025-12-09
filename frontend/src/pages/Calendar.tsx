import { useState, useEffect } from 'react';
import api from '../api';

function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Loading Calendar...</div>
            </div>
        );
    }

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
        <div className="dashboard-container animate-fade-in" style={{
            marginTop: '2rem',
            maxWidth: '900px',
            margin: '2rem auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>

            {/* Control Bar: Jump to Date */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                background: 'var(--surface-color)',
                padding: '0.75rem',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                width: '100%'
            }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Calendar</h2>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                    {/* Empty Slots */}
                    {Array.from({ length: startDayOffset }).map((_, i) => (
                        <div key={`empty-${i}`} className="calendar-cell empty"></div>
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
                </div>
            </div>

            {/* Modal Logic Remains Same */}
            {/* Removed Modal JSX */}

            <style>{`
                .calendar-box {
                    border: 1px solid var(--calendar-border);
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: var(--shadow-md);
                    background: var(--calendar-cell-bg);
                }

                .calendar-header-bar {
                    background: var(--calendar-primary);
                    color: var(--calendar-header-text);
                    padding: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .nav-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 32px; 
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .nav-btn:hover { background: rgba(255, 255, 255, 0.4); }

                .calendar-grid-header {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    background: var(--calendar-primary);
                    padding-bottom: 0.5rem;
                }

                .day-name {
                    text-align: center;
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 600;
                    padding: 0.5rem;
                    font-size: 0.85rem;
                }

                .calendar-grid-body {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    border-top: 1px solid var(--calendar-border);
                }

                .calendar-cell {
                    min-height: 85px;
                    background: var(--calendar-cell-bg);
                    border-right: 1px solid var(--calendar-border);
                    border-bottom: 1px solid var(--calendar-border);
                    padding: 0.25rem;
                    position: relative;
                    transition: background 0.2s;
                }
                
                .calendar-cell:nth-child(7n) {
                    border-right: none;
                }

                .calendar-cell.empty {
                    background: var(--bg-color);
                    opacity: 0.5;
                }

                .calendar-cell.today {
                    background: var(--calendar-today-bg);
                    color: var(--calendar-today-text);
                    border-color: rgba(0,0,0,0.1);
                }
                .calendar-cell.today .cell-number {
                    font-weight: 800;
                    font-size: 1.1rem;
                }

                .cell-number {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                    text-align: right;
                    font-size: 0.9rem;
                    padding-right: 4px;
                }

                .cell-events {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .evt-dot {
                    font-size: 0.7rem;
                    padding: 2px 4px;
                    border-radius: 3px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    cursor: pointer;
                }
                
                /* Event Types Styles */
                .evt-deadline { background: #fee2e2; color: #991b1b; border-left: 3px solid #b91c1c; }
                .evt-exam { background: #fef3c7; color: #92400e; border-left: 3px solid #b45309; }
                .evt-meeting { background: #e0e7ff; color: #3730a3; border-left: 3px solid #4338ca; }
                
                /* Student Specific */
                .evt-study_goal { background: #d1fae5; color: #065f46; border-left: 3px solid #059669; }
                .evt-resource_plan { background: #fae8ff; color: #86198f; border-left: 3px solid #c026d3; }

                /* Admin Specific */
                .evt-resource_release { background: #cffafe; color: #155e75; border-left: 3px solid #0891b2; font-weight: 600; }
                .evt-important_date { background: #ffedd5; color: #9a3412; border-left: 3px solid #ea580c; border: 1px solid #ea580c; }


                /* Dark mode adjustments */
                body.dark-mode .evt-deadline { background: #7f1d1d; color: #fecaca; border-left-color: #f87171; }
                body.dark-mode .evt-exam { background: #78350f; color: #fde68a; border-left-color: #fbbf24; }
                body.dark-mode .evt-meeting { background: #312e81; color: #e0e7ff; border-left-color: #818cf8; }
                
                body.dark-mode .evt-study_goal { background: #064e3b; color: #a7f3d0; border-left-color: #34d399; }
                body.dark-mode .evt-resource_plan { background: #701a75; color: #f0abfc; border-left-color: #e879f9; }
                
                body.dark-mode .evt-resource_release { background: #164e63; color: #a5f3fc; border-left-color: #22d3ee; }
                body.dark-mode .evt-important_date { background: #7c2d12; color: #fdba74; border-left-color: #fb923c; }

            `}</style>
        </div>
    );
}

export default Calendar;

