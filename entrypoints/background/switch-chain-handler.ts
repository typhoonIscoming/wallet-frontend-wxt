import { ProviderErrorCode } from '@/types/eip1193';
import type { ProviderRpcError } from '@/types/eip1193';
import { browser } from 'wxt/browser';
import type { PendingSwitchChainRequest, WalletStoreData } from './types';

/**
 * 处理切换网络请求的批准
 */
export default async function handleSwitchChainRequestApprove(
	requestId: string,
	pendingSwitchChainRequests: Map<string, PendingSwitchChainRequest>
): Promise<void> {
	const request = pendingSwitchChainRequests.get(requestId);
	if (!request || !request.targetNetwork) return;

	try {
		const storage = browser.storage.local;
		const result = await storage.get('wallet-store');
		const walletStore = result['wallet-store'] as WalletStoreData | undefined;

		if (walletStore?.state) {
			walletStore.state.currentNetwork = request.targetNetwork!;
			await storage.set({ 'wallet-store': walletStore });

			// 通知所有 content scripts 网络已更改（触发 chainChanged 事件）
			try {
				const tabs = await browser.tabs.query({});
				for (const tab of tabs) {
					if (tab.id) {
						browser.tabs
							.sendMessage(tab.id, {
								type: 'CHAIN_CHANGED',
								chainId: request.chainId,
							})
							.catch(() => {});
					}
				}
			} catch (error) {
				console.error('[Background] Failed to notify chain change:', error);
			}

			request.resolve(null);
			pendingSwitchChainRequests.delete(requestId);
		} else {
			const error: ProviderRpcError = {
				name: 'ProviderError',
				message: 'Failed to update network',
				code: ProviderErrorCode.DISCONNECTED,
			};
			request.reject(error);
			pendingSwitchChainRequests.delete(requestId);
		}
	} catch (error: any) {
		const providerError: ProviderRpcError = {
			name: 'ProviderError',
			message: error.message || 'Failed to switch chain',
			code: ProviderErrorCode.DISCONNECTED,
		};
		request.reject(providerError);
		pendingSwitchChainRequests.delete(requestId);
	}
}
