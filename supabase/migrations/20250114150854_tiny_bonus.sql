/*
  # Fix profiles table RLS policies

  1. Changes
    - Add policy for inserting own profile
    - Update existing policies to use proper auth checks
    - Add policy for authenticated users to update their own profile
  
  2. Security
    - Ensure users can only manage their own profile data
    - Maintain strict RLS enforcement
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create comprehensive policies
CREATE POLICY "Users can manage own profile"
  ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Enable insert for authenticated users
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow public to read profiles (needed for foreign key relationships)
CREATE POLICY "Public can read profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);