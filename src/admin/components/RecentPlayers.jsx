import React, { memo } from 'react';

const safeGet = (obj, mainKey, fallbackKeys, defaultVal) => {
  if (!obj) return defaultVal;
  if (obj[mainKey] !== undefined) return obj[mainKey];
  for (let key of fallbackKeys) {
    if (obj[key] !== undefined) return obj[key];
  }
  return defaultVal;
};

const RecentPlayers = memo(({ players: playersProp = [] }) => {
  const players = playersProp || [];

  return (
    <div className="glass-card p-5 sm:p-8 flex flex-col h-full">
      <h3 className="text-2xl font-bold mb-6">Recent Players</h3>
      <div className="space-y-3 flex-1">
        {players.length > 0 ? (
          players.map((player, index) => {
            const id = safeGet(player, 'id', ['_id', 'userId'], index.toString());
            const name = safeGet(player, 'name', ['username', 'fullName'], 'Unknown Player');
            const email = safeGet(player, 'email', [], 'No email');
            const role = safeGet(player, 'role', [], 'PLAYER');

            return (
              <div 
                key={id} 
                className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm leading-tight truncate group-hover:text-prime transition-colors">{name}</p>
                  <p className="text-xs text-white/40 truncate mt-0.5">{email}</p>
                </div>
                <span className="text-[10px] font-bold tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/50 shrink-0 ml-3">
                  {role}
                </span>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 opacity-20 py-10">
            <p className="text-lg font-bold">No Recent Players</p>
          </div>
        )}
      </div>
      <button className="mt-6 text-center text-sm font-bold text-prime hover:text-white transition-colors uppercase">
        VIEW ALL PLAYERS →
      </button>
    </div>
  );
});

export default RecentPlayers;

