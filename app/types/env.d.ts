/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

declare global {
  interface Window {
    ENV: {
      NODE_ENV: 'development' | 'production' | 'test';
      PUBLIC_API_URL?: string;
      PUBLIC_SUPABASE_URL?: string;
      PUBLIC_SUPABASE_ANON_KEY?: string;
    };
  }
}

export {};