import { ethers } from 'ethers';
import type { RequestContext, PendingAddChainRequest } from './types';
import getWalletState from './getWalletState';
import type { ProviderRpcError } from '@/types/eip1193';
import { ProviderErrorCode } from '@/types/eip1193';
import {
	handleAddChainRequestApprove,
	handleAddChainRequestReject,
} from './handlers/add-chain-handler';

interface WatchAssetRequestMessage {
	message: any;
	sender: any;
	sendResponse: (response: any) => void;
	context: RequestContext;
}

export async function watchAssetRequestApprove({
	message,
	sendResponse,
	context,
}: WatchAssetRequestMessage) {
	// 用户批准添加代币请求
	const { requestId } = message;
	try {
		const request = context.pendingAddChainRequests.get(requestId) as PendingAddChainRequest;
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
		const walletStore = result['wallet-store'] as import('./types').WalletStoreData | undefined;

		if (walletStore?.state) {
			walletStore.state.networks = [...walletStore.state.networks, newNetwork];
			await storage.set({ 'wallet-store': walletStore });
			handleAddChainRequestApprove(requestId, context.pendingAddChainRequests);
			sendResponse({ success: true });
		} else {
			throw new Error('Failed to add network');
		}
	} catch (error: any) {
		console.error('[Background] Failed to approve add chain request:', error);
		const request = context.pendingAddChainRequests.get(requestId);
		if (request) {
			const providerError: ProviderRpcError = {
				name: 'ProviderError',
				message: error.message || 'Failed to add network',
				code: ProviderErrorCode.DISCONNECTED,
			};
			request.reject(providerError);
			context.pendingAddChainRequests.delete(requestId);
		}
		sendResponse({ success: false, error: error.message });
	}
}

export function watchAssetRequestReject({
	message,
	sendResponse,
	context,
}: WatchAssetRequestMessage) {
	const { requestId } = message;
	handleAddChainRequestReject(requestId, context.pendingAddChainRequests);
	sendResponse({ success: true });
}
