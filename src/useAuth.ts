import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Surface any error from a previous redirect flow. onAuthStateChanged
    // restores the session itself, so we just log here.
    getRedirectResult(auth).catch((e) => {
      console.error("redirect result failed", e);
    });

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async () => {
    try {
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (e) {
      console.error("sign-in failed", e);
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  return { user, loading, signIn, signOut };
}
