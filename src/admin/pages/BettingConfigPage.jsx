import React, { useState } from 'react';
import { Sliders, Save, Loader2 } from 'lucide-react';
import authService from '../services/authService';

const BettingConfigPage = () => {
  const [multiplier, setMultiplier] = useState(0.75);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSave = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await authService.updateBettingConfig(Number(multiplier));
      setMessage({ text: 'Betting config updated successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update config.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Betting Configuration</h2>
          <p className="text-white/50 mt-1">Adjust system-wide betting multipliers.</p>
        </div>
      </div>

      <div className="glass-card p-6 max-w-xl">
        <label className="block text-sm font-bold text-white/70 mb-2 flex items-center gap-2">
          <Sliders size={16} className="text-prime" />
          Profit Multiplier
        </label>
        <p className="text-xs text-white/40 mb-4">Set the profit return multiplier for winning bets (e.g., 0.75 means a 75% return).</p>
        
        <input 
          type="number"
          step="0.01"
          min="0"
          value={multiplier}
          onChange={(e) => setMultiplier(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-prime/50 transition-all mb-4"
        />

        {message.text && (
          <div className={`p-3 rounded-lg text-sm mb-4 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {message.type === 'success' ? '✅ ' : '❌ '}
            {message.text}
          </div>
        )}

        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-prime/20 border border-prime/30 text-prime rounded-xl font-bold hover:bg-prime hover:text-white transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default BettingConfigPage;
