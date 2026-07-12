import { useState, useEffect } from 'react';
import { seedData } from '../lib/seed-data';

// Generic type for records with an ID
type BaseRecord = { id: string; [key: string]: any };

export function useStore<T extends BaseRecord>(storeKey: keyof typeof seedData) {
  // Reactive state
  const [data, setData] = useState<T[]>([]);
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const getHeaders = () => {
    const token = localStorage.getItem('esg_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const loadData = async () => {
    try {
      const res = await fetch(`/api/${storeKey}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const val = await res.json();
      if (storeKey === 'esg_config') {
        setConfig(val);
      } else {
        setData(val);
      }
    } catch (err) {
      console.error(`Failed to load store data for key ${storeKey}:`, err);
    } finally {
      setLoading(false);
    }
  };

  // Load from database on mount and when key changes
  useEffect(() => {
    loadData();
    
    // Custom event for same-tab updates
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.key === storeKey) {
        loadData();
      }
    };

    window.addEventListener('esg_store_update', handleCustomChange);
    
    return () => {
      window.removeEventListener('esg_store_update', handleCustomChange);
    };
  }, [storeKey]);

  const triggerUpdate = () => {
    window.dispatchEvent(new CustomEvent('esg_store_update', { detail: { key: storeKey } }));
  };

  // CRUD Operations
  const add = async (item: Omit<T, 'id'>) => {
    try {
      const res = await fetch(`/api/${storeKey}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const created = await res.json();
      triggerUpdate();
      return created;
    } catch (err) {
      console.error(`Failed to add record for key ${storeKey}:`, err);
      throw err;
    }
  };

  const update = async (id: string, updates: Partial<T>) => {
    try {
      const res = await fetch(`/api/${storeKey}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      triggerUpdate();
    } catch (err) {
      console.error(`Failed to update record ${id} for key ${storeKey}:`, err);
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/${storeKey}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      triggerUpdate();
    } catch (err) {
      console.error(`Failed to remove record ${id} for key ${storeKey}:`, err);
      throw err;
    }
  };

  // Config specific operations
  const updateConfig = async (updates: Partial<typeof seedData.esg_config>) => {
    try {
      const res = await fetch(`/api/esg_config`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      window.dispatchEvent(new CustomEvent('esg_store_update', { detail: { key: 'esg_config' } }));
    } catch (err) {
      console.error(`Failed to update config:`, err);
      throw err;
    }
  };

  return {
    data,
    config,
    loading,
    add,
    update,
    remove,
    updateConfig
  };
}
