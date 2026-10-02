import { ProviderErrorCode } from '@/types/eip1193';
import type { ProviderRpcError } from '@/types/eip1193';
import type { RequestContext } from '../types';

/**
 * 处理 eth_requestAccounts
 */
export async function handleEthRequestAccounts(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<string[]> {
	let origin = 'unknown';
	try {
		if (context.sender?.url) {
			origin = new URL(context.sender.url).origin;
		} else if (context.sender?.tab?.url) {
			origin = new URL(context.sender.tab.url).origin;
		}
	} catch (e) {
		console.error('[Background] Failed to get origin:', e);
	}

	// 检查钱包是否已解锁且有账户
	const accounts = await context.getWalletAccounts();
	if (accounts.length === 0) {
		// 如果钱包未解锁或没有账户，返回错误
		const error: ProviderRpcError = {
			name: 'ProviderError',
			message: 'No accounts available. Please unlock your wallet first.',
			code: ProviderErrorCode.UNAUTHORIZED,
		};
		throw error;
	}

	// 请求用户授权
	try {
		const authorizedAccounts = await context.requestUserAuth(origin);
		return authorizedAccounts;
	} catch (error) {
		// 如果用户拒绝或超时，抛出错误
		throw error;
	}
}

/**
 * 处理 eth_accounts
 */
export async function handleEthAccounts(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<string[]> {
	// eth_accounts 返回当前已连接的账户，不需要用户授权
	const accounts = await context.getWalletAccounts();
	return accounts;
}

/**
 * 处理 eth_coinbase
 */
export async function handleEthCoinbase(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<string | null> {
	// 返回当前账户地址（作为 coinbase）
	const accounts = await context.getWalletAccounts();
	return accounts.length > 0 ? (accounts[0] as string) : null;
}
