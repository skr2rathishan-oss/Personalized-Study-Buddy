import { useState, useEffect } from 'react';
import api from '../api';

function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Admin State
    const [isAdmin, setIsAdmin] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'deadline' });

    useEffect(() => {
        // Check role
        const role = localStorage.getItem('role');
        setIsAdmin(role === 'admin' || role === 'management');
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

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleCreateEvent = async () => {
        if (!newEvent.title || !newEvent.date) return alert("Title and Date are required");
        try {
            await api.post('/events', newEvent);
            setShowModal(false);
            setNewEvent({ title: '', date: '', type: 'deadline' });
            fetchEvents(); // Refresh
            alert("Event created!");
        } catch (err: any) {
            alert("Error: " + (err.response?.data?.error || err.message));
        }
    };

    // Calendar Logic
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOffset = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)

    // Filter events for this month
    const currentMonthEvents = events.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });

    return (
        <div className="dashboard-container animate-fade-in" style={{ marginTop: '2rem', maxWidth: '900px', margin: '2rem auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="section-title" style={{ margin: 0 }}>Study Schedule</h1>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {isAdmin && (
                        <button
                            className="btn-modern-primary"
                            onClick={() => setShowModal(true)}
                            style={{ marginRight: '1rem' }}
                        >
                            + Add Event
                        </button>
                    )}
                    <button className="btn-modern-outline" onClick={handlePrevMonth}>&lt; Prev</button>
                    <span style={{ fontWeight: 700, fontSize: '1.2rem', minWidth: '150px', textAlign: 'center' }}>
                        {monthName}
                    </span>
                    <button className="btn-modern-outline" onClick={handleNextMonth}>Next &gt;</button>
                </div>
            </div>

            <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="calendar-header">{day}</div>
                ))}

                {/* Empty slots */}
                {Array.from({ length: startDayOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="calendar-day empty"></div>
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    // Match events by day number (assuming properly formatted date strings)
                    // Note: Date parsing can be tricky with timezones, here we assume straightforward YYYY-MM-DD
                    const daysEvents = currentMonthEvents.filter(e => {
                        const d = new Date(e.date);
                        return d.getDate() === dayNum;
                    });

                    return (
                        <div key={dayNum} className="calendar-day">
                            <span className="day-number">{dayNum}</span>
                            <div className="events-list">
                                {daysEvents.map((evt: any) => (
                                    <div key={evt.id} className={`calendar-event event-${evt.type}`}>
                                        {evt.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Admin Add Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content animate-fade-in">
                        <h3>Add New Event</h3>
                        <div className="form-group-clean">
                            <label>Event Title</label>
                            <input
                                type="text"
                                value={newEvent.title}
                                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                placeholder="e.g. Final Exam"
                            />
                        </div>
                        <div className="form-group-clean">
                            <label>Date</label>
                            <input
                                type="date"
                                value={newEvent.date}
                                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                            />
                        </div>
                        <div className="form-group-clean">
                            <label>Type</label>
                            <select
                                value={newEvent.type}
                                onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                            >
                                <option value="deadline">Deadline</option>
                                <option value="exam">Exam</option>
                                <option value="meeting">Meeting</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn-modern-primary" onClick={handleCreateEvent}>Save Event</button>
                            <button className="btn-modern-outline" onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 1px;
                    background: var(--border-light);
                    border: 1px solid var(--border-light);
                    border-radius: 12px;
                    overflow: hidden;
                }
                .calendar-header {
                    background: var(--bg-color);
                    padding: 0.75rem;
                    text-align: center;
                    font-weight: 600;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }
                .calendar-day {
                    background: var(--surface-color);
                    min-height: 100px; /* Reduced from 120px */
                    padding: 0.25rem;
                    position: relative;
                }
                .calendar-day.empty {
                    background: var(--bg-color);
                }
                .day-number {
                    font-weight: 600;
                    color: var(--text-main);
                    margin-bottom: 0.5rem;
                    display: block;
                }
                .events-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .calendar-event {
                    font-size: 0.75rem;
                    padding: 4px 6px;
                    border-radius: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .event-exam { background: #fee2e2; color: #b91c1c; border-left: 3px solid #b91c1c; }
                .event-deadline { background: #ffedd5; color: #c2410c; border-left: 3px solid #c2410c; }
                .event-meeting { background: #e0e7ff; color: #4338ca; border-left: 3px solid #4338ca; }

                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: var(--surface-color);
                    padding: 2rem;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 400px;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                    color: var(--text-main);
                }
            `}</style>
        </div>
    );
}

export default Calendar;

