'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User as SupabaseUser, AuthError } from '@supabase/supabase-js';

export type UserRole = 'user' | 'organizer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  venueName?: string;
  createdAt: string;
  emailVerified: boolean;
}

interface Profile {
  id: string;
  role: UserRole;
  name: string | null;
  venue_name: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isOrganizer: boolean;
  refreshUser: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'organizer';
  venueName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fetch profile from profiles table
async function fetchProfile(userId: string): Promise<Profile | null> {
  console.log('[Auth] Fetching profile for user:', userId);
  
  const { data, error, status } = await supabase
    .from('profiles')
    .select('id, role, name, venue_name')
    .eq('id', userId)
    .single();

  console.log('[Auth] Profile fetch result:', { data, error, status });

  if (error) {
    // PGRST116 = no rows found (profile doesn't exist)
    if (error.code === 'PGRST116') {
      console.log('[Auth] No profile found for user, will create one');
      return null;
    }
    console.error('[Auth] Error fetching profile:', error.message, error.code);
    return null;
  }

  console.log('[Auth] Profile loaded successfully:', data);
  return data;
}

// Create profile in profiles table
async function createProfile(
  userId: string, 
  role: UserRole, 
  name: string, 
  venueName?: string
): Promise<Profile | null> {
  console.log('[Auth] Creating profile:', { userId, role, name, venueName });
  
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      role,
      name,
      venue_name: venueName || null,
    })
    .select()
    .single();

  if (error) {
    // Profile might already exist (created by trigger), try to fetch it
    if (error.code === '23505') { // unique violation
      console.log('[Auth] Profile already exists, fetching it');
      return fetchProfile(userId);
    }
    console.error('[Auth] Error creating profile:', error.message, error.code);
    return null;
  }

  console.log('[Auth] Profile created successfully:', data);
  return data;
}

// Helper to build User object from Supabase user + profile
function buildUser(supabaseUser: SupabaseUser, profile: Profile | null): User {
  const metadata = supabaseUser.user_metadata || {};
  const finalRole = profile?.role || (metadata.role as UserRole) || 'user';
  
  // Check if email is verified
  const emailVerified = !!supabaseUser.email_confirmed_at || !!supabaseUser.confirmed_at;
  
  console.log('[Auth] Building user object:', {
    profileRole: profile?.role,
    metadataRole: metadata.role,
    finalRole,
    emailVerified,
  });
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: profile?.name || metadata.name || metadata.full_name || supabaseUser.email?.split('@')[0] || 'User',
    role: finalRole,
    venueName: profile?.venue_name || metadata.venueName,
    createdAt: supabaseUser.created_at,
    emailVerified,
  };
}

// Helper to format auth errors into user-friendly messages
function formatAuthError(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'Email not confirmed':
      return 'Please verify your email address before signing in.';
    case 'User already registered':
      return 'An account with this email already exists. Please sign in instead.';
    default:
      if (error.message.includes('Password')) {
        return error.message;
      }
      if (error.message.includes('email')) {
        return error.message;
      }
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user with profile from profiles table
  const loadUserWithProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    console.log('[Auth] Loading user with profile:', supabaseUser.id);
    
    // Check if email is verified - if not, don't load user
    const emailVerified = !!supabaseUser.email_confirmed_at || !!supabaseUser.confirmed_at;
    if (!emailVerified) {
      console.log('[Auth] Email not verified, not loading user');
      setUser(null);
      return;
    }
    
    let profile = await fetchProfile(supabaseUser.id);
    
    // If no profile exists, create one with default role from metadata
    if (!profile) {
      const metadata = supabaseUser.user_metadata || {};
      const defaultRole = (metadata.role as UserRole) || 'user';
      console.log('[Auth] Creating missing profile with role:', defaultRole);
      
      profile = await createProfile(
        supabaseUser.id,
        defaultRole,
        metadata.name || metadata.full_name || supabaseUser.email?.split('@')[0] || 'User',
        metadata.venueName
      );
    }
    
    const builtUser = buildUser(supabaseUser, profile);
    console.log('[Auth] Final user state:', builtUser);
    setUser(builtUser);
  }, []);

  const refreshUser = useCallback(async () => {
    console.log('[Auth] Refreshing user...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserWithProfile(session.user);
      } else {
        console.log('[Auth] No session found');
        setUser(null);
      }
    } catch (error) {
      console.error('[Auth] Failed to refresh user:', error);
      setUser(null);
    }
  }, [loadUserWithProfile]);

  // Initialize auth state and subscribe to changes
  useEffect(() => {
    console.log('[Auth] Initializing auth state...');
    
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[Auth] Initial session:', session ? 'found' : 'none');
      if (session?.user) {
        await loadUserWithProfile(session.user);
      }
      setIsLoading(false);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state changed:', event);
        if (session?.user) {
          await loadUserWithProfile(session.user);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserWithProfile]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[Auth] Login attempt for:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        console.error('[Auth] Login error:', error.message);
        return { success: false, error: formatAuthError(error) };
      }

      if (data.user) {
        // Check if email is verified before loading user
        const emailVerified = !!data.user.email_confirmed_at || !!data.user.confirmed_at;
        if (!emailVerified) {
          return { success: false, error: 'Please verify your email address before signing in. Check your inbox for a verification email.' };
      }
        console.log('[Auth] Login successful, loading profile...');
        await loadUserWithProfile(data.user);
      return { success: true };
      }

      return { success: false, error: 'Failed to sign in. Please try again.' };
    } catch (error) {
      console.error('[Auth] Login exception:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> => {
    console.log('[Auth] Register attempt:', { email: data.email, role: data.role });
    try {
      // Sign up with Supabase Auth
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.toLowerCase().trim(),
        password: data.password,
        options: {
          data: {
            name: data.name,
            full_name: data.name,
            role: data.role,
            venueName: data.role === 'organizer' ? data.venueName : undefined,
          },
        },
      });

      if (error) {
        console.error('[Auth] Registration error:', error.message);
        return { success: false, error: formatAuthError(error) };
      }

      if (authData.user) {
        // Check if email confirmation is required
        if (authData.user.identities?.length === 0) {
          return { 
            success: false, 
            error: 'An account with this email already exists. Please sign in instead.' 
          };
        }

        console.log('[Auth] Registration successful, creating profile...');
        
        // Create profile in profiles table (if trigger didn't do it)
        const profile = await createProfile(
          authData.user.id,
          data.role,
          data.name,
          data.role === 'organizer' ? data.venueName : undefined
        );

        // Check if email is verified - if not, don't set user (they need to verify first)
        const emailVerified = !!authData.user.email_confirmed_at || !!authData.user.confirmed_at;

        if (emailVerified) {
          setUser(buildUser(authData.user, profile));
          return { success: true };
        } else {
          // Email not verified - return success but don't set user
          // The registration page will show the verification message
          return { success: true, needsVerification: true };
        }
      }

      return { success: false, error: 'Failed to create account. Please try again.' };
    } catch (error) {
      console.error('[Auth] Registration exception:', error);
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };

  const logout = async () => {
    console.log('[Auth] Logging out...');
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAdmin: user?.role === 'admin',
        isOrganizer: user?.role === 'organizer' || user?.role === 'admin',
        refreshUser,
        resendVerificationEmail: async (email: string) => {
          try {
            const { error } = await supabase.auth.resend({
              type: 'signup',
              email: email.toLowerCase().trim(),
            });

            if (error) {
              console.error('[Auth] Resend verification error:', error.message);
              return { success: false, error: error.message };
            }

            return { success: true };
          } catch (error) {
            console.error('[Auth] Resend verification exception:', error);
            return { success: false, error: 'Failed to resend verification email. Please try again.' };
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
