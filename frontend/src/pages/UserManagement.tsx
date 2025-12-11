import { useState, useEffect } from 'react';
import api from '../api';

interface User {
    id: number;
    username: string;
    role: string;
    first_name: string;
    last_name: string;
    university: string;
    course: string;
    student_id: string;
    phone: string;
    nic: string;
}

function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async (userId: number) => {
        if (!confirm("Are you sure you want to promote this user to Admin?")) return;

        setActionLoading(userId);
        try {
            await api.post('/admin/users/promote', { user_id: userId });
            alert("User promoted successfully!");
            fetchUsers(); // Refresh list
        } catch (err: any) {
            alert("Failed to promote user: " + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDemote = async (userId: number) => {
        if (!confirm("Are you sure you want to demote this Admin to Student?")) return;

        setActionLoading(userId);
        try {
            await api.post('/admin/users/demote', { user_id: userId });
            alert("User demoted successfully!");
            fetchUsers(); // Refresh list
        } catch (err: any) {
            alert("Failed to demote user: " + (err.response?.data?.error || err.message));
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="loading-spinner">Loading Users...</div>;

    return (
        <div className="dashboard-container dashboard-page-container animate-fade-in">
            <h1 className="section-title">User Management</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>View and manage registered users.</p>

            {/* Desktop Table View */}
            <div className="users-table-container desktop-view">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username / Email</th>
                            <th>Role</th>
                            <th>Full Name</th>
                            <th>NIC</th>
                            <th>University</th>
                            <th>Course</th>
                            <th>Student ID</th>
                            <th>Phone</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>#{user.id}</td>
                                <td>{user.username}</td>
                                <td>
                                    <span className={`badge badge-${user.role}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{user.first_name || '-'} {user.last_name || ''}</td>
                                <td>{user.nic || '-'}</td>
                                <td>{user.university || '-'}</td>
                                <td>{user.course || '-'}</td>
                                <td>{user.student_id || '-'}</td>
                                <td>{user.phone || '-'}</td>
                                <td>
                                    {user.role === 'student' && (
                                        <button
                                            className="btn-promote"
                                            onClick={() => handlePromote(user.id)}
                                            disabled={actionLoading === user.id}
                                        >
                                            {actionLoading === user.id ? 'Promoting...' : 'Promote to Admin'}
                                        </button>
                                    )}
                                    {user.role === 'admin' && (
                                        <button
                                            className="btn-demote"
                                            onClick={() => handleDemote(user.id)}
                                            disabled={actionLoading === user.id}
                                        >
                                            {actionLoading === user.id ? 'Demoting...' : 'Remove Admin'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card List View */}
            <div className="mobile-view mobile-card-list">
                {users.map(user => (
                    <div key={user.id} className="mobile-user-card">
                        <div className="mobile-card-header">
                            <div className="user-info">
                                <h3>{user.first_name || user.username} {user.last_name}</h3>
                                <span className="user-email">{user.username}</span>
                            </div>
                            <span className={`badge badge-${user.role}`}>{user.role}</span>
                        </div>

                        <div className="mobile-card-details">
                            <div className="detail-row">
                                <span className="label">ID:</span>
                                <span className="value">#{user.id}</span>
                            </div>
                            {user.student_id && (
                                <div className="detail-row">
                                    <span className="label">Student ID:</span>
                                    <span className="value">{user.student_id}</span>
                                </div>
                            )}
                            <div className="detail-row">
                                <span className="label">University:</span>
                                <span className="value">{user.university || '-'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Course:</span>
                                <span className="value">{user.course || '-'}</span>
                            </div>
                        </div>

                        <div className="mobile-card-actions">
                            {user.role === 'student' && (
                                <button
                                    className="btn-promote mobile-btn"
                                    onClick={() => handlePromote(user.id)}
                                    disabled={actionLoading === user.id}
                                >
                                    {actionLoading === user.id ? '...' : 'Promote'}
                                </button>
                            )}
                            {user.role === 'admin' && (
                                <button
                                    className="btn-demote mobile-btn"
                                    onClick={() => handleDemote(user.id)}
                                    disabled={actionLoading === user.id}
                                >
                                    {actionLoading === user.id ? '...' : 'Demote'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
            .users-table-container {
                background: var(--surface-color);
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                overflow-x: auto;
            }
            .users-table {
                width: 100%;
                border-collapse: collapse;
                text-align: left;
            }
            .users-table th {
                background: var(--bg-color);
                padding: 1rem;
                font-weight: 600;
                color: var(--text-secondary);
                border-bottom: 2px solid var(--border-light);
            }
            .users-table td {
                padding: 1rem;
                border-bottom: 1px solid var(--border-light);
                color: var(--text-main);
                vertical-align: middle;
            }
            .users-table tr:last-child td {
                border-bottom: none;
            }
            .badge {
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                display: inline-block;
            }

            /* Light Mode Badges */
            .badge-student { background: #e0e7ff; color: #4338ca; }
            .badge-admin { background: #fee2e2; color: #b91c1c; }
            .badge-management { background: #fef3c7; color: #b45309; }

            /* Buttons */
            .btn-promote {
                background: #10B981;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 0.8rem;
                cursor: pointer;
                font-weight: 600;
                transition: background 0.2s;
                width: 140px;
                text-align: center;
            }
            .btn-promote:hover { background: #059669; }
            .btn-promote:disabled { opacity: 0.5; cursor: not-allowed; }

            .btn-demote {
                background: #EF4444;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 0.8rem;
                cursor: pointer;
                font-weight: 600;
                transition: background 0.2s;
                width: 140px;
                text-align: center;
            }
            .btn-demote:hover { background: #DC2626; }
            .btn-demote:disabled { opacity: 0.5; cursor: not-allowed; }

            /* Dark Mode Badge Overrides */
            :global(body.dark-mode) .badge-student { background: rgba(67, 56, 202, 0.2); color: #818cf8; border: 1px solid rgba(67, 56, 202, 0.3); }
            :global(body.dark-mode) .badge-admin { background: rgba(185, 28, 28, 0.2); color: #f87171; border: 1px solid rgba(185, 28, 28, 0.3); }
            :global(body.dark-mode) .badge-management { background: rgba(180, 83, 9, 0.2); color: #fbbf24; border: 1px solid rgba(180, 83, 9, 0.3); }

            /* Responsive Views */
            .mobile-view { display: none; }
            .desktop-view { display: block; }

            @media (max-width: 768px) {
                .desktop-view { display: none; }
                .mobile-view { display: flex; flex-direction: column; gap: 1rem; }
                
                .mobile-user-card {
                    background: var(--surface-color);
                    border-radius: 12px;
                    padding: 1rem;
                    border: 1px solid var(--border-light);
                    box-shadow: var(--shadow-sm);
                }

                .mobile-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.75rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid var(--border-light);
                }

                .user-info h3 {
                    margin: 0;
                    font-size: 1rem;
                    color: var(--text-main);
                }
                .user-email {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }

                .mobile-card-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                    font-size: 0.85rem;
                    margin-bottom: 1rem;
                }
                .detail-row {
                    display: flex;
                    flex-direction: column;
                }
                .label { font-size: 0.75rem; color: var(--text-secondary); }
                .value { color: var(--text-main); font-weight: 500; }

                .mobile-card-actions {
                    display: flex;
                    justify-content: flex-end;
                }
                .mobile-btn {
                    width: 100%;
                    padding: 8px;
                }
            }
            `}</style>
        </div>
    );
}

export default UserManagement;
