/**
 * provider.js
 *
 * 【职责】
 * 封装所有与 window.ethereum（本钱包扩展注入的 EIP-1193 Provider）相关的底层逻辑：
 * - 检测 Provider 是否已经被注入到页面
 * - 对 window.ethereum.request 做一层薄封装，统一打印请求/响应日志
 * - 绑定 Provider 的标准事件（accountsChanged / chainChanged / connect / disconnect）
 *
 * 【为什么单独拆分】
 * 这一层只关心「如何与 window.ethereum 通信」，不关心按钮、DOM 等界面细节，
 * 方便单独复用或替换（例如未来接入 WalletConnect 等其他 Provider）。
 *
 * 本文件不使用模块打包工具，直接以 <script> 标签加载，
 * 所有对外能力挂载在全局命名空间 window.WalletDemo.provider 下，避免污染全局变量。
 */
(function () {
	'use strict';

	/**
	 * 判断当前页面是否已经注入了本钱包扩展的 Provider。
	 * `_isWxtProvider` 是 inject-provider.js 注入时打的标记，用于和其他钱包插件区分。
	 */
	function isProviderInjected() {
		return typeof window.ethereum !== 'undefined';
	}

	/**
	 * 封装 window.ethereum.request 调用。
	 *
	 * @param {string} method - EIP-1193 RPC 方法名，如 'eth_requestAccounts'
	 * @param {any[]|object} [params] - RPC 参数，数组或对象（取决于方法）
	 * @param {(kind: 'req'|'res'|'err', text: string) => void} [onLog] - 日志回调，由 UI 层注入
	 * @returns {Promise<any>} RPC 方法的返回值
	 *
	 * 【注意】
	 * 所有错误都会先记录日志，再继续向上抛出，调用方可以按需 catch。
	 */
	async function rpc(method, params, onLog) {
		const log = onLog || function () {};
		log('req', `→ request: ${method} ${JSON.stringify(params || [])}`);
		try {
			const result = await window.ethereum.request({ method, params: params || [] });
			log('res', `← result: ${JSON.stringify(result)}`);
			return result;
		} catch (error) {
			log('err', `✗ error: ${error && error.message} (code: ${error && error.code})`);
			throw error;
		}
	}

	/**
	 * 绑定 Provider 的标准事件监听。
	 *
	 * 【支持的事件】（均符合 EIP-1193 规范）
	 * - accountsChanged: 用户切换/取消授权账户时触发
	 * - chainChanged: 用户切换网络时触发
	 * - connect: Provider 首次连接成功时触发
	 * - disconnect: Provider 断开连接时触发
	 *
	 * @param {object} handlers - 各事件对应的回调函数
	 */
	function bindEvents(handlers) {
		if (!isProviderInjected() || !window.ethereum.on) {
			return;
		}
		if (handlers.onAccountsChanged) {
			window.ethereum.on('accountsChanged', handlers.onAccountsChanged);
		}
		if (handlers.onChainChanged) {
			window.ethereum.on('chainChanged', handlers.onChainChanged);
		}
		if (handlers.onConnect) {
			window.ethereum.on('connect', handlers.onConnect);
		}
		if (handlers.onDisconnect) {
			window.ethereum.on('disconnect', handlers.onDisconnect);
		}
	}

	/**
	 * 轮询等待 Provider 注入完成。
	 *
	 * 【背景】
	 * Content Script 是通过向页面插入 <script> 标签来注入 Provider 的（见 content.ts），
	 * 这是一个异步过程，页面脚本执行时 window.ethereum 不一定已经就绪。
	 * 这里同时监听 `ethereum#initialized` 事件和轮询两种方式，尽快感知注入完成。
	 *
	 * @param {() => void} onReady - 检测到 Provider 后的回调（可能被调用多次，调用方自行去重）
	 * @param {number} [maxRetries] - 最大轮询次数，超过后放弃
	 * @param {number} [intervalMs] - 轮询间隔
	 */
	function waitForProvider(onReady, maxRetries, intervalMs) {
		const retries = maxRetries || 20;
		const interval = intervalMs || 300;

		// 立即检测一次（可能 Provider 已经注入完成）
		onReady();

		// 监听注入脚本触发的 ready 事件，命中后立刻回调
		window.addEventListener('ethereum#initialized', onReady, { once: true });

		// 兜底轮询，兼容部分浏览器不触发上述事件的情况
		let count = 0;
		const timer = setInterval(() => {
			count += 1;
			if (isProviderInjected() || count > retries) {
				clearInterval(timer);
				onReady();
			}
		}, interval);
	}

	// 挂载到全局命名空间，供 app.js 使用
	window.WalletDemo = window.WalletDemo || {};
	window.WalletDemo.provider = {
		isProviderInjected,
		rpc,
		bindEvents,
		waitForProvider,
	};
})();
