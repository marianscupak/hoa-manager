import { STORAGE_KEYS, StorageKey } from "./keys";

export const StorageService = {
    get<T>(key: StorageKey): T | null {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            return JSON.parse(item) as T;
        } catch (error) {
            console.warn(
                `Failed to read key "${key}" from localStorage:`,
                error,
            );
            return null;
        }
    },

    getString(key: StorageKey): string | null {
        return localStorage.getItem(key);
    },

    set<T>(key: StorageKey, value: T): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(
                `Failed to write key "${key}" to localStorage:`,
                error,
            );
        }
    },

    setString(key: StorageKey, value: string): void {
        localStorage.setItem(key, value);
    },

    remove(key: StorageKey): void {
        localStorage.removeItem(key);
    },

    clearAuthHints(): void {
        this.remove(STORAGE_KEYS.LAST_TENANT_ID);
        this.remove(STORAGE_KEYS.POST_LOGIN_REDIRECT);
    },
};
