import { QuickCapture } from './components/QuickCapture';
import { Auth } from './components/Auth';
import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function PrefixGuide() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-8 p-4 bg-black/70 backdrop-blur-sm rounded-2xl border border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-gray-300 hover:text-gray-50 py-2"
      >
        <h2 className="text-base font-medium">Quick Guide</h2>
        <span className="text-lg">
          {isExpanded ? '−' : '+'}
        </span>
      </button>
      
      {isExpanded && (
        <div className="mt-4 space-y-6">
          <div className="text-sm text-gray-300">
            <h3 className="text-base font-medium text-gray-50 mb-2">Welcome to Quick Capture!</h3>
            <p className="mb-2">This is your personal knowledge base where you can quickly jot down thoughts and connect them to the relevant people, ideas, actions, and tags for easy lookup later.</p>
            <p>Here are the prefix types you can use to organize your entries:</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-gray-800 text-gray-50 rounded-lg font-mono text-sm">@</span>
                <span className="text-gray-300 text-sm">People (e.g., @john-doe)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-gray-800 text-gray-50 rounded-lg font-mono text-sm">!</span>
                <span className="text-gray-300 text-sm">Actions (e.g., !finish-report)</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-gray-800 text-gray-50 rounded-lg font-mono text-sm">?</span>
                <span className="text-gray-300 text-sm">Ideas (e.g., ?new-feature)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-gray-800 text-gray-50 rounded-lg font-mono text-sm">#</span>
                <span className="text-gray-300 text-sm">Tags (e.g., #work)</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-300">
            <p className="font-medium text-gray-50">How to use prefixes:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Type a prefix symbol (@, !, ?, #) to start adding a prefix</li>
              <li>Type the prefix value and select from existing suggestions or press Enter to create a new one</li>
              <li>Use the prefix search below to filter entries by prefix type or specific prefixes</li>
              <li>Click on the edit or delete buttons on an entry to edit or remove it</li>
              <li>Click "x" on an entry's tag in edit mode to remove that prefix from the entry</li>
              <li>Press ⌘ + Enter to save your entry</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-black to-gray-950 flex items-center justify-center">
        <div className="text-gray-400 font-mono">Loading...</div>
      </div>
    );
  }

  if (!user) {
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
