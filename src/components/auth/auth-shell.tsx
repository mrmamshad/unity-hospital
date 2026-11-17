'use client';

import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';
import './auth.css';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="tf-auth">
      <aside className="tf-auth__visual">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/terafab/assets/terafab/hospital-campus.webp" alt="" aria-hidden />
        <div className="tf-auth__shade" aria-hidden />

        <Link href="/" className="tf-auth__brand">
          Unity <span>Hospital</span>
        </Link>

        <div className="tf-auth__quote">
          <p>Unity Hospital</p>
          <h2>
            Care, without
            <br />
            the wait.
          </h2>
          <span>One record from the first request to the confirmed visit.</span>
        </div>
      </aside>

      <main className="tf-auth__main">
        <Link href="/" className="tf-auth__back">
          <ArrowLeft size={13} weight="bold" />
          Back to home
        </Link>
        {children}
      </main>
    </div>
  );
}
