import { useState, useEffect } from 'react';
import api from '../api';

interface User {
    id: number;
    username: string;
    role: string;
    first_name: string;
    last_name: string;
    university: string;
}

function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div className="loading-spinner">Loading Users...</div>;

    return (
        <div className="dashboard-container animate-fade-in" style={{ marginTop: '2rem' }}>
            <h1 className="section-title">User Management</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>View and manage registered users.</p>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username / Email</th>
                            <th>Role</th>
                            <th>Full Name</th>
                            <th>University</th>
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
                                <td>{user.university || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
                }
            .users-table tr:last-child td {
                border - bottom: none;
                }
            .badge {
                padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
                }

            /* Light Mode Badges */
            .badge-student {background: #e0e7ff; color: #4338ca; }
            .badge-admin {background: #fee2e2; color: #b91c1c; }
            .badge-management {background: #fef3c7; color: #b45309; }

            /* Dark Mode Badge Overrides */
            :global(body.dark-mode) .badge-student {background: rgba(67, 56, 202, 0.2); color: #818cf8; border: 1px solid rgba(67, 56, 202, 0.3); }
            :global(body.dark-mode) .badge-admin {background: rgba(185, 28, 28, 0.2); color: #f87171; border: 1px solid rgba(185, 28, 28, 0.3); }
            :global(body.dark-mode) .badge-management {background: rgba(180, 83, 9, 0.2); color: #fbbf24; border: 1px solid rgba(180, 83, 9, 0.3); }
            `}</style>
        </div >
    );
}

export default UserManagement;
