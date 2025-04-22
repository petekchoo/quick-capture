import { useState, useEffect, useRef } from 'react';

interface PrefixEditorProps {
  prefixSymbol: string;
  onComplete: (value: string) => void;
  onCancel: () => void;
}

export function PrefixEditor({ prefixSymbol, onComplete, onCancel }: PrefixEditorProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onComplete(value.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg max-w-md w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-green-500 font-mono">{prefixSymbol}</span>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1 bg-gray-800 text-gray-100 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter prefix value..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Prefix
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 