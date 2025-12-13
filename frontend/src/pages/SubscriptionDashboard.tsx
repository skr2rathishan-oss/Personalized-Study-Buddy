import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface SubscriptionUser {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    subscription_status: string;
    subscription_date: string | null;
    unsubscription_date: string | null;
    role: string;
}

interface SubscriptionStats {
    total_users: number;
    active: number;
    inactive: number;
    pending: number;
}

interface SubscriptionData {
    users: SubscriptionUser[];
    statistics: SubscriptionStats;
}

function SubscriptionDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        fetchSubscriptionData();
    }, []);

    const fetchSubscriptionData = async () => {
        try {
            setLoading(true);
            setError('');
            console.log('[SubscriptionDashboard] Fetching subscription data...');
            const response = await api.get('/api/subscription/all');
            console.log('[SubscriptionDashboard] Data received:', response.data);
            setData(response.data);
        } catch (err: any) {
            console.error('[SubscriptionDashboard] Error fetching subscription data:', err);
            console.error('[SubscriptionDashboard] Error response:', err.response);

            if (err.response?.status === 403) {
                setError('Access denied. Manager role required.');
                setTimeout(() => navigate('/'), 3000);
            } else if (err.response?.status === 401) {
                setError('Authentication failed. Please login again.');
                setTimeout(() => navigate('/login'), 3000);
            } else {
                const errorMsg = err.response?.data?.error || err.message || 'Failed to load subscription data';
                setError(errorMsg);
                console.error('[SubscriptionDashboard] Error message:', errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { color: string; bg: string; text: string }> = {
            active: { color: '#10b981', bg: '#d1fae5', text: 'Active' },
            inactive: { color: '#ef4444', bg: '#fee2e2', text: 'Inactive' },
            pending: { color: '#f59e0b', bg: '#fef3c7', text: 'Pending' }
        };

        const badge = badges[status] || { color: '#6b7280', bg: '#f3f4f6', text: 'Unknown' };

        return (
            <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                backgroundColor: badge.bg,
                color: badge.color
            }}>
                {badge.text}
            </span>
        );
    };

    const filteredUsers = data?.users.filter(user => {
        const matchesSearch =
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone_number?.includes(searchTerm);

        const matchesFilter = filterStatus === 'all' || user.subscription_status === filterStatus;

        return matchesSearch && matchesFilter;
    }) || [];

    if (loading) {
        return (
            <div className="dashboard-container" style={{ marginTop: '2rem' }}>
                <h1 className="section-title">Subscription Management</h1>
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading subscription data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container" style={{ marginTop: '2rem' }}>
                <h1 className="section-title">Subscription Management</h1>
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: '#fee2e2',
                    borderRadius: '8px',
                    border: '1px solid #ef4444'
                }}>
                    <p style={{ margin: 0, color: '#991b1b', fontSize: '1.1rem' }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container" style={{ marginTop: '2rem' }}>
            <h1 className="section-title">Subscription Management</h1>

            {/* Statistics Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <div className="stat-value">{data?.statistics.total_users || 0}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    <div className="stat-value">{data?.statistics.active || 0}</div>
                    <div className="stat-label">Active Subscriptions</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                    <div className="stat-value">{data?.statistics.inactive || 0}</div>
                    <div className="stat-label">Inactive</div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <div className="stat-value">{data?.statistics.pending || 0}</div>
                    <div className="stat-label">Pending</div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="profile-content-card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: '1 1 300px',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-light)',
                            fontSize: '0.95rem',
                            backgroundColor: 'var(--bg-color)'
                        }}
                    />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-light)',
                            fontSize: '0.95rem',
                            backgroundColor: 'var(--bg-color)',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="profile-content-card">
                <h3 className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
                    User Subscriptions ({filteredUsers.length})
                </h3>

                {filteredUsers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No users found matching your criteria.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="subscription-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Phone Number</th>
                                    <th>Status</th>
                                    <th>Subscribed</th>
                                    <th>Unsubscribed</th>
                                    <th>Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td data-label="User">
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                                    {user.first_name} {user.last_name}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {user.username}
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Phone Number">{user.phone_number || 'N/A'}</td>
                                        <td data-label="Status">{getStatusBadge(user.subscription_status)}</td>
                                        <td data-label="Subscribed">{formatDate(user.subscription_date)}</td>
                                        <td data-label="Unsubscribed">{formatDate(user.unsubscription_date)}</td>
                                        <td data-label="Role">
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '6px',
                                                fontSize: '0.8rem',
                                                backgroundColor: 'var(--bg-color)',
                                                border: '1px solid var(--border-light)',
                                                textTransform: 'capitalize'
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`
                .stat-card {
                    padding: 1.5rem;
                    border-radius: 12px;
                    color: white;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .stat-value {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                }
                .stat-label {
                    font-size: 0.95rem;
                    opacity: 0.9;
                }
                
                .subscription-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .subscription-table th {
                    text-align: left;
                    padding: 0.75rem 1rem;
                    background-color: var(--bg-color);
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 2px solid var(--border-light);
                }
                .subscription-table td {
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-light);
                    color: var(--text-main);
                }
                .subscription-table tbody tr:hover {
                    background-color: var(--bg-color);
                }
                
                .profile-content-card {
                    background: var(--surface-color);
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                
                .section-subtitle {
                    font-size: 1.1rem;
                    margin-bottom: 1rem;
                    color: var(--text-main);
                    font-weight: 600;
                }
                
                @media (max-width: 768px) {
                    .dashboard-container {
                        padding: 0 1rem !important;
                        margin-top: 1rem !important;
                    }
                    
                    .section-title {
                        font-size: 1.5rem !important;
                        margin-bottom: 1rem !important;
                    }
                    
                    .stat-card {
                        padding: 1rem;
                    }
                    
                    .stat-value {
                        font-size: 1.75rem;
                    }
                    
                    .stat-label {
                        font-size: 0.85rem;
                    }
                    
                    .profile-content-card {
                        padding: 1rem;
                        margin-bottom: 1rem !important;
                    }
                    
                    .profile-content-card > div {
                        flex-direction: column !important;
                        gap: 0.75rem !important;
                    }
                    
                    .profile-content-card input,
                    .profile-content-card select {
                        width: 100% !important;
                        flex: none !important;
                        min-height: 48px;
                        font-size: 16px !important; /* Prevents zoom on iOS */
                    }
                    
                    /* Mobile-optimized table */
                    .subscription-table {
                        display: block;
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                    }
                    
                    .subscription-table thead {
                        display: none; /* Hide headers on mobile */
                    }
                    
                    .subscription-table tbody {
                        display: block;
                    }
                    
                    .subscription-table tr {
                        display: block;
                        margin-bottom: 1rem;
                        border: 1px solid var(--border-light);
                        border-radius: 8px;
                        padding: 1rem;
                        background: var(--surface-color);
                    }
                    
                    .subscription-table td {
                        display: block;
                        padding: 0.5rem 0;
                        border: none;
                        text-align: left;
                    }
                    
                    .subscription-table td:before {
                        content: attr(data-label);
                        font-weight: 600;
                        color: var(--text-secondary);
                        font-size: 0.75rem;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        display: block;
                        margin-bottom: 0.25rem;
                    }
                    
                    .subscription-table td:first-child {
                        padding-top: 0;
                    }
                    
                    .subscription-table td:last-child {
                        padding-bottom: 0;
                    }
                    
                    .section-subtitle {
                        font-size: 1rem;
                    }
                }
            `}</style>
        </div>
    );
}

export default SubscriptionDashboard;
