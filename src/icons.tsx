import React from "react";

export const LockIcon: React.FC = () => (
  <svg
    className="lock-icon"
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3H9z" />
  </svg>
);

export const FlameIcon: React.FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14a8 8 0 0 0 16 0c0-4.16-2-7.88-6.5-13.33zM11.71 19a3.04 3.04 0 0 1-3.04-2.99c0-1.6 1.04-2.73 2.74-3.07 1.7-.34 3.46-1.16 4.45-2.48.38 1.25.58 2.57.58 3.91 0 2.59-2.13 4.63-4.73 4.63z"/>
  </svg>
);

export const ShareIcon: React.FC = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

export const GoogleIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.78 2.72v2.26h2.88c1.69-1.55 2.66-3.84 2.66-6.62z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.88-2.26c-.8.54-1.83.86-3.08.86-2.36 0-4.36-1.6-5.07-3.74H.91v2.34A8.99 8.99 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.93 10.68A5.4 5.4 0 0 1 3.64 9c0-.58.1-1.15.29-1.68V4.98H.91A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.91 4.02l3.02-2.34z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .91 4.98l3.02 2.34C4.64 5.18 6.64 3.58 9 3.58z" />
  </svg>
);
