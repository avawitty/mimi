
import { ZineMetadata, PocketItem, UserProfile } from "../types";

const LOCAL_ZINES_KEY = 'mimi_local_zines';
const LOCAL_POCKET_KEY = 'mimi_local_pocket';
const LOCAL_PROFILE_KEY = 'mimi_local_profile';

/**
 * QuotaGuard: A mechanism to prevent the void from overflowing its local boundaries.
 */
const safeStorageSet = (key: string, value: string) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            console.warn("MIMI // Local Storage Saturated. Initiating Structural Pruning.");
            
            // 1. Prune oldest pocket items first
            const pocket = getLocalPocket();
            if (pocket.length > 3) {
                localStorage.setItem(LOCAL_POCKET_KEY, JSON.stringify(pocket.slice(0, 3)));
            }
            
            // 2. Prune oldest zines if still failing
            const zines = getLocalZines();
            if (zines.length > 5) {
                localStorage.setItem(LOCAL_ZINES_KEY, JSON.stringify(zines.slice(0, 5)));
            }

            // Final attempt
            try {
                localStorage.setItem(key, value);
            } catch (retryError) {
                console.error("MIMI // Local save failed even after pruning. Clear history required.");
            }
        }
    }
};

export const saveZineLocally = (zine: ZineMetadata) => {
    const existing = getLocalZines();
    // Maintain a sequential archive, prioritized by freshness
    const updated = [zine, ...existing.filter(z => z.id !== zine.id)].slice(0, 40);
    safeStorageSet(LOCAL_ZINES_KEY, JSON.stringify(updated));
    console.log("%c MIMI // Local Archive: Refraction secured for mobile witness. ", "color: #10B981; font-weight: bold;");
};

export const getLocalZines = (): ZineMetadata[] => {
    const data = localStorage.getItem(LOCAL_ZINES_KEY);
    try {
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("MIMI // Local Cache Corrupted: Zines reclaimed by void.");
        return [];
    }
};

export const savePocketItemLocally = (item: PocketItem) => {
    const existing = getLocalPocket();
    const updated = [item, ...existing.filter(i => i.id !== item.id)].slice(0, 30);
    safeStorageSet(LOCAL_POCKET_KEY, JSON.stringify(updated));
};

export const getLocalPocket = (): PocketItem[] => {
    const data = localStorage.getItem(LOCAL_POCKET_KEY);
    try {
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

export const saveProfileLocally = (profile: UserProfile) => {
    safeStorageSet(LOCAL_PROFILE_KEY, JSON.stringify(profile));
    console.log("%c MIMI // Local Profile: Identity anchored. ", "color: #3B82F6; font-weight: bold;");
};

export const getLocalProfile = (): UserProfile | null => {
    const data = localStorage.getItem(LOCAL_PROFILE_KEY);
    try {
        if (!data) return null;
        const parsed = JSON.parse(data);
        return parsed && parsed.uid ? parsed : null;
    } catch (e) {
        return null;
    }
};

export const clearLocalSession = () => {
    localStorage.removeItem(LOCAL_ZINES_KEY);
    localStorage.removeItem(LOCAL_POCKET_KEY);
    localStorage.removeItem(LOCAL_PROFILE_KEY);
};
