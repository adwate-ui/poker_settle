import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xfahfllkbutljcowwxpx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYWhmbGxrYnV0bGpjb3d3eHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDg3MzUsImV4cCI6MjA3NDM4NDczNX0.Rh5OkVXAlP_qHfO3Oqaq4Jd17SnR_t8ffAv3n-ZmASE";

// Anonymous Supabase client for public operations
export const supabaseAnon = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Create a separate Supabase client for shared views that injects the share token
export const createSharedClient = (shareToken: string) => {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        'x-share-token': shareToken,
      },
    },
  });
};
