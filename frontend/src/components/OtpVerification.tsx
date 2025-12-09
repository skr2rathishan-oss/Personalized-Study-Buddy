import { useState, FormEvent } from 'react';
import api from '../api';

interface OtpVerificationProps {
    phoneNumber: string;
    onBack: () => void;
    onSuccess: (otp: string) => void;
}

export default function OtpVerification({ phoneNumber, onBack, onSuccess }: OtpVerificationProps) {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log("Verifying OTP for:", phoneNumber);

            // Call Backend to Verify OTP (and trigger mSpace subscription)
            await api.post('/auth/otp/verify', {
                identifier: phoneNumber,
                otp: otp
            });

            // If successful
            onSuccess(otp);

        } catch (error: any) {
            console.error("Verification failed:", error);
            alert("Verification failed: " + (error.response?.data?.error || "Invalid Code"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleVerify} className="animate-slide-up">
            <div className="form-group-clean" style={{ textAlign: 'center' }}>
                <label style={{ textAlign: 'center', marginBottom: '1rem', fontWeight: 'bold' }}>
                    Verify & Subscribe
                </label>

                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                    Enter the OTP sent to <strong>{phoneNumber}</strong> to confirm your subscription.
                </p>

                <input
                    type="text"
                    className="otp-input"
                    placeholder="------"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    maxLength={6}
                    style={{
                        letterSpacing: '8px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        fontSize: '1.5rem'
                    }}
                />
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                    type="submit"
                    className="btn-modern-primary"
                    disabled={loading || otp.length < 4}
                >
                    {loading ? 'Processing Subscription...' : 'Verify & Subscribe'}
                </button>

                <button
                    type="button"
                    className="btn-modern-outline"
                    onClick={onBack}
                    style={{ border: 'none' }}
                >
                    ← Back to Details
                </button>
            </div>
        </form>
    );
}
