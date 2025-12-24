import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Store reference to the original window.storage
const originalStorage = window.storage;

// Shared Storage API using Claude's persistent storage
const sharedStorage = {
  get: async (key) => {
    try {
      // Use original storage with shared flag
      const result = await originalStorage.get(key, true);
      return result;
    } catch (error) {
      // If not found in shared storage, throw error
      throw new Error('Key not found');
    }
  },
  
  set: async (key, value) => {
    try {
      // Always use shared storage (shared: true)
      const result = await originalStorage.set(key, value, true);
      return result;
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  },
  
  delete: async (key) => {
    try {
      const result = await originalStorage.delete(key, true);
      return result;
    } catch (error) {
      console.error('Storage delete error:', error);
      throw error;
    }
  },
  
  list: async (prefix) => {
    try {
      const result = await originalStorage.list(prefix, true);
      return result;
    } catch (error) {
      console.error('Storage list error:', error);
      return { keys: [], prefix, shared: true };
    }
  }
};

// Override window.storage with shared storage wrapper
window.storage = sharedStorage;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);