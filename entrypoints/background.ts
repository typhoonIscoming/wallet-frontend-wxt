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
import { Buffer } from 'buffer';
// 在全局作用域提供 Buffer polyfill
// 原因：浏览器环境默认没有 Node.js 的 Buffer，但 bip39 等库需要它
if (typeof globalThis.Buffer === 'undefined') {
	globalThis.Buffer = Buffer;
}

export default defineBackground(async () => {
	console.log('Hello background!', { id: browser.runtime.id });
	console.log('Background script initialized', 'sidePanel' in browser);
	if ('sidePanel' in browser) {
		browser.sidePanel
			.setPanelBehavior({ openPanelOnActionClick: false })
			.catch((error: unknown) =>
				console.error('Failed to disable side panel auto-open:', error)
			);
	}
	if ('action' in browser) {
		const handler = async () => {
			// const savedMode = await getSavedAppMode();
			// 这里默认都打开弹窗模式
			await applySavedMode('popup');
			console.log('打开弹窗');
			return;
		};
		browser.action.onClicked.addListener(handler);
	}
});
