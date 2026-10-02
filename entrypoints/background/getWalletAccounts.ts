/**
 * 从 storage 获取钱包账户地址
 *
 * 【用途】
 * 主要用于 eth_accounts 和 eth_requestAccounts 方法。
 *
 * 【返回条件】
 * - 钱包未初始化：返回 []
 * - 钱包已锁定：返回 []
 * - 没有当前账户：返回 []
 * - 正常情况：返回 [currentAccount.address]
 *
 * 【设计说明】
 * 只返回当前账户，符合大多数钱包的行为。
 * 如果需要多账户支持，可以扩展为返回所有账户。
 *
 * @returns Promise<string[]> - 账户地址数组
 */
import getWalletState from './getWalletState';

export async function getWalletAccounts(): Promise<string[]> {
	try {
		const state = await getWalletState();
		if (!state || state.isLocked || !state.currentAccount) {
			return [];
		}
		return [state.currentAccount.address];
	} catch (error) {
		console.error('[Background] Failed to get wallet accounts:', error);
		return [];
	}
}
