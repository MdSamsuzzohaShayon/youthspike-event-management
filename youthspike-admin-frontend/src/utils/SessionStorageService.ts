class SessionStorageService {
    /**
     * Stores a value in sessionStorage
     * @param key - Key under which value will be stored
     * @param value - Value to store (can be any serializable data)
     */
    setItem<T>(key: string, value: T): void {
      try {
        const serialized = JSON.stringify(value);
        sessionStorage.setItem(key, serialized);
      } catch (error) {
        console.error(`Failed to save to sessionStorage: ${key}`, error);
      }
    }
  
    /**
     * Retrieves a value from sessionStorage
     * @param key - Key to retrieve
     * @returns The stored value (or null if not found / parsing fails)
     */
    getItem<T>(key: string): T | null {
      try {
        const item = sessionStorage.getItem(key);
        return item ? (JSON.parse(item) as T) : null;
      } catch (error) {
        console.error(`Failed to parse sessionStorage value for key: ${key}`, error);
        return null;
      }
    }
  
    /**
     * Removes a value from sessionStorage
     * @param key - Key to remove
     */
    removeItem(key: string): void {
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove sessionStorage key: ${key}`, error);
      }
    }
  
    /**
     * Clears all data from sessionStorage
     */
    clear(): void {
      try {
        sessionStorage.clear();
      } catch (error) {
        console.error("Failed to clear sessionStorage", error);
      }
    }
  
    /**
     * Checks if a key exists in sessionStorage
     * @param key - Key to check
     * @returns true if exists, false otherwise
     */
    hasKey(key: string): boolean {
      return sessionStorage.getItem(key) !== null;
    }
  }
  
  export default new SessionStorageService();
  