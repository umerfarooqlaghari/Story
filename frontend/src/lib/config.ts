// Centralized configuration for Web Frontend

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
).replace(/\/$/, '');

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qbdeadqwfyostiyfcdvl.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
