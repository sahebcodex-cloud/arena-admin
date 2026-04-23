import { createContext, useContext } from 'react';

/**
 * AdminContext
 * Global context object for admin state.
 */
export const AdminContext = createContext();

/**
 * useAdmin Hook
 * Custom hook to easily consume the AdminContext.
 */
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
