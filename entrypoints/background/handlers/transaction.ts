import { EthereumRpcMethod, ProviderErrorCode } from '@/types/eip1193';
import type { ProviderRpcError } from '@/types/eip1193';
import { ethers } from 'ethers';
import { browser } from 'wxt/browser';
import type { RequestContext } from '../types';

/**
 * 处理 eth_sendTransaction
 */
export async function handleEthSendTransaction(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<string> {
	// 发送交易（需要用户授权）
	console.log('[Background] ETH_SEND_TRANSACTION intercepted');
	const paramsArray = Array.isArray(params) ? params : [];
	const txRequest = paramsArray[0] as ethers.TransactionRequest;

	if (!txRequest) {
		throw {
			name: 'ProviderError',
			message: 'Missing transaction parameter',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	console.log('[Background] Transaction request:', {
		from: txRequest.from,
		to: txRequest.to,
		value: txRequest.value,
	});

	const wallet = await context.getUnlockedWallet();
	if (!wallet) {
		throw {
			name: 'ProviderError',
			message: 'Wallet not available or locked',
			code: ProviderErrorCode.UNAUTHORIZED,
		} as ProviderRpcError;
	}

	console.log('[Background] Wallet unlocked, creating transaction request');

	// 创建交易请求并等待用户确认
	return new Promise<string>((resolve, reject) => {
		const requestId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const origin = (context.sender as any)?.origin || 'unknown';

		console.log('[Background] Created transaction request:', requestId, 'from origin:', origin);

		context.pendingTransactionRequests.set(requestId, {
			requestId,
			origin,
			method: EthereumRpcMethod.ETH_SEND_TRANSACTION,
			transaction: txRequest, // 保留原始 transaction 对象用于实际执行
			resolve,
			reject,
			timestamp: Date.now(),
		});

		// 打开 popup 并切换到交易确认页面
		context.setCurrentPopupRoute('transaction');
		console.log('[Background] Opening popup for transaction confirmation');

		// 先设置路由，这样 popup 打开时会自动获取
		browser.runtime
			.sendMessage({
				type: 'POPUP_SET_ROUTE',
				route: 'transaction',
			})
			.catch(() => {});

		// 打开 popup
		context
			.openPopup()
			.then(() => {
				console.log('[Background] Popup opened, sending route change message');
				// 延迟发送路由切换消息，确保 popup 已经加载
				setTimeout(() => {
					browser.runtime
						.sendMessage({
							type: 'POPUP_ROUTE_CHANGED',
							route: 'transaction',
						})
						.catch((error) => {
							console.error(
								'[Background] Failed to send route change message:',
								error
							);
						});
				}, 100);
			})
			.catch((error) => {
				console.log(
					'[Background] Popup may already be open, sending route change message:',
					error
				);
				// 如果 popup 已经打开，延迟发送路由切换消息
				setTimeout(() => {
					browser.runtime
						.sendMessage({
							type: 'POPUP_ROUTE_CHANGED',
							route: 'transaction',
						})
						.catch((error) => {
							console.error(
								'[Background] Failed to send route change message:',
								error
							);
						});
				}, 100);
			});

		// 超时处理（60秒）
		setTimeout(() => {
			if (context.pendingTransactionRequests.has(requestId)) {
				context.pendingTransactionRequests.delete(requestId);
				const error: ProviderRpcError = {
					name: 'ProviderError',
					message: 'Transaction request timeout',
					code: ProviderErrorCode.DISCONNECTED,
				};
				reject(error);
			}
		}, 60000);
	});
}

/**
 * 处理 eth_signTransaction
 */
export async function handleEthSignTransaction(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<string> {
	// 签名交易（不发送）
	const paramsArray = Array.isArray(params) ? params : [];
	const txRequest = paramsArray[0] as ethers.TransactionRequest;

	if (!txRequest) {
		throw {
			name: 'ProviderError',
			message: 'Missing transaction parameter',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	const wallet = await context.getUnlockedWallet();
	if (!wallet) {
		throw {
			name: 'ProviderError',
			message: 'Wallet not available or locked',
			code: ProviderErrorCode.UNAUTHORIZED,
		} as ProviderRpcError;
	}

	// 创建交易签名请求并等待用户确认
	return new Promise<string>((resolve, reject) => {
		const requestId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const origin = (context.sender as any)?.origin || 'unknown';

		context.pendingTransactionRequests.set(requestId, {
			requestId,
			origin,
			method: EthereumRpcMethod.ETH_SIGN_TRANSACTION,
			transaction: txRequest, // 保留原始 transaction 对象用于实际执行
			resolve,
			reject,
			timestamp: Date.now(),
		});

		// 打开 popup 并切换到交易确认页面
		context.setCurrentPopupRoute('transaction');
		context
			.openPopup()
			.then(() => {
				browser.runtime
					.sendMessage({
						type: 'POPUP_ROUTE_CHANGED',
						route: 'transaction',
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
						route: 'transaction',
					})
					.catch(() => {});
			});

		// 超时处理（60秒）
		setTimeout(() => {
			if (context.pendingTransactionRequests.has(requestId)) {
				context.pendingTransactionRequests.delete(requestId);
				const error: ProviderRpcError = {
					name: 'ProviderError',
					message: 'Transaction request timeout',
					code: ProviderErrorCode.DISCONNECTED,
				};
				reject(error);
			}
		}, 60000);
	});
}

/**
 * 处理 eth_sendRawTransaction
 */
export async function handleEthSendRawTransaction(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<string> {
	// 发送已签名的原始交易
	const paramsArray = Array.isArray(params) ? params : [];
	const rawTx = paramsArray[0] as string;

	if (!rawTx) {
		throw {
			name: 'ProviderError',
			message: 'Missing raw transaction parameter',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	const provider = await context.getProvider();
	if (!provider) {
		throw {
			name: 'ProviderError',
			message: 'Provider not available',
			code: ProviderErrorCode.DISCONNECTED,
		} as ProviderRpcError;
	}

	const tx = await provider.broadcastTransaction(rawTx);
	return tx.hash;
}
