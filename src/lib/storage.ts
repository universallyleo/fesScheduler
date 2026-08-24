import { browser } from '$app/environment';
import type { Festival, UserPreferences } from './types';

const DATABASE_NAME = 'live-fes-scheduler';
const DATABASE_VERSION = 1;
const FESTIVALS_STORE = 'festivals';
const SETTINGS_STORE = 'settings';
const SETTINGS_KEY = 'preferences';

function plainSnapshot<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
		request.onupgradeneeded = () => {
			const database = request.result;
			if (!database.objectStoreNames.contains(FESTIVALS_STORE))
				database.createObjectStore(FESTIVALS_STORE, { keyPath: 'id' });
			if (!database.objectStoreNames.contains(SETTINGS_STORE))
				database.createObjectStore(SETTINGS_STORE);
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function withStore<T>(
	storeName: string,
	mode: IDBTransactionMode,
	operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
	if (!browser) throw new Error('IndexedDB is only available in the browser.');
	const database = await openDatabase();
	return new Promise((resolve, reject) => {
		const request = operation(database.transaction(storeName, mode).objectStore(storeName));
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function listFestivals(): Promise<Festival[]> {
	return (
		(await withStore<Festival[]>(FESTIVALS_STORE, 'readonly', (store) => store.getAll())) ?? []
	);
}

export async function saveFestival(festival: Festival): Promise<void> {
	await withStore(FESTIVALS_STORE, 'readwrite', (store) => store.put(plainSnapshot(festival)));
}

export async function deleteFestival(id: string): Promise<void> {
	await withStore(FESTIVALS_STORE, 'readwrite', (store) => store.delete(id));
}

export async function savePreferences(preferences: UserPreferences): Promise<void> {
	await withStore(SETTINGS_STORE, 'readwrite', (store) =>
		store.put(plainSnapshot(preferences), SETTINGS_KEY)
	);
}

export async function loadPreferences(): Promise<UserPreferences | null> {
	return (
		(await withStore<UserPreferences | undefined>(SETTINGS_STORE, 'readonly', (store) =>
			store.get(SETTINGS_KEY)
		)) ?? null
	);
}
