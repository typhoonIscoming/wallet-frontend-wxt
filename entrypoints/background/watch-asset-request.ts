import { ethers } from 'ethers';
import type { RequestContext } from './types';
import type { ProviderRpcError } from '@/types/eip1193';
import { ProviderErrorCode } from '@/types/eip1193';
import getProvider from './getProvider';
import {
	handleWatchAssetRequestApprove,
	handleWatchAssetRequestReject,
} from './handlers/watch-asset-handler';

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
		const request = context.pendingWatchAssetRequests.get(requestId);
		if (!request) {
			sendResponse({ success: false, error: 'Request not found' });
			return;
		}

		// 执行添加代币逻辑
		const { address, symbol, decimals, image } = request.assetParams.options;
		const normalizedAddress = ethers.getAddress(address);

		// 如果提供了 symbol 和 decimals，直接使用
		// 否则从链上获取
		let tokenSymbol = symbol;
		let tokenName = symbol || 'Unknown Token';
		let tokenDecimals = decimals ?? 18;

		try {
			const provider = await getProvider();
			if (provider) {
				const ERC20_ABI = [
					'function decimals() view returns (uint8)',
					'function symbol() view returns (string)',
					'function name() view returns (string)',
				];

				const tokenContract = new ethers.Contract(normalizedAddress, ERC20_ABI, provider);

				// 并行获取代币信息
				const [decimalsResult, symbolResult, nameResult] = await Promise.all([
					tokenContract.decimals().catch(() => tokenDecimals),
					tokenContract.symbol().catch(() => symbol || 'UNKNOWN'),
					tokenContract.name().catch(() => tokenName),
				]);

				tokenDecimals = Number(decimalsResult);
				tokenSymbol = symbolResult || symbol || 'UNKNOWN';
				tokenName = nameResult || tokenName;
			}
		} catch (error) {
			console.error('[Background] Failed to fetch token info from chain:', error);
			if (!tokenSymbol) {
				tokenSymbol = 'UNKNOWN';
			}
		}

		// 创建新代币
		const newToken: import('@/types/wallet').Token = {
			address: normalizedAddress,
			symbol: tokenSymbol || 'UNKNOWN',
			name: tokenName || 'Unknown Token',
			decimals: tokenDecimals,
			logoURI: image,
		};

		// 更新钱包状态
		const storage = browser.storage.local;
		const result = await storage.get('wallet-store');
		const walletStore = result['wallet-store'] as import('./types').WalletStoreData | undefined;

		if (walletStore?.state) {
			// 添加新代币到代币列表（如果已存在则更新）
			const existingIndex = walletStore.state.tokens.findIndex(
				(token) =>
					ethers.getAddress(token.address).toLowerCase() ===
					normalizedAddress.toLowerCase()
			);

			if (existingIndex >= 0) {
				// 更新现有代币
				walletStore.state.tokens[existingIndex] = {
					...walletStore.state.tokens[existingIndex],
					...newToken,
					// 保留现有余额
					balance: walletStore.state.tokens[existingIndex as number].balance as string,
				};
			} else {
				// 添加新代币
				walletStore.state.tokens = [...walletStore.state.tokens, newToken];
			}

			await storage.set({ 'wallet-store': walletStore });
			handleWatchAssetRequestApprove(requestId, context.pendingWatchAssetRequests);
			sendResponse({ success: true });
		} else {
			throw new Error('Failed to add token');
		}
	} catch (error: any) {
		console.error('[Background] Failed to approve watch asset request:', error);
		const request = context.pendingWatchAssetRequests.get(requestId);
		if (request) {
			const providerError: ProviderRpcError = {
				name: 'ProviderError',
				message: error.message || 'Failed to add token',
				code: ProviderErrorCode.DISCONNECTED,
			};
			request.reject(providerError);
			context.pendingWatchAssetRequests.delete(requestId);
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
	handleWatchAssetRequestReject(requestId, context.pendingWatchAssetRequests);
	sendResponse({ success: true });
}
