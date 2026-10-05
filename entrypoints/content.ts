/**
 * Content Script - Provider 注入和消息桥接
 *
 * 【架构位置】
 * Content Script 运行在页面的上下文中，但无法直接访问页面的 JavaScript 变量。
 * 它充当页面和 Background Script 之间的桥梁。
 *
 * 【核心职责】
 * 1. 注入 Provider 脚本到页面上下文（通过 <script> 标签）
 * 2. 监听页面通过 postMessage 发送的 RPC 请求
 * 3. 将请求转发到 Background Script
 * 4. 将 Background 的响应通过 postMessage 返回给页面
 * 5. 处理网络切换事件通知
 *
 * 【为什么需要 Content Script】
 * - Background Script 无法直接访问页面上下文
 * - 页面中的 Provider 需要与扩展通信
 * - Content Script 可以同时访问页面 DOM 和扩展 API
 *
 * 【消息流】
 * 页面 Provider → postMessage → Content Script → browser.runtime.sendMessage → Background
 * Background → sendResponse → Content Script → postMessage → 页面 Provider
 */
export default defineContentScript({
	// matches: ['*://*.google.com/*'],
	matches: ['<all_urls>'], // 匹配所有网站
	runAt: 'document_start', // 在 DOM 构建之前运行，确保尽早注入
	main() {
		console.log('Hello content.');
		/**
		 * 【Provider 注入函数】
		 *
		 * 关键点：
		 * 1. 使用 <script> 标签注入，而不是直接执行代码
		 *    - 原因：Content Script 和页面有不同的 JavaScript 上下文
		 *    - <script> 标签中的代码会在页面上下文中执行
		 *
		 * 2. 使用 browser.runtime.getURL 获取脚本 URL
		 *    - 这是 web-accessible resource，需要在 manifest 中声明
		 *    - 绕过 CSP（Content Security Policy）限制
		 *
		 * 3. 防止重复注入
		 *    - 使用 data 属性标记已注入
		 *    - 避免多次注入导致 window.ethereum 被覆盖
		 *
		 * 4. 多种注入策略
		 *    - 优先注入到 documentElement
		 *    - 如果 DOM 未准备好，等待 DOMContentLoaded
		 *    - 使用 setTimeout 作为备用方案
		 */
		function injectScriptToPage() {
			try {
				// 检查是否已经注入
				if (document.documentElement?.getAttribute('data-wxt-provider-injected')) {
					console.log('[WXT EIP-1193] Provider already injected (marked)');
					return;
				}

				const script = document.createElement('script');
				script.src = browser.runtime.getURL('/inject-provider.js');
				script.onload = () => {
					console.log('[WXT EIP-1193] Provider script loaded successfully');
					// 标记已注入
					if (document.documentElement) {
						document.documentElement.setAttribute('data-wxt-provider-injected', 'true');
					}
					script.remove();
				};
				script.onerror = (error) => {
					console.error('[WXT EIP-1193] Failed to load script:', error);
					console.error(
						'[WXT EIP-1193] Script URL:',
						browser.runtime.getURL('/inject-provider.js')
					);
				};

				// 尝试多种方式注入
				if (document.documentElement) {
					document.documentElement.appendChild(script);
				} else if (document.head) {
					document.head.appendChild(script);
				} else if (document.body) {
					document.body.appendChild(script);
				} else {
					// 如果都不存在，等待 DOM 准备好
					if (document.readyState === 'loading') {
						document.addEventListener('DOMContentLoaded', injectScriptToPage);
					} else {
						setTimeout(injectScriptToPage, 10);
					}
				}
			} catch (error) {
				console.error('[WXT EIP-1193] Failed to inject script:', error);
				// 如果失败，稍后重试
				setTimeout(injectScriptToPage, 100);
			}
		}

		// 立即尝试注入
		if (document.readyState === 'loading') {
			// 如果 DOM 还在加载，等待 DOMContentLoaded
			document.addEventListener('DOMContentLoaded', injectScriptToPage);
		} else {
			// 如果 DOM 已经准备好，立即注入
			injectScriptToPage();
		}

		// 备用：如果 DOMContentLoaded 已经触发，使用 setTimeout
		setTimeout(injectScriptToPage, 0);

		/**
		 * 【页面消息监听器】
		 *
		 * 监听页面通过 postMessage 发送的 RPC 请求。
		 *
		 * 安全验证：
		 * 1. 检查消息来源标识（source === 'wxt-eip1193-page'）
		 *    - 防止其他脚本伪造消息
		 *
		 * 2. 验证消息来源窗口（event.source === window）
		 *    - 确保消息来自当前窗口，不是 iframe 或其他窗口
		 *    - 防止跨窗口消息注入攻击
		 *
		 * 消息格式：
		 * {
		 *   source: 'wxt-eip1193-page',
		 *   messageId: string,  // 用于匹配请求和响应
		 *   method: string,     // RPC 方法名（如 'eth_requestAccounts'）
		 *   params: any[]       // RPC 参数
		 * }
		 */
		window.addEventListener('message', async (event) => {
			// 只处理来自页面的消息
			if (event.data?.source !== 'wxt-eip1193-page') {
				return;
			}

			// 验证消息来源 - 来自同一个窗口
			if (event.source !== window) {
				return;
			}

			const { messageId, method, params } = event.data;

			console.log('[Content] Received RPC request from page:', method, params);

			try {
				/**
				 * 【请求转发】
				 *
				 * 将页面的 RPC 请求转发到 Background Script。
				 *
				 * 响应格式：
				 * - 成功：{ success: true, result: any }
				 * - 失败：{ success: false, error: { message, code, data? } }
				 *
				 * 错误处理：
				 * - 所有错误都符合 EIP-1193 错误规范
				 * - 错误代码定义在 ProviderErrorCode 枚举中
				 */
				// 转发请求到 background script
				console.log('[Content] Forwarding to background:', method);
				const response = await browser.runtime.sendMessage({
					type: 'EIP1193_REQUEST',
					method,
					params,
				});
				console.log('[Content] Received response from background:', method, response);

				// 检查响应格式：background 返回 { success: true, result: ... } 或 { success: false, error: ... }
				if (response?.success === true) {
					// 成功：发送结果
					window.postMessage(
						{
							source: 'wxt-eip1193-content',
							messageId,
							result: response.result,
						},
						'*'
					);
				} else if (response?.success === false) {
					// 失败：发送错误
					window.postMessage(
						{
							source: 'wxt-eip1193-content',
							messageId,
							error: response.error || {
								message: 'Unknown error',
								code: 4900,
							},
						},
						'*'
					);
				} else {
					// 兼容旧格式：直接返回 response（可能是 result 本身）
					window.postMessage(
						{
							source: 'wxt-eip1193-content',
							messageId,
							result: response,
						},
						'*'
					);
				}
			} catch (error) {
				// 发送错误回页面
				window.postMessage(
					{
						source: 'wxt-eip1193-content',
						messageId,
						error: {
							message: error instanceof Error ? error.message : 'Unknown error',
							code: 4900,
						},
					},
					'*'
				);
			}
		});

		/**
		 * 【网络切换事件监听】
		 *
		 * 当用户在钱包中切换网络时，Background 会发送 CHAIN_CHANGED 消息。
		 * Content Script 需要将这个事件通知给页面的 Provider。
		 *
		 * 事件格式（符合 EIP-1193）：
		 * {
		 *   source: 'wxt-eip1193-content',
		 *   event: 'chainChanged',
		 *   chainId: string  // 十六进制格式，如 '0x1'
		 * }
		 *
		 * 页面 Provider 会监听这个事件并触发 window.ethereum.on('chainChanged', ...)
		 */
		browser.runtime.onMessage.addListener((message) => {
			if (message?.type === 'CHAIN_CHANGED') {
				// 通知页面网络已更改
				window.postMessage(
					{
						source: 'wxt-eip1193-content',
						event: 'chainChanged',
						chainId: message.chainId,
					},
					'*' // 发送到所有来源（页面可能包含多个 iframe）
				);
			}
		});
	},
});
