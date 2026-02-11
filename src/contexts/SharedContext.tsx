import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

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
    const navigate = useNavigate();

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                // 1. Validate token via RPC and get owner_id
                // @ts-ignore - RPC not yet typed
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
                // @ts-ignore - RPC not yet typed
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
    }, [token]);

    // Helper to create client with specific headers
    const createSharedClient = (accessToken: string) => {
        // We can't actually "create" a new supabase client easily deeply integrated with the same auth persistence,
        // but for RLS via public access, we just need to pass the header.
        // However, the standard supabase client in @supabase/supabase-js allows setting global headers.
        // Creating a fresh instance is cleaner.

        // NOTE: This assumes we are using the project URL and Key from env
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

export const useSharedContext = () => {
    const context = useContext(SharedContext);
    if (context === undefined) {
        throw new Error('useSharedContext must be used within a SharedProvider');
    }
    return context;
};
