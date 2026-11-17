'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Lock,
  User,
} from '@phosphor-icons/react';
import { AuthShell } from '@/components/auth/auth-shell';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      router.push(data.redirectTo || '/patient');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="tf-auth__card">
        <div className="tf-auth__kicker">
          <i />
          Patient registration
        </div>
        <h1 className="tf-auth__title">Create account.</h1>
        <p className="tf-auth__sub">
          One account for booking, live status updates and every visit on record.
        </p>

        {error && (
          <div className="tf-error" role="alert" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="tf-field">
            <label htmlFor="register-name">Full name</label>
            <div className="tf-field__control">
              <User size={16} />
              <input
                id="register-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nusrat Jahan"
              />
            </div>
          </div>

          <div className="tf-field">
            <label htmlFor="register-email">Email address</label>
            <div className="tf-field__control">
              <EnvelopeSimple size={16} />
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="tf-field">
            <label htmlFor="register-password">Password</label>
            <div className="tf-field__control">
              <Lock size={16} />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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

          <div className="tf-field">
            <label htmlFor="register-confirm">Confirm password</label>
            <div className="tf-field__control">
              <Lock size={16} />
              <input
                id="register-confirm"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
            </div>
          </div>

          <button type="submit" className="tf-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
            {!loading && <ArrowRight size={15} weight="bold" />}
          </button>
        </form>

        <div className="tf-foot">
          <span>Already have an account?</span>
          <Link href="/login?portal=patient">Patient login</Link>
          <Link href="/login?portal=admin" style={{ marginLeft: 'auto' }}>
            Staff access
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
