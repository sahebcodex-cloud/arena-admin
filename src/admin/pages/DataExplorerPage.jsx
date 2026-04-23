import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Database, Filter, Loader2, ShieldAlert } from 'lucide-react';
import authService from '../services/authService';

const DataExplorerPage = () => {
  const [entity, setEntity] = useState('users');
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const entities = ['users', 'wallets', 'user_stats', 'game_results', 'rooms', 'store_purchases', 'rewards'];

  const fetchData = useCallback(async (currentPage = 1, append = false) => {
    if (append) setIsLoadingMore(true);
    else setLoading(true);

    setError(null);
    try {
      const response = await authService.getDataExplorer(entity, { page: currentPage, limit });
      const items = response.data || response.items || response.records || (Array.isArray(response) ? response : []);

      if (append) {
        setDataList(prev => [...prev, ...items]);
      } else {
        setDataList(items);
      }

      setPage(response.page || currentPage);
      setHasMore(items.length === limit);
    } catch (err) {
      setError(err.message || 'Failed to load data');
      if (!append) setDataList([]);
    } finally {
      if (append) setIsLoadingMore(false);
      else setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1, false);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const observer = useRef();
  const lastElementRef = useCallback(node => {
    if (loading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchData(page + 1, true);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, isLoadingMore, hasMore, page, fetchData]);

  // Extract dynamic headers from first row
  const getHeaders = () => {
    if (dataList.length === 0) return [];
    return Object.keys(dataList[0]);
  };

  // Safe render for complex objects (like JSON fields)
  const renderCellData = (value) => {
    if (value === null || value === undefined) return <span className="text-white/20">null</span>;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '');
    return String(value);
  };

  const headers = getHeaders();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Database className="text-prime" size={28} />
            Data Explorer
          </h2>
          <p className="text-white/50 mt-1">Direct access to raw database entity tables.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <select
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-prime/50 w-full sm:w-auto [color-scheme:dark]"
            >
              {entities.map(e => (
                <option key={e} value={e}>{e.toUpperCase().replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl inline-flex items-center gap-3 w-full">
          <ShieldAlert size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="glass-card p-16 text-center">
          <Loader2 className="w-8 h-8 text-prime animate-spin mx-auto mb-4" />
          <p className="text-white/40 font-medium text-sm">Querying {entity}...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && dataList.length === 0 && !error && (
        <div className="glass-card p-16 text-center text-white/30">
          No data found for this entity.
        </div>
      )}

      {/* Mobile Card Layout — visible only below md */}
      {!loading && dataList.length > 0 && (
        <div className="md:hidden space-y-3">
          {dataList.map((row, i) => {
            const isLastElement = i === dataList.length - 1;
            return (
              <div
                ref={isLastElement ? lastElementRef : null}
                key={row.id || row._id || `m-${i}`}
                className="glass-card p-4 space-y-2"
              >
                {headers.map(header => (
                  <div key={`${i}-${header}`} className="flex justify-between gap-3 text-xs border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-white/40 font-bold uppercase tracking-widest shrink-0">{header}</span>
                    <span className="text-white/80 text-right break-all">{renderCellData(row[header])}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Desktop Table Layout — hidden below md */}
      {!loading && dataList.length > 0 && (
        <div className="hidden md:block glass-card overflow-hidden">
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left text-sm text-white/70">
              <thead className="bg-white/[0.02] border-b border-white/5 uppercase text-[10px] tracking-widest text-white/40">
                <tr>
                  {headers.map(header => (
                    <th key={header} className="px-6 py-4 font-bold whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dataList.map((row, i) => {
                  const isLastElement = i === dataList.length - 1;
                  return (
                    <tr ref={isLastElement ? lastElementRef : null} key={row.id || row._id || i} className="hover:bg-white/[0.02] transition-colors">
                      {headers.map(header => (
                        <td key={`${i}-${header}`} className="px-6 py-3 whitespace-nowrap max-w-[200px] truncate">
                          {renderCellData(row[header])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Infinite Scroll Footer */}
      {!loading && dataList.length > 0 && (
        <div className="px-6 py-6 text-center">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-2 text-prime">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading more records...</span>
            </div>
          ) : hasMore ? (
            <p className="text-sm text-white/30">Scroll down to load more</p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default DataExplorerPage;
