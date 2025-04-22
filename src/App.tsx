import { QuickCapture } from './components/QuickCapture';
import { Auth } from './components/Auth';
import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';

function PrefixGuide() {
  return (
    <div className="mb-8 p-6 bg-black/50 backdrop-blur-sm rounded-2xl border border-gray-800">
      <h2 className="text-base font-medium text-gray-400 mb-4">Quick Guide</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg font-mono text-sm">@</span>
            <span className="text-gray-400 text-sm">People (e.g., @john-doe)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg font-mono text-sm">!</span>
            <span className="text-gray-400 text-sm">Actions (e.g., !finish-report)</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg font-mono text-sm">?</span>
            <span className="text-gray-400 text-sm">Ideas (e.g., ?new-feature)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg font-mono text-sm">#</span>
            <span className="text-gray-400 text-sm">Tags (e.g., #work)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === null) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-black to-gray-950 flex items-center justify-center">
        <div className="text-gray-400 font-mono">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-black to-gray-950 flex items-center justify-center p-6">
        <Auth />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black to-gray-950 flex flex-col">
      <header className="w-full border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-8 flex justify-between items-center">
          <h1 className="text-2xl font-medium text-gray-100">Quick Capture</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-gray-400 hover:text-gray-300 font-mono"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="flex-1 w-full flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="space-y-8">
            <PrefixGuide />
            <QuickCapture />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
