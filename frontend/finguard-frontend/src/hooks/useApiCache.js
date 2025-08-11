import { useState, useEffect, useRef } from 'react';

// Simple in-memory cache with expiration
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.expiryTimes = new Map();
  }

  set(key, data, expiryMs = 5 * 60 * 1000) { // Default 5 minutes
    this.cache.set(key, data);
    this.expiryTimes.set(key, Date.now() + expiryMs);
  }

  get(key) {
    const expiryTime = this.expiryTimes.get(key);
    
    if (!expiryTime || Date.now() > expiryTime) {
      // Cache expired
      this.cache.delete(key);
      this.expiryTimes.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  has(key) {
    const expiryTime = this.expiryTimes.get(key);
    
    if (!expiryTime || Date.now() > expiryTime) {
      // Cache expired
      this.cache.delete(key);
      this.expiryTimes.delete(key);
      return false;
    }
    
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
    this.expiryTimes.clear();
  }

  delete(key) {
    this.cache.delete(key);
    this.expiryTimes.delete(key);
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, expiryTime] of this.expiryTimes.entries()) {
      if (now > expiryTime) {
        this.cache.delete(key);
        this.expiryTimes.delete(key);
      }
    }
  }
}

// Global cache instance
const globalCache = new ApiCache();

// Cleanup service to prevent memory leaks
let cleanupInterval = null;

// Initialize cleanup service
const initializeCleanup = () => {
  if (cleanupInterval) return; // Already initialized
  
  // Cleanup expired entries every 5 minutes
  cleanupInterval = setInterval(() => {
    globalCache.cleanup();
  }, 5 * 60 * 1000);
};

// Cleanup service for proper shutdown
const cleanupCacheService = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  globalCache.clear();
};

// Initialize cleanup when module loads (if in browser)
if (typeof window !== 'undefined') {
  initializeCleanup();
  
  // Clean up when page unloads
  window.addEventListener('beforeunload', cleanupCacheService);
  
  // Clean up on logout
  window.addEventListener('finguard-logout', cleanupCacheService);
}

// Custom hook for API caching
export const useApiCache = (key, fetchFunction, options = {}) => {
  const {
    expiryMs = 5 * 60 * 1000, // 5 minutes default
    immediate = true,
    dependencies = []
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchData = async (forceRefresh = false) => {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh && globalCache.has(key)) {
      const cachedData = globalCache.get(key);
      setData(cachedData);
      setError(null);
      return cachedData;
    }

    setLoading(true);
    setError(null);

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const result = await fetchFunction(abortControllerRef.current.signal);
      
      // Cache the result
      globalCache.set(key, result, expiryMs);
      
      setData(result);
      return result;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err);
        console.error(`Cache fetch error for key "${key}":`, err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh data (bypass cache)
  const refresh = () => fetchData(true);

  // Clear specific cache entry
  const clearCache = () => {
    globalCache.delete(key);
    setData(null);
  };

  // Clear all cache
  const clearAllCache = () => {
    globalCache.clear();
  };

  useEffect(() => {
    if (immediate) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [key, immediate, ...dependencies]);

  return {
    data,
    loading,
    error,
    refresh,
    fetchData,
    clearCache,
    clearAllCache,
    isFromCache: data && globalCache.has(key)
  };
};

// Hook for cached API GET requests
export const useCachedApiGet = (endpoint, options = {}) => {
  return useApiCache(
    `GET:${endpoint}`,
    async (signal) => {
      const { apiGet } = await import('../config/api');
      const response = await apiGet(endpoint, { signal });
      return response.json();
    },
    options
  );
};

export default useApiCache;