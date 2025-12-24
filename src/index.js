import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Shared Storage API using Claude's persistent storage
const storage = {
  get: async (key) => {
    try {
      // Try to get from shared storage first
      const result = await window.storage.get(key, true);
      return result;
    } catch (error) {
      // If not found in shared storage, throw error
      throw new Error('Key not found');
    }
  },
  
  set: async (key, value) => {
    try {
      // Always use shared storage (shared: true)
      const result = await window.storage.set(key, value, true);
      return result;
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  },
  
  delete: async (key) => {
    try {
      const result = await window.storage.delete(key, true);
      return result;
    } catch (error) {
      console.error('Storage delete error:', error);
      throw error;
    }
  },
  
  list: async (prefix) => {
    try {
      const result = await window.storage.list(prefix, true);
      return result;
    } catch (error) {
      console.error('Storage list error:', error);
      return { keys: [], prefix, shared: true };
    }
  }
};

// Override the window.storage with shared storage
window.storage = storage;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);