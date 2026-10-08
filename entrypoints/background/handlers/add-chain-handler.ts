import { browser } from 'wxt/browser';
import type { PendingAddChainRequest, RequestContext } from '../types';
import { ProviderErrorCode, type ProviderRpcError } from '@/types/eip1193';
import getWalletState from '../getWalletState';
/**
 * 获取待处理的添加网络请求
 */
export async function handleAddChainRequestGet(): Promise<{ requests: PendingAddChainRequest[] }> {
	// 这个函数应该从 background.ts 中调用，获取 pendingAddChainRequests
	// 由于我们需要访问 background.ts 中的状态，这个函数会在 background.ts 中实现
	return { requests: [] };
}

/**
 * 批准添加网络请求
 */
export async function handleAddChainRequestApprove(
	requestId: string,
	pendingAddChainRequests: Map<string, PendingAddChainRequest>
): Promise<void> {
	const request = pendingAddChainRequests.get(requestId);
	if (!request) {
		throw new Error('Request not found');
	}

	pendingAddChainRequests.delete(requestId);
	request.resolve(null);
}

/**
 * 拒绝添加网络请求
 */
export async function handleAddChainRequestReject(
	requestId: string,
	pendingAddChainRequests: Map<string, PendingAddChainRequest>
): Promise<void> {
	const request = pendingAddChainRequests.get(requestId);
	if (!request) {
		throw new Error('Request not found');
	}

	pendingAddChainRequests.delete(requestId);
	const error: ProviderRpcError = {
		name: 'ProviderError',
		message: 'User rejected the request',
		code: ProviderErrorCode.USER_REJECTED_REQUEST,
	};
	request.reject(error);
}
interface WatchAssetRequestMessage {
	message: any;
	sender: any;
	sendResponse: (response: any) => void;
	context: RequestContext;
}
export async function addChainRequestApproveHandler({
	message,
	sender,
	sendResponse,
	context: requestContext,
}: WatchAssetRequestMessage): Promise<void> {
	const { requestId } = message;
	try {
		const request = requestContext.pendingAddChainRequests.get(requestId);
		if (!request) {
			sendResponse({ success: false, error: 'Request not found' });
			return;
		}

		// 执行添加网络逻辑
		const chainParams = request.chainParams;
		const chainId = parseInt(chainParams.chainId, 16);

		const state = await getWalletState();
		if (!state) {
			throw new Error('Wallet not initialized');
		}
		// 创建新网络配置
		const newNetwork: import('@/types/wallet').Network = {
			id: `custom-${chainId}`,
			name: chainParams.chainName,
			rpcUrl: chainParams.rpcUrls[0] as string,
			chainId: chainId,
			currencySymbol: chainParams.nativeCurrency.symbol,
			blockExplorerUrl: chainParams.blockExplorerUrls?.[0],
		};

		// 更新钱包状态
		const storage = browser.storage.local;
		const result = await storage.get('wallet-store');
		const walletStore = result['wallet-store'] as
			import('../types').WalletStoreData | undefined;

		if (walletStore?.state) {
			walletStore.state.networks = [...walletStore.state.networks, newNetwork];
			await storage.set({ 'wallet-store': walletStore });
			handleAddChainRequestApprove(requestId, requestContext.pendingAddChainRequests);
			sendResponse({ success: true });
		} else {
			throw new Error('Failed to add network');
		}
	} catch (error: any) {
		console.error('[Background] Failed to approve add chain request:', error);
		const request = requestContext.pendingAddChainRequests.get(requestId);
		if (request) {
			const providerError: ProviderRpcError = {
				name: 'ProviderError',
				message: error.message || 'Failed to add network',
				code: ProviderErrorCode.DISCONNECTED,
			};
			request.reject(providerError);
			requestContext.pendingAddChainRequests.delete(requestId);
		}
		sendResponse({ success: false, error: error.message });
	}
}
