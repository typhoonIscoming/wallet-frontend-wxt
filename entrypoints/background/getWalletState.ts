import { browser } from 'wxt/browser';
import { WALLET_STORE } from '@/utils/env';
import type { WalletState, WalletStoreData } from '@/types/wallet';

export default async function getWalletState(): Promise<WalletState | null> {
	try {
		const storage = browser.storage.local;
		const result = await storage.get(WALLET_STORE);
		const walletStore = result[WALLET_STORE] as WalletStoreData | undefined;
		return walletStore?.state || null;
	} catch (error) {
		console.error('[Background] Failed to get wallet state:', error);
		return null;
	}
}
