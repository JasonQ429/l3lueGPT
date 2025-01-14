import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

// Ensure environment variables are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Please click "Connect to Supabase" button to set up your database connection.'
  );
}

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-client-info': 'l3lueGPT'
    }
  }
});

// Enhanced auth state management
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event);
  
  switch (event) {
    case 'SIGNED_OUT':
      // Clear all auth-related data
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('currentChatId');
      break;
      
    case 'SIGNED_IN':
      // Verify session is valid
      if (!session?.user?.id) {
        console.error('Invalid session after sign in');
        toast.error('Sign in failed. Please try again.');
        supabase.auth.signOut();
      }
      break;
      
    case 'TOKEN_REFRESHED':
      console.log('Auth token refreshed successfully');
      break;
      
    case 'USER_UPDATED':
      console.log('User profile updated');
      break;
  }
});

// Connection state management
let isConnected = true;
let consecutiveFailures = 0;
const MAX_FAILURES = 3;

const healthCheck = async () => {
  try {
    // Only perform health check if we're authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('profiles').select('id').limit(1).maybeSingle();
    
    // Only consider it an error if it's not an auth error
    if (error && error.code !== 'PGRST301') {
      consecutiveFailures++;
      
      if (consecutiveFailures >= MAX_FAILURES && isConnected) {
        isConnected = false;
        console.error('Connection health check failed:', error);
        toast.error('Connection lost. Retrying...', { id: 'connection-error' });
      }
    } else {
      if (!isConnected) {
        isConnected = true;
        consecutiveFailures = 0;
        toast.success('Connection restored', { id: 'connection-restored' });
      }
      consecutiveFailures = 0;
    }
  } catch (error) {
    // Only log and notify if we have multiple consecutive failures
    consecutiveFailures++;
    if (consecutiveFailures >= MAX_FAILURES) {
      console.error('Health check error:', error);
    }
  }
};

// Run health check less frequently
setInterval(healthCheck, 60000); // Every 60 seconds

export default supabase;