import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { Key, Trash2, Plus } from 'lucide-react';

// API Key Ring Component
export const ApiKeyRing: React.FC = () => {
  const { keyRing, addKeyToRing, removeKeyFromRing } = useUser();
  const [newKey, setNewKey] = useState('');

  const handleAdd = () => {
    if (newKey.trim()) {
      addKeyToRing(newKey.trim());
      setNewKey('');
    }
  };

  return (
    <div className="w-full bg-white rounded-none border border-nous-border p-8">
      <div className="flex justify-between items-start mb-6">
        <h2 className="font-serif text-2xl italic">API Key Ring</h2>
        <Key size={16} className="text-nous-subtle" />
      </div>
      
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="password"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Enter API Key..."
            className="flex-grow px-4 py-3 bg-nous-base border border-nous-border rounded-none focus:outline-none focus:border-nous-border dark:focus:border-nous-border transition-colors text-nous-text text-xs font-mono"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-3 bg-nous-text text-nous-base rounded-none hover:bg-nous-text0 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {keyRing.map((key, i) => (
          <div key={i} className="flex items-center justify-between text-xs font-mono border-l-2 border-nous-border pl-3 py-2 bg-nous-base/50">
            <span className="truncate">••••••••{key.slice(-4)}</span>
            <button onClick={() => removeKeyFromRing(key)} className="text-red-500 ml-2">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {keyRing.length === 0 && (
          <p className="text-xs text-nous-subtle italic font-mono">No keys in ring.</p>
        )}
      </div>
    </div>
  );
};
