import { browser } from 'wxt/browser';
import { MODE_STORAGE_KEY } from '@/utils/env';

export type AppMode = 'popup' | 'sidepanel';

type StorageArea = {
	get: (key: string | string[] | null) => Promise<Record<string, any>>;
	set: (items: Record<string, any>) => Promise<void>;
	remove?: (key: string | string[]) => Promise<void>;
	clear?: () => Promise<void>;
};

function getExtensionStorage(): StorageArea {
	const runtimeGlobal = globalThis as typeof globalThis & {
		browser?: { storage?: { local?: StorageArea } };
		chrome?: { storage?: { local?: StorageArea } };
	};

	const storageLocal =
		runtimeGlobal.browser?.storage?.local ??
		runtimeGlobal.chrome?.storage?.local ??
		browser?.storage?.local;

	if (storageLocal) {
		return storageLocal;
	}

	return {
		get: async () => ({}),
		set: async () => undefined,
		remove: async () => undefined,
		clear: async () => undefined,
	};
}

async function getCurrentWindowId(): Promise<number | undefined> {
	const currentWindow = await browser.windows.getCurrent();
	return currentWindow?.id ?? undefined;
}

async function getCurrentTabId(): Promise<number | undefined> {
	const tabs = await browser.tabs.query({ active: true, currentWindow: true });
	return tabs[0]?.id ?? undefined;
}

function closeCurrentPopupWindow() {
	if (typeof window !== 'undefined' && typeof window.close === 'function') {
		window.close();
	}
}

export async function saveAppMode(mode: AppMode) {
	const local = getExtensionStorage();
	if (!local) {
		return;
	}
	await local.set({ [MODE_STORAGE_KEY]: mode });
}

export async function getSavedAppMode(): Promise<AppMode> {
	const local = getExtensionStorage();
	console.log('local storage object:', local);
	if (!local) {
		return 'popup';
	}
	const result = await local.get(MODE_STORAGE_KEY);
	console.log('retrieved mode from local storage:', result, result[MODE_STORAGE_KEY]);
	return result[MODE_STORAGE_KEY] === 'sidepanel' ? 'sidepanel' : 'popup';
}

export async function applySavedMode(mode: AppMode = 'popup') {
	if (mode === 'sidepanel') {
		await openSidePanelAndClosePopup();
		return;
	}
	await openPopupAndCloseSidePanel();
}

async function setActionPopupEnabled(enabled: boolean) {
	if (!('action' in browser)) {
		return;
	}

	try {
		await browser.action.setPopup({ popup: enabled ? 'popup.html' : '' });
	} catch (error) {
		console.warn('setActionPopupEnabled failed:', error);
	}
}

export async function openPopupAndCloseSidePanel() {
	if (!('sidePanel' in browser) && !('action' in browser)) {
		return;
	}

	try {
		if ('sidePanel' in browser) {
			const windowId = await getCurrentWindowId();
			if (typeof windowId === 'number' && windowId > 0) {
				await browser.sidePanel.close({ windowId });
			}
		}
		if ('action' in browser) {
			await setActionPopupEnabled(true);
			await browser.action.openPopup();
		}
	} catch (error) {
		console.error('openPopupAndCloseSidePanel failed:', error);
	}
}

export async function openSidePanelAndClosePopup() {
	if (!('sidePanel' in browser)) {
		return;
	}

	try {
		if ('action' in browser) {
			await setActionPopupEnabled(false);
		}
		const windowId = await getCurrentWindowId();
		const tabId = await getCurrentTabId();
		if (typeof windowId === 'number') {
			await browser.sidePanel.open({ windowId });
			closeCurrentPopupWindow();
			return;
		}
		if (typeof tabId === 'number') {
			await browser.sidePanel.open({ tabId });

			closeCurrentPopupWindow();
		}
	} catch (error) {
		console.error('openSidePanelAndClosePopup failed:', error);
	}
}
