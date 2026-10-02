import { EthereumRpcMethod, ProviderErrorCode } from '@/types/eip1193';
import type { ProviderRpcError } from '@/types/eip1193';
import { ethers } from 'ethers';
import { browser } from 'wxt/browser';
import type { RequestContext } from '../types';

/**
 * 处理 eth_sign
 */
export async function handleEthSign(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<string> {
	// 签名消息（已弃用，但为了兼容性保留）
	const paramsArray = Array.isArray(params) ? params : [];
	const address = paramsArray[0] as string;
	const message = paramsArray[1] as string;

	if (!address || !message) {
		throw {
			name: 'ProviderError',
			message: 'Missing parameters',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	const wallet = await context.getUnlockedWallet();
	if (!wallet || wallet.address.toLowerCase() !== address.toLowerCase()) {
		throw {
			name: 'ProviderError',
			message: 'Wallet not available or address mismatch',
			code: ProviderErrorCode.UNAUTHORIZED,
		} as ProviderRpcError;
	}

	// 创建签名请求并等待用户确认
	return new Promise<string>((resolve, reject) => {
		const requestId = `sign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const origin = (context.sender as any)?.origin || 'unknown';

		context.pendingSignRequests.set(requestId, {
			requestId,
			origin,
			method: EthereumRpcMethod.ETH_SIGN,
			address,
			message,
			resolve,
			reject,
			timestamp: Date.now(),
		});

		// 打开 popup 并切换到签名确认页面
		context.setCurrentPopupRoute('sign');

		// 先尝试打开 popup
		context
			.openPopup()
			.then(() => {
				// popup 打开后，发送路由变化消息
				browser.runtime
					.sendMessage({
						type: 'POPUP_ROUTE_CHANGED',
						route: 'sign',
					})
					.catch(() => {});
			})
			.catch((error) => {
				// 如果无法打开 popup（可能已经打开），直接发送路由变化消息
				console.log(
					'[Background] Popup may already be open, sending route change message:',
					error
				);
				browser.runtime
					.sendMessage({
						type: 'POPUP_ROUTE_CHANGED',
						route: 'sign',
					})
					.catch(() => {});
			});
	});
}

/**
 * 处理 personal_sign
 */
export async function handlePersonalSign(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<string> {
	// 个人签名（推荐使用）
	const paramsArray = Array.isArray(params) ? params : [];
	const message = paramsArray[0] as string;
	const address = paramsArray[1] as string;

	if (!message || !address) {
		throw {
			name: 'ProviderError',
			message: 'Missing parameters',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	const wallet = await context.getUnlockedWallet();
	if (!wallet || wallet.address.toLowerCase() !== address.toLowerCase()) {
		throw {
			name: 'ProviderError',
			message: 'Wallet not available or address mismatch',
			code: ProviderErrorCode.UNAUTHORIZED,
		} as ProviderRpcError;
	}

	// 创建签名请求并等待用户确认
	return new Promise<string>((resolve, reject) => {
		const requestId = `sign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const origin = (context.sender as any)?.origin || 'unknown';

		context.pendingSignRequests.set(requestId, {
			requestId,
			origin,
			method: EthereumRpcMethod.PERSONAL_SIGN,
			address,
			message,
			resolve,
			reject,
			timestamp: Date.now(),
		});

		// 打开 popup 并切换到签名确认页面
		context.setCurrentPopupRoute('sign');

		// 先尝试打开 popup
		context
			.openPopup()
			.then(() => {
				// popup 打开后，发送路由变化消息
				browser.runtime
					.sendMessage({
						type: 'POPUP_ROUTE_CHANGED',
						route: 'sign',
					})
					.catch(() => {});
			})
			.catch((error) => {
				// 如果无法打开 popup（可能已经打开），直接发送路由变化消息
				console.log(
					'[Background] Popup may already be open, sending route change message:',
					error
				);
				browser.runtime
					.sendMessage({
						type: 'POPUP_ROUTE_CHANGED',
						route: 'sign',
					})
					.catch(() => {});
			});
	});
}

/**
 * 处理 eth_signTypedData 系列
 */
export async function handleEthSignTypedData(
	method: string,
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<string> {
	// EIP-712 结构化数据签名
	const paramsArray = Array.isArray(params) ? params : [];
	const address = paramsArray[0] as string;
	const typedData = paramsArray[1] as any;

	if (!address || !typedData) {
		throw {
			name: 'ProviderError',
			message: 'Missing parameters',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	// 验证地址格式
	if (!ethers.isAddress(address)) {
		throw {
			name: 'ProviderError',
			message: 'Invalid address format',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	// 验证 typedData 结构
	if (!typedData.domain || !typedData.types || !typedData.message) {
		throw {
			name: 'ProviderError',
			message: 'Invalid typed data format. Expected { domain, types, message }',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	const wallet = await context.getUnlockedWallet();
	if (!wallet || wallet.address.toLowerCase() !== address.toLowerCase()) {
		throw {
			name: 'ProviderError',
			message: 'Wallet not available or address mismatch',
			code: ProviderErrorCode.UNAUTHORIZED,
		} as ProviderRpcError;
	}

	// 创建签名请求并等待用户确认
	return new Promise<string>((resolve, reject) => {
		const requestId = `sign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const origin = (context.sender as any)?.origin || 'unknown';

		// 确定 primaryType
		let primaryType: string | undefined = (typedData as any).primaryType;
		if (!primaryType) {
			primaryType = Object.keys(typedData.types).find(
				(type) => type !== 'EIP712Domain' && typedData.types[type]
			);
		}
		if (!primaryType && typedData.message) {
			const messageKeys = Object.keys(typedData.message);
			for (const typeName of Object.keys(typedData.types)) {
				if (typeName === 'EIP712Domain') continue;
				const typeFields = typedData.types[typeName];
				if (Array.isArray(typeFields)) {
					const fieldNames = typeFields.map((f: any) => f.name);
					if (messageKeys.some((key) => fieldNames.includes(key))) {
						primaryType = typeName;
						break;
					}
				}
			}
		}
		if (!primaryType) {
			primaryType =
				Object.keys(typedData.types).find((type) => type !== 'EIP712Domain') ||
				Object.keys(typedData.types)[0];
		}

		context.pendingSignRequests.set(requestId, {
			requestId,
			origin,
			method,
			address,
			typedData: {
				domain: typedData.domain,
				types: typedData.types,
				message: typedData.message,
				primaryType,
			},
			resolve,
			reject,
			timestamp: Date.now(),
		});

		// 打开 popup 并切换到签名确认页面
		context.setCurrentPopupRoute('sign');

		// 先尝试打开 popup
		context
			.openPopup()
			.then(() => {
				// popup 打开后，发送路由变化消息
				browser.runtime
					.sendMessage({
						type: 'POPUP_ROUTE_CHANGED',
						route: 'sign',
					})
					.catch(() => {});
			})
			.catch((error) => {
				// 如果无法打开 popup（可能已经打开），直接发送路由变化消息
				console.log(
					'[Background] Popup may already be open, sending route change message:',
					error
				);
				browser.runtime
					.sendMessage({
						type: 'POPUP_ROUTE_CHANGED',
						route: 'sign',
					})
					.catch(() => {});
			});
	});
}
