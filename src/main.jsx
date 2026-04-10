import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Storage polyfill using localStorage (replaces Claude artifact storage)
window.storage = {
  async get(key) {
    const val = localStorage.getItem(key);
    if (val === null) throw new Error('Key not found');
    return { key, value: val };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { key, value };
  },
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true };
  },
  async list(prefix) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!prefix || k.startsWith(prefix)) keys.push(k);
    }
    return { keys };
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
