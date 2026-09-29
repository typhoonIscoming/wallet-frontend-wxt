import { browser } from 'wxt/browser';
export type AppMode = 'popup' | 'sidepanel';

const MODE_STORAGE_KEY = 'wallet-extension-mode';

type StorageArea = {
	get: (key: string | string[]) => Promise<Record<string, unknown>>;
	set: (items: Record<string, unknown>) => Promise<void>;
};

function getExtensionStorage() {
	const runtimeGlobal = globalThis as typeof globalThis & {
		browser?: { storage?: { local: StorageArea } };
		chrome?: { storage?: { local: StorageArea } };
	};

	const browserApi = runtimeGlobal.browser;
	if (browserApi?.storage?.local) {
		return browserApi.storage;
	}

	const chromeApi = runtimeGlobal.chrome;
	if (chromeApi?.storage?.local) {
		return chromeApi.storage;
	}

	return undefined;
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
	const storage = getExtensionStorage();
	if (!storage) {
		return;
	}
	await storage.local.set({ [MODE_STORAGE_KEY]: mode });
}

export async function getSavedAppMode(): Promise<AppMode> {
	const storage = getExtensionStorage();
	if (!storage) {
		return 'popup';
	}
	const result = await storage.local.get(MODE_STORAGE_KEY);
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
		if ('action' in browser) {
			await setActionPopupEnabled(true);
			await browser.action.openPopup();
		}
		if ('sidePanel' in browser) {
			const windowId = await getCurrentWindowId();
			if (typeof windowId === 'number') {
				await browser.sidePanel.close({ windowId });
			}
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
