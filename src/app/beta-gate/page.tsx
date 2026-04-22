'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Shield, Loader2, CheckCircle, Clock, XCircle, Send } from 'lucide-react';

type BetaStatus = 'loading' | 'none' | 'pending' | 'approved' | 'denied';

export default function DesktopBetaGate() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [status, setStatus] = useState<BetaStatus>('loading');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/');
      return;
    }

    fetch('/api/beta/status')
      .then(r => r.json())
      .then(data => {
        if (data.status === 'approved') {
          document.cookie = 'beta_approved=1; path=/; max-age=31536000';
          router.replace('/');
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-burnt" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-burnt/15 flex items-center justify-center mx-auto mb-8">
          <Shield size={40} className="text-burnt" />
        </div>

        {status === 'none' && (
          <>
            <h1 className="font-display text-3xl text-armadillo-text mb-3">Request Beta Access</h1>
            <p className="text-armadillo-muted mb-8">
              Armadillo Analytics is in private beta. Submit a request and we&apos;ll review your application.
            </p>
            <div className="space-y-4 text-left">
              <textarea
                placeholder="Why do you want access? (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full bg-armadillo-card border border-armadillo-border rounded-xl px-4 py-3 text-sm text-armadillo-text placeholder:text-armadillo-muted/50 resize-none"
              />
              {error && (
                <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 text-sm text-danger">
                  {error}
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-burnt hover:bg-burnt-light text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-60"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {submitting ? 'Submitting...' : 'Request Access'}
              </button>
            </div>
          </>
        )}

        {status === 'pending' && (
          <>
            <Clock size={40} className="text-burnt mx-auto mb-4" />
            <h1 className="font-display text-3xl text-armadillo-text mb-3">Request Received</h1>
            <p className="text-armadillo-muted">
              Your beta request is being reviewed. Check back soon.
            </p>
          </>
        )}

        {status === 'approved' && (
          <>
            <CheckCircle size={40} className="text-success mx-auto mb-4" />
            <h1 className="font-display text-3xl text-armadillo-text mb-3">You&apos;re In!</h1>
            <p className="text-armadillo-muted mb-6">Welcome to Armadillo Analytics.</p>
            <button
              onClick={() => {
                document.cookie = 'beta_approved=1; path=/; max-age=31536000';
                router.push('/');
              }}
              className="bg-burnt hover:bg-burnt-light text-white px-8 py-3 rounded-xl font-medium transition-colors"
            >
              Get Started
            </button>
          </>
        )}

        {status === 'denied' && (
          <>
            <XCircle size={40} className="text-danger mx-auto mb-4" />
            <h1 className="font-display text-3xl text-armadillo-text mb-3">Not Approved</h1>
            <p className="text-armadillo-muted mb-6">Your request wasn&apos;t approved this time.</p>
            <button
              onClick={() => setStatus('none')}
              className="bg-armadillo-card border border-armadillo-border text-armadillo-text px-8 py-3 rounded-xl font-medium"
            >
              Request Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
