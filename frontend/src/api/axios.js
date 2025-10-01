import axios from 'axios';

const { VITE_API_BASE_URL, VITE_API_PORT } = import.meta.env;
const fallbackBaseUrl = 'http://localhost:3000/api';
const apiPort = Number(VITE_API_PORT) || 3000;
const inferredBaseUrl = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:${apiPort}/api`
  : fallbackBaseUrl;
const BASE_URL = VITE_API_BASE_URL || inferredBaseUrl || fallbackBaseUrl;

export default axios.create({
  baseURL: BASE_URL,
});

export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
