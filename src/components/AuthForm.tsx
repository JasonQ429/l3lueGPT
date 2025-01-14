import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AuthFormProps {
  isDark: boolean;
}

export function AuthForm({ isDark }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const createProfile = async (userId: string, userEmail: string) => {
    const { error } = await supabase
      .from('profiles')
      .insert([{ id: userId, email: userEmail }]);
    
    if (error) {
      if (error.code === '23505') { // Duplicate key error
        return; // Profile already exists, which is fine
      }
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error('Failed to create user');

        await createProfile(authData.user.id, authData.user.email);
        toast.success('Account created successfully!');
      } else {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        if (!authData.user) throw new Error('Failed to sign in');

        await createProfile(authData.user.id, authData.user.email);
        toast.success('Signed in successfully!');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-6">
      <h2 className="text-2xl font-bold text-center mb-8">
        {isSignUp ? 'Create an account' : 'Sign in to l3lueGPT'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`input-base ${isDark ? 'input-dark' : 'input-light'}`}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`input-base ${isDark ? 'input-dark' : 'input-light'}`}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full btn-primary ${isDark ? 'btn-primary-dark' : 'btn-primary-light'}`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            isSignUp ? 'Sign up' : 'Sign in'
          )}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className={`font-medium ${isDark ? 'text-[#00E5FF]' : 'text-[#1E90FF]'} hover:opacity-80`}
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </button>
      </p>
    </div>
  );
}