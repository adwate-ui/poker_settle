/**
 * User Configuration Service
 * Loads user-specific configurations and initializes services
 */

import { supabase } from '@/integrations/supabase/client';
import { emailService } from './emailService';
import { UserPreferences } from '@/types/poker';

/**
 * Load and apply user-specific email configuration
 */
export async function initializeUserEmailConfig(userId: string): Promise<boolean> {
  try {
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('email_service_id, email_template_id, email_public_key, email_from_address, email_from_name')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.log('No user email preferences found, using defaults or environment variables');
      return false;
    }

    if (!preferences) {
      return false;
    }

    // Check if user has configured email settings
    const hasEmailConfig = !!(
      preferences.email_service_id &&
      preferences.email_template_id &&
      preferences.email_public_key &&
      preferences.email_from_address
    );

    if (hasEmailConfig) {
      emailService.configure({
        serviceId: preferences.email_service_id!,
        templateId: preferences.email_template_id!,
        publicKey: preferences.email_public_key!,
        fromEmail: preferences.email_from_address!,
        fromName: preferences.email_from_name || 'Poker Settle',
      });
      
      console.log('✅ User email configuration loaded successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to load user email configuration:', error);
    return false;
  }
}

/**
 * Get user payment confirmation keywords
 */
export async function getUserPaymentKeywords(userId: string): Promise<string[]> {
  try {
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('payment_keywords')
      .eq('user_id', userId)
      .single();

    if (error || !preferences) {
      // Return default keywords
      return ['PAID', 'DONE', 'SETTLED', 'COMPLETE', 'CONFIRMED'];
    }

    return preferences.payment_keywords || ['PAID', 'DONE', 'SETTLED', 'COMPLETE', 'CONFIRMED'];
  } catch (error) {
    console.error('Failed to load user payment keywords:', error);
    return ['PAID', 'DONE', 'SETTLED', 'COMPLETE', 'CONFIRMED'];
  }
}

/**
 * Check if user has custom Supabase configuration
 */
export async function hasCustomSupabaseConfig(userId: string): Promise<boolean> {
  try {
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('custom_supabase_url, custom_supabase_key')
      .eq('user_id', userId)
      .single();

    if (error || !preferences) {
      return false;
    }

    return !!(preferences.custom_supabase_url && preferences.custom_supabase_key);
  } catch (error) {
    console.error('Failed to check custom Supabase config:', error);
    return false;
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Failed to load user preferences:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return null;
  }
}
