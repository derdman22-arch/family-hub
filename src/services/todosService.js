import { api } from './api';

// To-dos are stored by the backend's /api/notes endpoint

export const fetchTodos = () => api('/notes');
export const createTodo = (payload) => api('/notes', { method: 'POST', body: payload });
export const patchTodo = (id, patch) => api(`/notes/${id}`, { method: 'PATCH', body: patch });
export const deleteTodo = (id) => api(`/notes/${id}`, { method: 'DELETE' });
export const fetchTodoStats = () => api('/notes/stats');
