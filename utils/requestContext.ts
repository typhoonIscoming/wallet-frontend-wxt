/**
 * 【请求上下文 (RequestContext)】
 *
 * 这是一个共享的上下文对象，传递给所有 RPC 方法处理器。
 * 它提供了：
 * - 钱包状态访问方法（getWalletState, getWalletAccounts）
 * - Provider 和 Wallet 实例获取（getProvider, getUnlockedWallet）
 * - 用户授权流程（requestUserAuth）
 * - Popup 管理（openPopup, currentPopupRoute）
 * - 所有待处理请求的 Map（用于创建新请求）
 *
 * 设计目的：避免在处理器之间传递大量参数，提供统一的接口。
 */
import type {
	RequestContext,
	PendingAuthRequest,
	PendingSignRequest,
	PendingSwitchChainRequest,
	PendingTransactionRequest,
	PendingAddChainRequest,
	PendingWatchAssetRequest,
} from '@/entrypoints/background/types';

export const pendingAuthRequests = new Map<string, PendingAuthRequest>(); // 账户授权请求
export const pendingSignRequests = new Map<string, PendingSignRequest>(); // 签名请求
export const pendingSwitchChainRequests = new Map<string, PendingSwitchChainRequest>(); // 网络切换请求
export const pendingTransactionRequests = new Map<string, PendingTransactionRequest>(); // 交易请求
export const pendingAddChainRequests = new Map<string, PendingAddChainRequest>(); // 添加网络请求
export const pendingWatchAssetRequests = new Map<string, PendingWatchAssetRequest>(); // 添加代币请求

export const requestContext: RequestContext = {
	// 初始化各个方法和属性，根据实际实现进行填充
	sender: undefined,
	getWalletState: async () => null,
	getWalletAccounts: async () => [],
	getProvider: async () => null,
	getUnlockedWallet: async () => null,
	requestUserAuth: async (origin: string) => [],
	openPopup: async () => {},
	currentPopupRoute: null,
	setCurrentPopupRoute: (route: string) => {},
	pendingAuthRequests: pendingAuthRequests,
	pendingSignRequests: pendingSignRequests,
	pendingSwitchChainRequests: pendingSwitchChainRequests,
	pendingTransactionRequests: pendingTransactionRequests,
	pendingAddChainRequests: pendingAddChainRequests,
	pendingWatchAssetRequests: pendingWatchAssetRequests,
};
