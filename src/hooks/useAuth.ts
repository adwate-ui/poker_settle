import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    // Initialize session - this will handle OAuth hash fragments
    // and trigger onAuthStateChange if authentication state changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        // If we have a session from localStorage, set it immediately
        // If there's a hash fragment, Supabase will process it and trigger onAuthStateChange
        setSession(session);
        setUser(session?.user ?? null);
        // Only set loading to false if we're sure there's no hash fragment to process
        // Check if there are hash params that might be OAuth tokens
        const hasAuthHash = window.location.hash.includes('access_token');
        if (!hasAuthHash) {
          setLoading(false);
        }
        // If there is an auth hash, wait for onAuthStateChange to set loading=false
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
    
    if (error) {
      console.error('Error signing in:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      throw error;
    }
  };

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  };
};

export { AuthContext };