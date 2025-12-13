import { useState, useEffect } from 'react';
import api from '../api';

interface SubscriptionStatus {
    subscription_status: string;
    subscription_date: string | null;
    unsubscription_date: string | null;
    phone_number: string;
}

function SubscriptionManager() {
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [unsubscribing, setUnsubscribing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/subscription/status');
            setStatus(response.data);
        } catch (err: any) {
            console.error('Failed to fetch subscription status:', err);
            setError('Failed to load subscription status');
        } finally {
            setLoading(false);
        }
    };

    const handleUnsubscribe = async () => {
        try {
            setUnsubscribing(true);
            setError('');
            setSuccess('');

            const response = await api.post('/api/subscription/unsubscribe', { confirm: true });

            setSuccess(response.data.message);
            setShowConfirm(false);

            // Refresh status
            await fetchStatus();
        } catch (err: any) {
            console.error('Unsubscription failed:', err);
            setError(err.response?.data?.error || 'Unsubscription failed. Please try again.');
        } finally {
            setUnsubscribing(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadge = (subscriptionStatus: string) => {
        const badges: Record<string, { color: string; text: string }> = {
            active: { color: '#10b981', text: 'Active' },
            inactive: { color: '#ef4444', text: 'Inactive' },
            pending: { color: '#f59e0b', text: 'Pending' }
        };

        const badge = badges[subscriptionStatus] || { color: '#6b7280', text: 'Unknown' };

        return (
            <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                backgroundColor: `${badge.color}20`,
                color: badge.color,
                border: `1px solid ${badge.color}40`
            }}>
                {badge.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Loading subscription status...</p>
            </div>
        );
    }

    if (!status) {
        return (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Unable to load subscription status</p>
            </div>
        );
    }

    return (
        <div className="subscription-manager">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>Subscription Status</h4>
                {getStatusBadge(status.subscription_status)}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Phone Number
                        </p>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 500 }}>
                            {status.phone_number || 'Not provided'}
                        </p>
                    </div>

                    {status.subscription_status === 'active' && status.subscription_date && (
                        <div>
                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Subscribed Since
                            </p>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                {formatDate(status.subscription_date)}
                            </p>
                        </div>
                    )}

                    {status.subscription_status === 'inactive' && status.unsubscription_date && (
                        <div>
                            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Unsubscribed On
                            </p>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                {formatDate(status.unsubscription_date)}
                            </p>
                        </div>
                    )}
                </div>

                {status.subscription_status === 'inactive' && (
                    <div style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        backgroundColor: 'var(--warning-bg, #fef3c7)',
                        border: '1px solid var(--warning-border, #fbbf24)',
                        marginTop: '1rem'
                    }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--warning-text, #92400e)' }}>
                            ⚠️ Your subscription is inactive. You may have limited access to premium features.
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #ef4444',
                    marginBottom: '1rem'
                }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b' }}>{error}</p>
                </div>
            )}

            {success && (
                <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    backgroundColor: '#d1fae5',
                    border: '1px solid #10b981',
                    marginBottom: '1rem'
                }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#065f46' }}>{success}</p>
                </div>
            )}

            {status.subscription_status === 'active' && !showConfirm && (
                <button
                    className="btn-modern-outline"
                    onClick={() => setShowConfirm(true)}
                    style={{
                        width: '100%',
                        color: '#ef4444',
                        borderColor: '#ef4444'
                    }}
                >
                    Unsubscribe from Service
                </button>
            )}

            {showConfirm && (
                <div className="animate-fade-in" style={{
                    padding: '1.5rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-color)',
                    border: '1px solid var(--border-light)'
                }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Confirm Unsubscription</h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Are you sure you want to unsubscribe? You will lose access to all premium features immediately.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            className="btn-modern-primary"
                            onClick={handleUnsubscribe}
                            disabled={unsubscribing}
                            style={{
                                flex: 1,
                                backgroundColor: '#ef4444',
                                borderColor: '#ef4444'
                            }}
                        >
                            {unsubscribing ? 'Unsubscribing...' : 'Yes, Unsubscribe'}
                        </button>
                        <button
                            className="btn-modern-outline"
                            onClick={() => setShowConfirm(false)}
                            disabled={unsubscribing}
                            style={{ flex: 1 }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .subscription-manager {
                    width: 100%;
                }
                
                @media (max-width: 768px) {
                    .subscription-manager {
                        padding: 0;
                    }
                    
                    .subscription-manager > div:first-child {
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 0.75rem;
                    }
                    
                    .subscription-manager h4 {
                        font-size: 0.95rem !important;
                    }
                    
                    .subscription-manager > div > div[style*="grid"] {
                        grid-template-columns: 1fr !important;
                        gap: 0.75rem !important;
                    }
                    
                    .subscription-manager button {
                        padding: 0.875rem 1rem !important;
                        font-size: 0.95rem !important;
                        min-height: 48px;
                        touch-action: manipulation;
                    }
                    
                    .subscription-manager .animate-fade-in {
                        padding: 1rem !important;
                    }
                    
                    .subscription-manager .animate-fade-in h4 {
                        font-size: 0.9rem !important;
                    }
                    
                    .subscription-manager .animate-fade-in p {
                        font-size: 0.85rem !important;
                    }
                    
                    .subscription-manager .animate-fade-in > div {
                        flex-direction: column !important;
                        gap: 0.5rem !important;
                    }
                    
                    .subscription-manager .animate-fade-in button {
                        width: 100% !important;
                        flex: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default SubscriptionManager;
