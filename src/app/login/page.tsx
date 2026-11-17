'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Lock,
  ShieldCheck,
  User,
} from '@phosphor-icons/react';
import { AuthShell } from '@/components/auth/auth-shell';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const portalParam = searchParams.get('portal') || searchParams.get('role');
  const doctorParam = searchParams.get('doctor');

  const [activePortal, setActivePortal] = useState<'patient' | 'admin'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (portalParam === 'admin') {
      setActivePortal('admin');
      setEmail('assistant@medislot.com');
      setPassword('123456');
    } else {
      setActivePortal('patient');
      setEmail('');
      setPassword('');
    }
  }, [portalParam]);

  const handlePortalSwitch = (portal: 'patient' | 'admin') => {
    setActivePortal(portal);
    setError('');
    if (portal === 'admin') {
      setEmail('assistant@medislot.com');
      setPassword('123456');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      if (activePortal === 'admin' && data.user.role !== 'assistant') {
        setError('This account does not have Admin privileges. Please use Patient Login.');
        setLoading(false);
        return;
      }

      if (data.redirectTo === '/patient' && doctorParam) {
        router.push(`/patient?doctor=${doctorParam}`);
      } else {
        router.push(data.redirectTo || (data.user.role === 'assistant' ? '/admin' : '/patient'));
      }
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const isAdmin = activePortal === 'admin';

  return (
    <div className="tf-auth__card">
      <div className="tf-auth__kicker">
        <i />
        {isAdmin ? 'Hospital staff portal' : 'Patient portal'}
      </div>
      <h1 className="tf-auth__title">{isAdmin ? 'Staff sign in.' : 'Welcome back.'}</h1>
      <p className="tf-auth__sub">
        {isAdmin
          ? 'Access the triage queue, doctor shifts and patient records.'
          : 'Track appointments, free slots and every status update.'}
      </p>

      <div className="tf-toggle" role="group" aria-label="Choose portal">
        <button type="button" aria-pressed={!isAdmin} onClick={() => handlePortalSwitch('patient')}>
          <User size={14} weight={!isAdmin ? 'fill' : 'regular'} />
          Patient
        </button>
        <button type="button" aria-pressed={isAdmin} onClick={() => handlePortalSwitch('admin')}>
          <ShieldCheck size={14} weight={isAdmin ? 'fill' : 'regular'} />
          Hospital staff
        </button>
      </div>

      {error && (
        <div className="tf-error" role="alert" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="tf-field">
          <label htmlFor="login-email">{isAdmin ? 'Admin email address' : 'Email address'}</label>
          <div className="tf-field__control">
            <EnvelopeSimple size={16} />
            <input
              id="login-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isAdmin ? 'assistant@medislot.com' : 'patient@example.com'}
            />
          </div>
        </div>

        <div className="tf-field">
          <label htmlFor="login-password">Password</label>
          <div className="tf-field__control">
            <Lock size={16} />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              className="tf-eye"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" className="tf-submit" disabled={loading}>
          {loading ? 'Authenticating…' : isAdmin ? 'Enter the staff console' : 'Sign in'}
          {!loading && <ArrowRight size={15} weight="bold" />}
        </button>
      </form>

      {isAdmin && (
        <div className="tf-helper">
          <div>
            <strong>Demo staff account</strong>
            <span>assistant@medislot.com · 123456</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('assistant@medislot.com');
              setPassword('123456');
            }}
          >
            Autofill
          </button>
        </div>
      )}

      <div className="tf-foot">
        {!isAdmin ? (
          <>
            <span>New patient?</span>
            <Link href="/register">Create an account</Link>
            <Link href="/login?portal=admin" style={{ marginLeft: 'auto' }}>
              Staff access
            </Link>
          </>
        ) : (
          <>
            <span>Looking for the patient portal?</span>
            <Link href="/login?portal=patient">Patient sign in</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="tf-auth__card" style={{ opacity: 0.5 }}>Loading portal…</div>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
