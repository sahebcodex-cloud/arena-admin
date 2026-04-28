import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Search, Filter, MoreVertical, Copy, CheckCircle2, X, Gamepad2, Coins, Zap, ShoppingBag, Trash2, ShieldAlert, Loader2, Save, User, Mail, Phone, Image, Edit2, Activity, Gift, Gem, Crown } from 'lucide-react';
import { motion as M, AnimatePresence } from 'framer-motion';
import authService from '../services/authService';

// Utility for safe property access
const safeGet = (obj, mainKey, fallbackKeys, defaultVal) => {
  if (!obj) return defaultVal;
  if (obj[mainKey] !== undefined) return obj[mainKey];
  for (let key of fallbackKeys) {
    if (obj[key] !== undefined) return obj[key];
  }
  return defaultVal;
};

// Memoized Player Row Component
const PlayerRow = memo(({ player, isLast, lastElementRef, onPlayerClick, onCopyToken, isCopied }) => {
  const { id, name, email, role } = player;
  const shortId = id ? id.substring(0, 8) + '...' : 'N/A';

  return (
    <div
      ref={isLast ? lastElementRef : null}
      onClick={() => onPlayerClick(player, 'view')}
      className="flex flex-col md:grid md:grid-cols-12 md:items-center gap-3 md:gap-4 px-4 py-4 md:py-5 md:px-6 hover:bg-white/[0.04] transition-all group cursor-pointer border-b border-white/5 last:border-0"
    >
      {/* Avatar + Name + Mobile Actions */}
      <div className="col-span-4 flex items-center justify-between md:justify-start gap-4">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full border border-prime/30 overflow-hidden bg-white/5 group-hover:scale-110 transition-transform flex-shrink-0">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white group-hover:text-prime transition-colors truncate text-sm">{name}</p>
            <span className="text-[9px] md:text-[10px] font-bold text-white/30 uppercase tracking-widest truncate block">{role}</span>
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={(e) => { e.stopPropagation(); onPlayerClick(player, 'edit'); }}
            className="p-1.5 text-white/40 hover:text-prime hover:bg-prime/10 rounded-lg transition-all"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-white/10 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Data Row on Mobile -> Normal Columns on Desktop */}
      <div className="col-span-6 flex items-center md:contents bg-white/[0.02] md:bg-transparent rounded-xl md:rounded-none border border-white/5 md:border-0 p-2.5 md:p-0">
        {/* Email Column */}
        <div className="flex-1 md:col-span-4 min-w-0 border-r border-white/5 md:border-0 pr-3 md:pr-0 flex flex-col md:block justify-center">
          <span className="text-white/40 text-[9px] font-bold md:hidden uppercase flex-shrink-0 block mb-0.5 tracking-widest">Email</span>
          <span className="text-white/70 font-medium truncate block text-xs md:text-sm">{email}</span>
        </div>

        {/* ID Column */}
        <div className="flex-1 md:col-span-2 min-w-0 pl-3 md:pl-0 flex flex-col md:block justify-center">
          <span className="text-white/40 text-[9px] font-bold md:hidden uppercase flex-shrink-0 block mb-0.5 tracking-widest">ID</span>
          <div
            onClick={(e) => onCopyToken(e, id)}
            className="flex items-center gap-2 bg-white/5 border border-white/5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg w-fit cursor-pointer hover:bg-prime/10 hover:border-prime/20 transition-all group/token"
          >
            <code className="text-[10px] md:text-xs text-prime/80 font-mono group-hover/token:text-prime">{shortId}</code>
            {isCopied ? (
              <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
            ) : (
              <Copy size={12} className="text-white/10 group-hover/token:text-white/40 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Desktop Actions */}
      <div className="hidden md:flex col-span-2 justify-end items-center">
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onPlayerClick(player, 'edit'); }}
            className="flex justify-center items-center p-2 text-white/40 hover:text-prime hover:bg-prime/10 rounded-lg transition-all"
            title="Update User"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="flex justify-center items-center p-2 text-white/10 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>
    </div>
  );
});

const LIMIT = 20;

const PlayersPage = () => {
  const [copiedToken, setCopiedToken] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDetails, setPlayerDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Edit form state
  const [modalMode, setModalMode] = useState('view');
  const [editForm, setEditForm] = useState({ name: '', email: '', contact: '', profileImage: 1 });
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  // Gift modal state
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftForm, setGiftForm] = useState({ silver: 0, gold: 0, diamond: 0 });
  const [gifting, setGifting] = useState(false);

  const fetchPlayers = useCallback(async (currentPage = 1, search = '', append = false) => {
    try {
      if (append) setIsLoadingMore(true);
      else setLoading(true);

      setError(null);
      const params = { page: currentPage, limit: LIMIT, sortBy: 'createdAt', sortOrder: 'DESC', include: 'statsSummary,wallet' };
      if (search.trim()) params.search = search.trim();
      const data = await authService.getUsers(params);

      const rawPlayers = data.users || data.data || (Array.isArray(data) ? data : []);
      const fetchedPlayers = rawPlayers.map(p => ({
        ...p,
        id: safeGet(p, 'id', ['_id', 'userId'], ''),
        name: safeGet(p, 'name', ['username'], 'Unknown'),
        email: safeGet(p, 'email', [], 'No email'),
        role: safeGet(p, 'role', [], 'PLAYER'),
        contact: safeGet(p, 'contact', ['phone'], 'Not Provided'),
        platform: safeGet(p, 'platform', [], 'Unknown')
      }));

      if (append) {
        setPlayers(prev => [...prev, ...fetchedPlayers]);
      } else {
        setPlayers(fetchedPlayers);
      }

      setPage(data.page || currentPage);
      setHasMore(fetchedPlayers.length === LIMIT);
    } catch (err) {
      setError(err.message);
    } finally {
      if (append) setIsLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { fetchPlayers(1, searchQuery, false); }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchPlayers]);

  const observer = useRef();
  const pageRef = useRef(page);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const lastElementRef = useCallback(node => {
    if (loading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchPlayers(pageRef.current + 1, searchQuery, true);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, isLoadingMore, hasMore, searchQuery, fetchPlayers]);

  const handleCopyToken = useCallback((e, token) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }, []);

  const handleDeleteUser = async (id) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this player? This action cannot be undone and will wipe all their data.")) {
      try {
        setUpdating(true); // Reuse updating state for feedback
        setUpdateMsg('Deleting player...');

        await authService.deleteUser(id);

        // Remove from local list
        setPlayers(prev => prev.filter(p => p.id !== id));

        // Close modal and show success
        closeModal();
        alert('User deleted successfully.');
      } catch (err) {
        setUpdateMsg(`❌ Delete failed: ${err.message}`);
        console.error('Delete error:', err);
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleGiftSubmit = async () => {
    const id = safeGet(playerDetails || selectedPlayer, 'id', ['_id', 'userId'], '');
    if (!id) return;

    try {
      setGifting(true);
      const payload = {};
      Object.entries(giftForm).forEach(([key, val]) => {
        if (val > 0) payload[key] = Number(val);
      });

      if (Object.keys(payload).length === 0) {
        alert("Please enter at least one value to gift.");
        return;
      }

      await authService.giftUser(id, payload);
      
      if (playerDetails) {
        const updatedWallets = [...(playerDetails.wallets || [])];
        if (updatedWallets[0]) {
          Object.entries(payload).forEach(([key, val]) => {
            updatedWallets[0][key] = (Number(updatedWallets[0][key]) || 0) + val;
          });
        }
        setPlayerDetails({ ...playerDetails, wallets: updatedWallets });
      }

      alert("Gift sent successfully!");
      setIsGiftModalOpen(false);
      setGiftForm({ silver: 0, gold: 0, diamond: 0 });
    } catch (err) {
      alert(`Gifting failed: ${err.message}`);
    } finally {
      setGifting(false);
    }
  };

  // Open player detail modal - fetch full details from API
  const handlePlayerClick = useCallback(async (player, mode = 'view') => {
    const id = safeGet(player, 'id', ['_id', 'userId'], '');
    setModalMode(mode);
    setSelectedPlayer(player);
    setPlayerDetails(null);
    setUpdateMsg('');
    setDetailLoading(true);
    try {
      const rawDetails = await authService.getUserById(id, 'stats,wallets,purchases,rewards,recentGames');
      const details = rawDetails.data || rawDetails.user || rawDetails;
      setPlayerDetails(details);
      setEditForm({
        name: details.name || details.username || '',
        email: details.email || '',
        contact: details.contact || details.phone || '',
        profileImage: details.profileImage || 1,
      });
    } catch {
      // Fallback to basic player data from list
      setPlayerDetails(player);
      setEditForm({
        name: player.name || player.username || '',
        email: player.email || '',
        contact: player.contact || player.phone || '',
        profileImage: player.profileImage || 1,
      });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Handle update via PUT /admin/users/{id}
  const handleUpdatePlayer = async () => {
    const id = safeGet(playerDetails || selectedPlayer, 'id', ['_id', 'userId'], '');
    if (!id) return;
    setUpdating(true);
    setUpdateMsg('');
    try {
      const payload = {};

      // Ensure we send only the fields supported by the backend schema
      if (editForm.name) {
        payload.name = editForm.name;
      }
      if (editForm.email) {
        payload.email = editForm.email;
      }
      if (editForm.contact) {
        payload.contact = editForm.contact;
      }
      if (editForm.profileImage !== undefined && editForm.profileImage !== '') {
        payload.profileImage = Number(editForm.profileImage);
      }

      await authService.updateUser(id, payload);
      setUpdateMsg('✅ Player updated successfully!');
      // Update local state to reflect changes without losing infinite scroll position
      setPlayers(prev => prev.map(p => {
        return p.id === id ? { ...p, ...payload } : p;
      }));
    } catch (err) {

      setUpdateMsg(`❌ ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const closeModal = () => {
    setSelectedPlayer(null);
    setPlayerDetails(null);
    setUpdateMsg('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative">
      {/* ... previous code remains the same until player list mapping ... */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Players Directory</h2>
          <p className="text-white/50 mt-1">Manage and monitor all registered players in the system.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-prime/50 w-full sm:w-64 transition-all"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
            <Filter size={18} className="text-white/60" />
          </button>
        </div>
      </div>

      {/* Players List */}
      <div className="glass-card overflow-hidden transition-all duration-500">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-5 text-sm font-bold text-white/40 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
          <div className="col-span-4">Player</div>
          <div className="col-span-4">Email Address</div>
          <div className="col-span-2">ID</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-10 text-center">
              <Loader2 className="w-8 h-8 text-prime animate-spin mx-auto mb-4" />
              <p className="text-white/40 font-medium">Fetching players...</p>
            </div>
          ) : error ? (
            <div className="p-10 text-center">
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl inline-flex items-center gap-3">
                <ShieldAlert size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          ) : players.length === 0 ? (
            <div className="p-10 text-center text-white/40">No players found.</div>
          ) : (
            players.map((player, index) => (
              <PlayerRow
                key={player.id || `player-${index}`}
                player={player}
                isLast={index === players.length - 1}
                lastElementRef={lastElementRef}
                onPlayerClick={handlePlayerClick}
                onCopyToken={handleCopyToken}
                isCopied={copiedToken === player.id}
              />
            ))
          )}
        </div>

        {/* Infinite Scroll Loader & Status */}
        <div className="px-4 sm:px-6 py-6 border-t border-white/5 bg-white/[0.01] text-center">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-2 text-prime">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading more players...</span>
            </div>
          ) : hasMore && players.length > 0 ? (
            <p className="text-sm text-white/30">Scroll down to load more</p>
          ) : null}
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* PLAYER DETAIL MODAL                           */}
      {/* ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedPlayer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <M.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <M.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-2xl relative z-[101] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {/* Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-prime/20 rounded-full blur-[80px]" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px]" />

              {/* Close */}
              <button onClick={closeModal} className="absolute right-6 top-6 p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all z-10">
                <X size={20} />
              </button>

              {detailLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 text-prime animate-spin mx-auto" />
                    <p className="text-white/40 text-sm">Loading player details...</p>
                  </div>
                </div>
              ) : (
                <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
                  {/* ─── Profile Header ─── */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl border-2 border-prime/30 bg-white/5 overflow-hidden flex-shrink-0">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${safeGet(playerDetails, 'name', ['username'], 'User')}`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{safeGet(playerDetails, 'name', ['username'], 'Unknown')}</h3>
                      <p className="text-xs text-prime truncate">{safeGet(playerDetails, 'email', [], 'No email')}</p>
                      <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">
                        {safeGet(playerDetails, 'role', [], 'PLAYER')} • Joined {playerDetails?.createdAt ? new Date(playerDetails.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>



                  {/* ─── Modal Content Switch ─── */}
                  {modalMode === 'edit' ? (
                    <div className="border-t border-white/5 pt-4">
                      <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">Edit Player</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-xs text-white/40 font-medium">
                            <User size={12} /> Name
                          </label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-prime/50 transition-all"
                            placeholder="Player name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-xs text-white/40 font-medium">
                            <Mail size={12} /> Email
                          </label>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-prime/50 transition-all"
                            placeholder="Email address"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-xs text-white/40 font-medium">
                            <Phone size={12} /> Contact
                          </label>
                          <input
                            type="text"
                            value={editForm.contact}
                            onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-prime/50 transition-all"
                            placeholder="Phone number"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-xs text-white/40 font-medium">
                            <Image size={12} /> Profile Image (1-6)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="6"
                            value={editForm.profileImage}
                            onChange={(e) => setEditForm({ ...editForm, profileImage: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-prime/50 transition-all"
                          />
                        </div>
                      </div>

                      {/* Update message */}
                      {updateMsg && (
                        <p className={`text-sm font-medium mt-3 ${updateMsg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{updateMsg}</p>
                      )}

                      {/* Update Button */}
                      <button
                        onClick={handleUpdatePlayer}
                        disabled={updating}
                        className="mt-4 w-full flex items-center justify-center gap-3 py-3.5 bg-prime/20 border border-prime/30 text-prime rounded-2xl font-bold hover:bg-prime hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Save size={18} />
                        )}
                        {updating ? 'Updating...' : 'Update Player'}
                      </button>
                    </div>
                  ) : (
                    <div className="border-t border-white/5 pt-4 space-y-5">

                      {/* Clean API Data Display */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <User size={12} className="text-prime" /> Profile Information
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.04] transition-colors">
                              <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Player ID</p>
                              <p className="text-[11px] font-medium text-white break-all leading-tight">{safeGet(playerDetails || selectedPlayer, 'id', ['_id', 'userId'], 'N/A')}</p>
                            </div>
                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.04] transition-colors">
                              <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Email</p>
                              <p className="text-[11px] font-medium text-white truncate leading-tight">{safeGet(playerDetails || selectedPlayer, 'email', [], 'N/A')}</p>
                            </div>
                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.04] transition-colors">
                              <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Contact</p>
                              <p className="text-[11px] font-medium text-white truncate leading-tight">{safeGet(playerDetails || selectedPlayer, 'contact', ['phone'], 'Not Provided')}</p>
                            </div>
                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.04] transition-colors">
                              <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Platform</p>
                              <p className="text-[11px] font-medium text-white truncate leading-tight">{safeGet(playerDetails || selectedPlayer, 'platform', [], 'Unknown')}</p>
                            </div>
                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.04] transition-colors">
                              <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Joined</p>
                              <p className="text-[11px] font-medium text-white truncate leading-tight">
                                {(playerDetails?.createdAt || selectedPlayer?.createdAt) ? new Date(playerDetails?.createdAt || selectedPlayer?.createdAt).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.04] transition-colors">
                              <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Last Login</p>
                              <p className="text-[11px] font-medium text-white truncate leading-tight">
                                {(playerDetails?.lastLoginAt || selectedPlayer?.lastLoginAt) ? new Date(playerDetails?.lastLoginAt || selectedPlayer?.lastLoginAt).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Player Statistics & Currencies Combined */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Activity size={12} className="text-prime" /> Statistics & Performance
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                              <div className="p-2 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-lg text-center group">
                                <p className="text-xs font-bold text-white truncate">{safeGet(playerDetails || selectedPlayer, 'game', ['gameName'], 'ArenaX')}</p>
                                <p className="text-[8px] text-blue-400/50 uppercase tracking-widest font-bold mt-0.5">Primary Game</p>
                              </div>
                              <div className="p-2 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-lg text-center group">
                                <p className="text-xs font-bold text-white truncate">
                                  {playerDetails?.statsSummary?.played ?? playerDetails?.stats?.reduce((a, s) => a + (s.played || 0), 0) ?? 0}
                                </p>
                                <p className="text-[8px] text-emerald-400/50 uppercase tracking-widest font-bold mt-0.5">Total Matches</p>
                              </div>
                              <div className="p-2 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-lg text-center group">
                                <p className="text-xs font-bold text-white truncate">
                                  {playerDetails?.purchaseSummary?.totalPurchases ?? playerDetails?.purchases?.length ?? 0}
                                </p>
                                <p className="text-[8px] text-purple-400/50 uppercase tracking-widest font-bold mt-0.5">Purchases</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Coins size={12} className="text-yellow-400" /> Wallet Balances
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {/* Diamond */}
                              <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col items-center justify-center gap-1 group hover:bg-white/[0.04] transition-all">
                                <Gem size={14} className="text-blue-400" />
                                <p className="text-xs font-bold text-white">{playerDetails?.wallets?.[0]?.diamond ?? playerDetails?.wallet?.diamond ?? 0}</p>
                                <p className="text-[7px] text-white/30 uppercase tracking-widest font-bold">Diamond</p>
                              </div>
                              {/* Gold */}
                              <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col items-center justify-center gap-1 group hover:bg-white/[0.04] transition-all">
                                <Crown size={14} className="text-yellow-500" />
                                <p className="text-xs font-bold text-white">{playerDetails?.wallets?.[0]?.gold ?? playerDetails?.wallet?.gold ?? 0}</p>
                                <p className="text-[7px] text-white/30 uppercase tracking-widest font-bold">Gold</p>
                              </div>
                              {/* Silver */}
                              <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col items-center justify-center gap-1 group hover:bg-white/[0.04] transition-all">
                                <Coins size={14} className="text-slate-400" />
                                <p className="text-xs font-bold text-white">{playerDetails?.wallets?.[0]?.silver ?? playerDetails?.wallet?.silver ?? 0}</p>
                                <p className="text-[7px] text-white/30 uppercase tracking-widest font-bold">Silver</p>
                              </div>
                              {/* Coins */}
                              <div className="p-2 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col items-center justify-center gap-1 group hover:bg-white/[0.04] transition-all">
                                <Zap size={14} className="text-prime" />
                                <p className="text-xs font-bold text-white">{playerDetails?.wallets?.[0]?.coins ?? playerDetails?.wallet?.coins ?? 0}</p>
                                <p className="text-[7px] text-white/30 uppercase tracking-widest font-bold">Coins</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5">
                        <div className="flex items-start gap-2 p-2.5 bg-red-500/5 border border-red-500/10 rounded-lg mb-2">
                          <ShieldAlert className="text-red-400 shrink-0" size={14} />
                          <div>
                            <h4 className="text-[10px] font-bold text-red-400">Danger Zone</h4>
                            <p className="text-[8px] text-red-400/60 leading-tight mt-0.5">Deleting this user permanently removes all game data and progress.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setGiftForm({ silver: 0, gold: 0, diamond: 0 });
                            setIsGiftModalOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-prime/10 border border-prime/20 text-prime rounded-lg text-[11px] font-bold hover:bg-prime hover:text-white transition-all duration-300 group mb-2"
                        >
                          <Gift size={14} className="group-hover:scale-110 transition-transform" />
                          Gift Player Items
                        </button>

                        <button
                          onClick={() => handleDeleteUser(safeGet(playerDetails || selectedPlayer, 'id', ['_id', 'userId'], ''))}
                          className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[11px] font-bold hover:bg-red-500 hover:text-white transition-all duration-300 group"
                        >
                          <Trash2 size={12} className="group-hover:scale-110 transition-transform" />
                          Delete Player Account
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </M.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gift Items Modal */}
      <AnimatePresence>
        {isGiftModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <M.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGiftModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <M.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-prime/10 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-prime/10 rounded-lg">
                    <Gift size={18} className="text-prime" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-none">Gift Player Items</h3>
                    <p className="text-[10px] text-white/40 mt-1">Add Gold, Silver, or Diamonds</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsGiftModalOpen(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                      <Gem size={10} /> Diamond
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={giftForm.diamond || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setGiftForm({...giftForm, diamond: val ? parseInt(val) : 0});
                      }}
                      placeholder="0"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-prime/50 focus:bg-white/[0.05] transition-all placeholder:text-white/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-1">
                      <Crown size={10} /> Gold
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={giftForm.gold || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setGiftForm({...giftForm, gold: val ? parseInt(val) : 0});
                      }}
                      placeholder="0"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-prime/50 focus:bg-white/[0.05] transition-all placeholder:text-white/10"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Coins size={10} /> Silver
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={giftForm.silver || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setGiftForm({...giftForm, silver: val ? parseInt(val) : 0});
                      }}
                      placeholder="0"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-prime/50 focus:bg-white/[0.05] transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    disabled={gifting}
                    onClick={handleGiftSubmit}
                    className="w-full py-3 bg-prime text-black rounded-xl text-xs font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-prime/20"
                  >
                    {gifting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Gift size={16} />
                        Send Gift to Player
                      </>
                    )}
                  </button>
                </div>
              </div>
            </M.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayersPage;
