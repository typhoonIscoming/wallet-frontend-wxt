import { ProviderErrorCode } from '@/types/eip1193';
import type { ProviderRpcError } from '@/types/eip1193';
import type { RequestContext, WalletStoreData } from '../types';
import { browser } from 'wxt/browser';
import { WALLET_STORE } from '@/utils/env';

/**
 * 处理 eth_chainId
 */
export async function handleEthChainId(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<string> {
	// 从钱包状态获取当前网络的 chainId
	try {
		const storage = browser.storage.local;
		const result = await storage.get(WALLET_STORE);
		const walletStore = result[WALLET_STORE] as WalletStoreData | undefined;

		if (walletStore?.state?.currentNetwork?.chainId) {
			// 将 chainId 转换为十六进制字符串
			const chainId = walletStore.state.currentNetwork.chainId;
			return `0x${chainId.toString(16)}`;
		}
	} catch (error) {
		console.error('[Background] Failed to get chainId:', error);
	}
	// 默认返回主网 chainId
	return '0x1';
}

/**
 * 处理 net_version
 */
export async function handleNetVersion(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<string> {
	// 从钱包状态获取当前网络的 chainId（作为版本号）
	try {
		const storage = browser.storage.local;
		const result = await storage.get(WALLET_STORE);
		const walletStore = result[WALLET_STORE] as WalletStoreData | undefined;

		if (walletStore?.state?.currentNetwork?.chainId) {
			return walletStore.state.currentNetwork.chainId.toString();
		}
	} catch (error) {
		console.error('[Background] Failed to get net version:', error);
	}
	// 默认返回主网版本
	return '1';
}

/**
 * 处理 wallet_switchEthereumChain
 */
export async function handleWalletSwitchEthereumChain(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<null> {
	// 切换以太坊网络 (EIP-3085)
	const paramsArray = Array.isArray(params) ? params : [];
	const chainIdParam = paramsArray[0] as { chainId: string };

	if (!chainIdParam || !chainIdParam.chainId) {
		throw {
			name: 'ProviderError',
			message: 'Missing chainId parameter',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	// 将十六进制 chainId 转换为数字
	const chainId = parseInt(chainIdParam.chainId, 16);
	if (isNaN(chainId)) {
		throw {
			name: 'ProviderError',
			message: 'Invalid chainId',
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

	// 查找匹配的网络
	const targetNetwork = state.networks.find((n) => n.chainId === chainId);
	if (!targetNetwork) {
		// 如果网络不存在，返回错误（按照 EIP-3085，应该使用 wallet_addEthereumChain）
		throw {
			name: 'ProviderError',
			message: `Unrecognized chain ID: ${chainIdParam.chainId}. Try adding the chain using wallet_addEthereumChain first.`,
			code: 4902, // CHAIN_NOT_ADDED
			data: { chainId: chainIdParam.chainId },
		} as ProviderRpcError;
	}

	// 如果目标网络已经是当前网络，直接返回成功
	if (state.currentNetwork?.chainId === chainId) {
		return null;
	}

	// 创建切换网络请求并等待用户确认
	return new Promise<null>((resolve, reject) => {
		const requestId = `switch_chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const origin = (context.sender as any)?.origin || 'unknown';

		context.pendingSwitchChainRequests.set(requestId, {
			requestId,
			origin,
			chainId: chainIdParam.chainId,
			targetNetwork,
			resolve,
			reject,
			timestamp: Date.now(),
		});

		// 打开 popup 并切换到切换网络确认页面
		context.setCurrentPopupRoute('switch-chain');
		context
			.openPopup()
			.then(() => {
				browser.runtime
					.sendMessage({
						type: 'POPUP_ROUTE_CHANGED',
						route: 'switch-chain',
					})
					.catch(() => {});
			})
			.catch((error) => {
				console.log(
					'[Background] Popup may already be open, sending route change message:',
					error
				);
				browser.runtime
					.sendMessage({
						type: 'POPUP_ROUTE_CHANGED',
						route: 'switch-chain',
					})
					.catch(() => {});
			});
	});
}

/**
 * 处理 wallet_addEthereumChain
 */
export async function handleWalletAddEthereumChain(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<null> {
	// 添加以太坊网络 (EIP-3085)
	const paramsArray = Array.isArray(params) ? params : [];
	const chainParams = paramsArray[0] as {
		chainId: string;
		chainName: string;
		nativeCurrency: {
			name: string;
			symbol: string;
			decimals: number;
		};
		rpcUrls: string[];
		blockExplorerUrls?: string[];
	};

	if (!chainParams || !chainParams.chainId || !chainParams.chainName || !chainParams.rpcUrls) {
		throw {
			name: 'ProviderError',
			message: 'Missing required parameters',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	// 将十六进制 chainId 转换为数字
	const chainId = parseInt(chainParams.chainId, 16);
	if (isNaN(chainId)) {
		throw {
			name: 'ProviderError',
			message: 'Invalid chainId',
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

	// 检查网络是否已存在
	const existingNetwork = state.networks.find((n) => n.chainId === chainId);
	if (existingNetwork) {
		// 如果网络已存在，直接返回 null（成功）
		return null;
	}

	// 创建添加网络请求并等待用户确认
	return new Promise<null>((resolve, reject) => {
		const requestId = `add_chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const origin = (context.sender as any)?.origin || 'unknown';

		context.pendingAddChainRequests.set(requestId, {
			requestId,
			origin,
			chainParams,
			resolve,
			reject,
			timestamp: Date.now(),
		});

		// 打开 popup 并切换到添加网络确认页面
		context.setCurrentPopupRoute('add-chain');
		context
			.openPopup()
			.then(() => {
				setTimeout(() => {
					browser.runtime
						.sendMessage({
							type: 'POPUP_ROUTE_CHANGED',
							route: 'add-chain',
						})
						.catch(() => {});
				}, 100);
			})
			.catch((error) => {
				console.log(
					'[Background] Popup may already be open, sending route change message:',
					error
				);
				context.setCurrentPopupRoute('add-chain');
				browser.runtime
					.sendMessage({
						type: 'POPUP_ROUTE_CHANGED',
						route: 'add-chain',
					})
					.catch(() => {});
			});

		// 60秒超时
		setTimeout(() => {
			if (context.pendingAddChainRequests.has(requestId)) {
				context.pendingAddChainRequests.delete(requestId);
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
