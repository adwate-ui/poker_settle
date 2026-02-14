import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type SharedScope = {
    type: 'game' | 'player';
    resourceId: string;
    ownerId: string;
};

interface SharedContextType {
    sharedClient: SupabaseClient;
    scope: SharedScope | null;
    isLoading: boolean;
    isValid: boolean;
    isGameToken: boolean;
    isPlayerToken: boolean;
}

const SharedContext = createContext<SharedContextType | undefined>(undefined);

export const SharedProvider = ({ children }: { children: React.ReactNode }) => {
    const [scope, setScope] = useState<SharedScope | null>(null);
    const [sharedClient, setSharedClient] = useState<SupabaseClient>(supabase);
    const [isLoading, setIsLoading] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const { token } = useParams<{ token: string }>();
    const { user } = useAuth();

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }

            // If the user is a shared user, we don't need to validate the token via RPC
            if (user?.user_metadata?.is_shared_user) {
                // For shared users, the token is implicitly valid if they are logged in via the shared link.
                // We can derive scope from the token itself or assume it's handled by RLS.
                // For now, we'll just set it as valid and let RLS handle access.
                setIsValid(true);
                setIsLoading(false);
                // Optionally, parse token to set scope if needed for UI logic
                // For this context, we'll rely on RLS for data access.
                return;
            }

            try {
                // 1. Validate token via RPC and get owner_id
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: ownerId, error } = await supabase.rpc('get_shared_link_owner' as any, {
                    _token: token
                });

                if (error || !ownerId) {
                    console.error('Invalid token:', error);
                    setIsValid(false);
                    setIsLoading(false);
                    return;
                }

                // 2. Fetch link details to determine scope via RPC (avoids RLS)
                const { data: linkData, error: linkError } = await supabase
                    .rpc('validate_share_token', { _token: token })
                    .maybeSingle();

                if (linkError || !linkData) {
                    console.error('Link not found or invalid:', linkError);
                    setIsValid(false);
                    setIsLoading(false);
                    return;
                }

                const newScope: SharedScope = {
                    type: linkData.resource_type as 'game' | 'player',
                    resourceId: linkData.resource_id,
                    ownerId: ownerId as unknown as string
                };

                setScope(newScope);
                setIsValid(true);

                // 3. Create scoped client with custom header
                const customClient = createSharedClient(token);
                setSharedClient(customClient);

            } catch (err) {
                console.error('Token validation failed:', err);
                setIsValid(false);
            } finally {
                setIsLoading(false);
            }
        };

        validateToken();
    }, [token, user]);

    // Helper to create client with specific headers
    const createSharedClient = (accessToken: string) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        return new SupabaseClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    'x-share-token': accessToken
                }
            }
        });
    };

    return (
        <SharedContext.Provider value={{
            sharedClient,
            scope,
            isLoading,
            isValid,
            isGameToken: scope?.type === 'game',
            isPlayerToken: scope?.type === 'player'
        }}>
            {children}
        </SharedContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSharedContext = () => {
    const context = useContext(SharedContext);
    if (context === undefined) {
        throw new Error('useSharedContext must be used within a SharedProvider');
    }
    return context;
};
