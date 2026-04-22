'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import BottomNav from '@/components/mobile/BottomNav';
import { Shield, Loader2, CheckCircle, Clock, XCircle, Send } from 'lucide-react';

type BetaStatus = 'loading' | 'none' | 'pending' | 'approved' | 'denied';

export default function MobileBetaGate() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [status, setStatus] = useState<BetaStatus>('loading');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/m/onboarding');
      return;
    }

    fetch('/api/beta/status')
      .then(r => r.json())
      .then(data => {
        if (data.status === 'approved') {
          // Set cookie for middleware and redirect
          document.cookie = 'beta_approved=1; path=/; max-age=31536000';
          router.replace('/m/dashboard');
        } else {
          setStatus(data.status || 'none');
        }
      })
      .catch(() => setStatus('none'));
  }, [isLoaded, isSignedIn, router]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/beta/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-armadillo-bg">
        <Loader2 className="animate-spin text-burnt" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-armadillo-bg flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-burnt/15 flex items-center justify-center mx-auto mb-6">
          <Shield size={32} className="text-burnt" />
        </div>

        {status === 'none' && (
          <>
            <h1 className="font-display text-2xl text-armadillo-text mb-2">Request Beta Access</h1>
            <p className="text-sm text-armadillo-muted mb-6">
              Armadillo Analytics is currently in private beta. Request access and we&apos;ll review your application.
            </p>

            <div className="space-y-3 text-left">
              <textarea
                placeholder="Why do you want access? (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full bg-armadillo-card border border-armadillo-border rounded-xl px-4 py-3 text-sm text-armadillo-text placeholder:text-armadillo-muted/50 resize-none min-h-[44px]"
              />

              {error && (
                <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 text-xs text-danger">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-burnt text-white py-3.5 rounded-xl font-medium text-sm active:scale-95 transition-transform min-h-[44px] disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {submitting ? 'Submitting...' : 'Request Access'}
              </button>
            </div>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-16 h-16 rounded-full bg-burnt/15 flex items-center justify-center mx-auto mb-6">
              <Clock size={32} className="text-burnt" />
            </div>
            <h1 className="font-display text-2xl text-armadillo-text mb-2">Request Received</h1>
            <p className="text-sm text-armadillo-muted mb-4">
              Your beta access request is being reviewed. We&apos;ll let you know once you&apos;re approved.
            </p>
            <div className="bg-armadillo-card border border-armadillo-border rounded-xl px-4 py-3 text-xs text-armadillo-muted">
              Check back soon — most requests are reviewed within 24 hours.
            </div>
          </>
        )}

        {status === 'approved' && (
          <>
            <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-success" />
            </div>
            <h1 className="font-display text-2xl text-armadillo-text mb-2">You&apos;re In!</h1>
            <p className="text-sm text-armadillo-muted mb-4">
              Your beta access has been approved. Welcome to Armadillo Analytics.
            </p>
            <button
              onClick={() => {
                document.cookie = 'beta_approved=1; path=/; max-age=31536000';
                router.push('/m/dashboard');
              }}
              className="w-full bg-burnt text-white py-3.5 rounded-xl font-medium text-sm active:scale-95 transition-transform min-h-[44px]"
            >
              Get Started
            </button>
          </>
        )}

        {status === 'denied' && (
          <>
            <div className="w-16 h-16 rounded-full bg-danger/15 flex items-center justify-center mx-auto mb-6">
              <XCircle size={32} className="text-danger" />
            </div>
            <h1 className="font-display text-2xl text-armadillo-text mb-2">Not Approved</h1>
            <p className="text-sm text-armadillo-muted mb-4">
              Your request wasn&apos;t approved this time. You can submit a new request below.
            </p>
            <button
              onClick={() => setStatus('none')}
              className="w-full bg-armadillo-card border border-armadillo-border text-armadillo-text py-3.5 rounded-xl font-medium text-sm active:scale-95 transition-transform min-h-[44px]"
            >
              Request Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
