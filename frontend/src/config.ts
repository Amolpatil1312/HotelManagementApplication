export function getApiBase(): string {
  return localStorage.getItem('serverUrl') || '';
}

export function setApiBase(url: string): void {
  localStorage.setItem('serverUrl', url);
}

export function isServerConfigured(): boolean {
  return !!localStorage.getItem('serverUrl');
}

// For backward compatibility — used everywhere
export const API_BASE = '';
