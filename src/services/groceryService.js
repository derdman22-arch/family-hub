import { api } from './api';

export const fetchGrocery = () => api('/grocery');
export const addGroceryItem = (text) => api('/grocery', { method: 'POST', body: { text } });
export const patchGroceryItem = (id, patch) => api(`/grocery/${id}`, { method: 'PATCH', body: patch });
export const deleteGroceryItem = (id) => api(`/grocery/${id}`, { method: 'DELETE' });
export const clearCheckedGrocery = () => api('/grocery/checked', { method: 'DELETE' });
