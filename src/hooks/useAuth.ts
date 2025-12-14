import { useState, useEffect, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext, AuthContextType } from '@/contexts/AuthContext';

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
    let timeoutId: number | null = null;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          // Clear the timeout since auth state changed successfully
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          // Clean up hash fragment after successful sign in
          if (event === 'SIGNED_IN' && window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
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
        const hasAuthHash = typeof window !== 'undefined' && 
          window.location.hash && 
          (window.location.hash.includes('access_token') || 
           window.location.hash.includes('id_token') || 
           window.location.hash.includes('refresh_token'));
        if (!hasAuthHash) {
          setLoading(false);
        } else {
          // Set a safety timeout to prevent infinite loading
          // If onAuthStateChange doesn't fire within 5 seconds, stop loading anyway
          timeoutId = window.setTimeout(() => {
            if (mounted) {
              console.warn('Auth state change timeout - stopping loading state');
              setLoading(false);
              // Clean up hash
              window.history.replaceState(null, '', window.location.pathname);
            }
          }, 5000);
        }
        // If there is an auth hash, wait for onAuthStateChange to set loading=false
      }
    });

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
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