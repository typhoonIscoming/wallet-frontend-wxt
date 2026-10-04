/**
 * Background Script 主入口文件
 *
 * 【架构位置】
 * 这是浏览器扩展的 Background Script，是整个钱包扩展的核心协调者。
 * 它运行在独立的 Service Worker 上下文中，即使所有页面关闭也会保持运行。
 *
 * 【核心职责】
 * 1. 接收并路由所有来自 Content Script 的 EIP-1193 RPC 请求
 * 2. 管理所有待处理的用户确认请求（授权、签名、交易等）
 * 3. 协调 Popup UI 的显示和路由
 * 4. 处理钱包状态管理（通过 chrome.storage.local）
 * 5. 提供钱包操作的后端支持（助记词生成、密码管理等）
 *
 * 【消息流】
 * 页面 → Content Script → Background Script → Popup UI → Background Script → Content Script → 页面
 *
 * 【关键设计】
 * - 使用 Map 存储待处理的请求，以 requestId 为键
 * - 所有敏感操作都需要用户确认，通过 Popup UI 展示
 * - 使用 Promise 模式处理异步的用户确认流程
 */
import { browser } from 'wxt/browser';
import { applySavedMode, getSavedAppMode } from '@/utils/mode';
import type { AppMode } from '@/utils/mode';
import { MODE_STORAGE_KEY, POPUP, SIDEPANEL } from '@/utils/env';
import { Buffer } from 'buffer';

import type {
	RequestContext,
	PendingAuthRequest,
	PendingSignRequest,
	PendingSwitchChainRequest,
	PendingTransactionRequest,
	PendingAddChainRequest,
	PendingWatchAssetRequest,
} from '@/entrypoints/background/types';
import { ProviderErrorCode } from '@/types/eip1193';
import type { ProviderRpcError } from '@/types/eip1193';
import getWalletState from '@/entrypoints/background/getWalletState';
import getWalletAccounts from '@/entrypoints/background/getWalletAccounts';
import getProvider from '@/entrypoints/background/getProvider';
import getUnlockedWallet from '@/entrypoints/background/getUnlockedWallet';
import requestUserAuth from '@/entrypoints/background/requestUserAuth';
import openPopup from '@/entrypoints/background/popup';
import handleEIP1193Request from '@/entrypoints/background/router';

import setWalletPassword, { getWalletPassword } from './background/back-utils';

// 在全局作用域提供 Buffer polyfill
// 原因：浏览器环境默认没有 Node.js 的 Buffer，但 bip39 等库需要它
if (typeof globalThis.Buffer === 'undefined') {
	globalThis.Buffer = Buffer;
}

export default defineBackground(async () => {
	console.log('Hello background!', { id: browser.runtime.id });

	/**
	 * 【Popup 路由管理】
	 * 跟踪当前 Popup 应该显示哪个页面。
	 * 当 DApp 发起需要用户确认的操作时，Background 会设置路由并打开 Popup。
	 * Popup 通过 POPUP_GET_ROUTE 消息获取当前路由。
	 */
	let currentPopupRoute: string | null = null;

	const pendingAuthRequests = new Map<string, PendingAuthRequest>(); // 账户授权请求
	const pendingSignRequests = new Map<string, PendingSignRequest>(); // 签名请求
	const pendingSwitchChainRequests = new Map<string, PendingSwitchChainRequest>(); // 网络切换请求
	const pendingTransactionRequests = new Map<string, PendingTransactionRequest>(); // 交易请求
	const pendingAddChainRequests = new Map<string, PendingAddChainRequest>(); // 添加网络请求
	const pendingWatchAssetRequests = new Map<string, PendingWatchAssetRequest>(); // 添加代币请求
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
	const requestContext: RequestContext = {
		getWalletState,
		getWalletAccounts,
		getProvider,
		getUnlockedWallet,
		requestUserAuth: (origin: string) =>
			requestUserAuth(origin, pendingAuthRequests, openPopup, (route) => {
				currentPopupRoute = route;
			}),
		openPopup,
		get currentPopupRoute() {
			return currentPopupRoute;
		},
		setCurrentPopupRoute: (route: string) => {
			currentPopupRoute = route;
		},
		pendingAuthRequests,
		pendingSignRequests,
		pendingSwitchChainRequests,
		pendingTransactionRequests,
		pendingAddChainRequests,
		pendingWatchAssetRequests,
	};

	/**
	 * 【消息监听器 - 核心消息路由】
	 *
	 * 这是 Background Script 的消息总入口，处理所有来自其他扩展组件（Content Script、Popup）的消息。
	 *
	 * 消息类型分类：
	 * 1. EIP1193_REQUEST: DApp 的 RPC 请求（通过 Content Script 转发）
	 * 2. POPUP_*: Popup 路由管理
	 * 3. AUTH_REQUEST_*: 账户授权确认
	 * 4. SIGN_REQUEST_*: 签名确认
	 * 5. SWITCH_CHAIN_REQUEST_*: 网络切换确认
	 * 6. TRANSACTION_REQUEST_*: 交易确认
	 * 7. ADD_CHAIN_REQUEST_*: 添加网络确认
	 * 8. WATCH_ASSET_REQUEST_*: 添加代币确认
	 * 9. MNEMONIC_*: 助记词管理（仅用于 Popup）
	 * 10. WALLET_*: 钱包密码管理（仅用于 Popup）
	 *
	 * 注意：返回 true 表示异步响应，保持消息通道开放。
	 */

	const messageListener = (message: any, sender: any, sendResponse: any) => {
		// Popup 路由管理
		if (message.type === 'POPUP_GET_ROUTE') {
			sendResponse({ route: currentPopupRoute || 'main' });
			return true;
		}
		if (message.type === 'POPUP_SET_ROUTE') {
			const newRoute = message.route;
			if (newRoute && newRoute !== currentPopupRoute) {
				currentPopupRoute = newRoute;
				// 通知所有 popup 实例路由已更改
				browser.runtime
					.sendMessage({
						type: 'POPUP_ROUTE_CHANGED',
						route: newRoute,
					})
					.catch(() => {
						// 如果没有监听器，忽略错误
					});
			}
			sendResponse({ success: true });
			return true;
		}

		/**
		 * 【EIP-1193 RPC 请求处理】
		 *
		 * 这是所有 DApp 交互的入口点。
		 *
		 * 处理流程：
		 * 1. Content Script 接收到页面的 RPC 请求
		 * 2. Content Script 转发到 Background（EIP1193_REQUEST）
		 * 3. Background 路由到对应的处理器（router.ts）
		 * 4. 处理器可能需要用户确认（打开 Popup）
		 * 5. 返回结果给 Content Script
		 * 6. Content Script 通过 postMessage 返回给页面
		 *
		 * 错误处理：所有错误都会被包装为 ProviderRpcError，符合 EIP-1193 标准。
		 */
		if (message.type === 'EIP1193_REQUEST') {
			console.log('[Background] Received EIP1193_REQUEST:', message.method, message.params);
			requestContext.sender = sender as any; // 保存发送者信息，用于获取 origin
			handleEIP1193Request(message.method, message.params, requestContext)
				.then((result) => {
					console.log('[Background] EIP1193_REQUEST success:', message.method, result);
					sendResponse({ success: true, result });
				})
				.catch((error: ProviderRpcError) => {
					console.error('[Background] EIP1193_REQUEST error:', message.method, error);
					sendResponse({
						success: false,
						error: {
							message: error.message,
							code: error.code || ProviderErrorCode.UNSUPPORTED_METHOD,
							data: error.data,
						},
					});
				});
			return true; // 保持消息通道开放以支持异步响应
		}
		// 钱包密码管理
		if (message.type === 'WALLET_SET_PASSWORD') {
			setWalletPassword({ message, sender, sendResponse });
			return true;
		}
		if (message.type === 'WALLET_GET_PASSWORD') {
			getWalletPassword({ message, sender, sendResponse });
			return true;
		}
	};
	browser.runtime.onMessage.addListener(messageListener);

	/***********************************************************************************************************************/
	/**************************************打开插件是否是弹窗还是侧边栏**********************************************************/
	/***********************************************************************************************************************/
	let currentMode: AppMode = 'popup';
	// 启动时加载配置到内存
	browser.storage.local.get(MODE_STORAGE_KEY).then(({ [MODE_STORAGE_KEY]: mode }) => {
		currentMode = (mode as AppMode) ?? 'popup';
	});
	// 监听配置变化，保持内存同步
	browser.storage.onChanged.addListener((changes, area) => {
		if (area === 'local' && changes[MODE_STORAGE_KEY]) {
			currentMode = (changes[MODE_STORAGE_KEY].newValue as AppMode) ?? 'popup';
		}
	});
	const handler = (tab: any) => {
		// 这里默认都打开弹窗模式
		if (currentMode === SIDEPANEL) {
			// 2. 打开侧边栏（需提供 windowId）
			const windowId = tab.windowId;
			browser.sidePanel.open({ windowId });
		} else if (currentMode === POPUP) {
			// 3. 打开弹窗
			// 注意：openPopup 的可用性有限，通常需要配合 action.setPopup 动态设置
			browser.action.openPopup();
		}
	};
	browser.action.onClicked.addListener(handler);
});
