import { ProviderErrorCode } from '@/types/eip1193';
import type { ProviderRpcError } from '@/types/eip1193';
import type { RequestContext } from '../types';
import { browser } from 'wxt/browser';
import type { WalletStoreData } from '../types';
import { ethers } from 'ethers';

/**
 * 处理 wallet_watchAsset (EIP-747)
 * 允许 DApp 请求用户将代币添加到钱包中
 */
export async function handleWalletWatchAsset(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<boolean> {
	console.log('[Background] handleWalletWatchAsset called with params:', params);
	const paramsArray = Array.isArray(params) ? params : [];
	const assetParams = paramsArray[0] as {
		type: string;
		options: {
			address: string;
			symbol?: string;
			decimals?: number;
			image?: string;
		};
	};

	if (!assetParams || !assetParams.type || !assetParams.options) {
		throw {
			name: 'ProviderError',
			message: 'Missing required parameters',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	// 目前只支持 ERC20 代币
	if (assetParams.type !== 'ERC20') {
		throw {
			name: 'ProviderError',
			message: `Unsupported asset type: ${assetParams.type}. Only ERC20 is supported.`,
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	const { address, symbol, decimals, image } = assetParams.options;

	if (!address) {
		throw {
			name: 'ProviderError',
			message: 'Missing address in options',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	// 验证地址格式
	try {
		ethers.getAddress(address);
	} catch (error) {
		throw {
			name: 'ProviderError',
			message: 'Invalid address format',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	// 获取钱包状态
	const state = await context.getWalletState();
	if (!state) {
		throw {
			name: 'ProviderError',
			message: 'Wallet not initialized',
			code: ProviderErrorCode.UNAUTHORIZED,
		} as ProviderRpcError;
	}

	// 检查代币是否已存在
	const normalizedAddress = ethers.getAddress(address);
	const existingToken = state.tokens.find(
		(token) =>
			ethers.getAddress(token.address).toLowerCase() === normalizedAddress.toLowerCase()
	);

	if (existingToken) {
		// 如果代币已存在，直接返回 true
		return true;
	}

	// 创建添加代币请求并等待用户确认
	return new Promise<boolean>((resolve, reject) => {
		const requestId = `watch_asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const origin = (context.sender as any)?.origin || 'unknown';

		context.pendingWatchAssetRequests.set(requestId, {
			requestId,
			origin,
			assetParams: {
				type: assetParams.type,
				options: {
					address: normalizedAddress,
					symbol,
					decimals,
					image,
				},
			},
			resolve,
			reject,
			timestamp: Date.now(),
		});

		// 打开 popup 并切换到添加代币确认页面
		context.setCurrentPopupRoute('watch-asset');
		context
			.openPopup()
			.then(() => {
				setTimeout(() => {
					browser.runtime
						.sendMessage({
							type: 'POPUP_ROUTE_CHANGED',
							route: 'watch-asset',
						})
						.catch(() => {});
				}, 100);
			})
			.catch((error) => {
				console.log(
					'[Background] Popup may already be open, sending route change message:',
					error
				);
				context.setCurrentPopupRoute('watch-asset');
				browser.runtime
					.sendMessage({
						type: 'POPUP_ROUTE_CHANGED',
						route: 'watch-asset',
					})
					.catch(() => {});
			});

		// 60秒超时
		setTimeout(() => {
			if (context.pendingWatchAssetRequests.has(requestId)) {
				context.pendingWatchAssetRequests.delete(requestId);
				const error: ProviderRpcError = {
					name: 'ProviderError',
					message: 'Request timeout',
					code: ProviderErrorCode.DISCONNECTED,
				};
				reject(error);
			}
		}, 60000);
	});
}
