import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Wait for window.storage to be available, then wrap it for shared storage
const initializeStorage = () => {
  // Check if persistent storage API is available
  if (window.storage && typeof window.storage.get === 'function') {
    // Store reference to the original storage
    const originalStorage = {
      get: window.storage.get.bind(window.storage),
      set: window.storage.set.bind(window.storage),
      delete: window.storage.delete.bind(window.storage),
      list: window.storage.list.bind(window.storage)
    };

    // Create shared storage wrapper
    window.storage = {
      get: async (key) => {
        try {
          return await originalStorage.get(key, true);
        } catch (error) {
          throw new Error('Key not found');
        }
      },
      
      set: async (key, value) => {
        try {
          return await originalStorage.set(key, value, true);
        } catch (error) {
          console.error('Storage set error:', error);
          throw error;
        }
      },
      
      delete: async (key) => {
        try {
          return await originalStorage.delete(key, true);
        } catch (error) {
          console.error('Storage delete error:', error);
          throw error;
        }
      },
      
      list: async (prefix) => {
        try {
          return await originalStorage.list(prefix, true);
        } catch (error) {
          console.error('Storage list error:', error);
          return { keys: [], prefix, shared: true };
        }
      }
    };
    
    console.log('Shared storage initialized successfully');
  } else {
    // Fallback to localStorage if persistent storage is not available
    console.warn('Persistent storage not available, falling back to localStorage');
    
    window.storage = {
      get: async (key) => {
        const value = localStorage.getItem(key);
        if (value === null) throw new Error('Key not found');
        return { key, value, shared: false };
      },
      
      set: async (key, value) => {
        localStorage.setItem(key, value);
        return { key, value, shared: false };
      },
      
      delete: async (key) => {
        localStorage.removeItem(key);
        return { key, deleted: true, shared: false };
      },
      
      list: async (prefix) => {
        const keys = Object.keys(localStorage).filter(k => !prefix || k.startsWith(prefix));
        return { keys, prefix, shared: false };
      }
    };
  }
};

// Initialize storage immediately
initializeStorage();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);