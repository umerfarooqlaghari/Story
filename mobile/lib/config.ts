// Centralized environment configuration for Mobile

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'
).replace(/\/$/, '');

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qbdeadqwfyostiyfcdvl.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZGVhZHF3Znlvc3RpeWZjZHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODA0OTMsImV4cCI6MjEwNzA1NjQ5M30.Rk35HfJ6Vje-7ZdE8PK7rxPcnmm-w530yr5EkngitmU';
