class SessionStorageService {
  setItem<T>(key: string, value: T): void {
    try {
      if (typeof window === 'undefined') return; // SSR protection

      const serialized = JSON.stringify(value);
      window.sessionStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to save to sessionStorage: ${key}`, error);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      if (typeof window === 'undefined') return null; // SSR protection

      const item = window.sessionStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error(`Failed to parse sessionStorage value for key: ${key}`, error);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      if (typeof window === 'undefined') return; // SSR protection

      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove sessionStorage key: ${key}`, error);
    }
  }

  clear(): void {
    try {
      if (typeof window === 'undefined') return; // SSR protection

      window.sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear sessionStorage', error);
    }
  }

  hasKey(key: string): boolean {
    if (typeof window === 'undefined') return false; // SSR protection

    return window.sessionStorage.getItem(key) !== null;
  }
}

export default new SessionStorageService();
