import React from "react";
import type { User } from "firebase/auth";
import { GoogleIcon } from "./icons";

export const AuthWidget: React.FC<{
  user: User | null;
  loading: boolean;
  signIn: () => void;
  signOut: () => void;
  compact?: boolean;
}> = ({ user, loading, signIn, signOut, compact }) => {
  if (loading) return <div className="auth-loading" aria-hidden="true" />;
  if (!user) {
    return (
      <button className={"sign-in-btn" + (compact ? " compact" : "")} onClick={signIn}>
        <GoogleIcon /> Sign in
      </button>
    );
  }
  return (
    <div className={"user-chip" + (compact ? " compact" : "")}>
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          className="user-avatar"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="user-avatar fallback">
          {(user.displayName ?? user.email ?? "?").slice(0, 1).toUpperCase()}
        </div>
      )}
      {!compact && (
        <div className="user-meta">
          <div className="user-name">{user.displayName ?? user.email}</div>
          <button className="link-btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      )}
      {compact && (
        <button
          className="link-btn compact-signout"
          onClick={signOut}
          aria-label="Sign out"
          title="Sign out"
        >
          ↩
        </button>
      )}
    </div>
  );
};
