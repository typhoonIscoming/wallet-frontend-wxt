/**
 * ui.js
 *
 * 【职责】
 * 封装所有 DOM 读写逻辑：日志面板输出、Provider 状态展示、账户/链 ID 展示。
 * app.js 只需要调用这里导出的函数，不需要关心具体的 DOM 结构和 CSS class。
 *
 * 同样挂载在全局命名空间 window.WalletDemo.ui 下。
 */
(function () {
	'use strict';

	const logEl = document.getElementById('log');

	/**
	 * 向页面底部的日志面板追加一条记录。
	 * @param {'req'|'res'|'err'} kind - 日志类型，用于区分颜色（请求/响应/错误）
	 * @param {string} text - 日志内容
	 */
	function log(kind, text) {
		const line = document.createElement('div');
		line.className = 'log-line ' + kind;
		const time = new Date().toLocaleTimeString();
		line.textContent = `[${time}] ${text}`;
		logEl.appendChild(line);
		// 自动滚动到最新一条日志
		logEl.scrollTop = logEl.scrollHeight;
	}

	/**
	 * 更新「Provider 状态」区域的小圆点/文案。
	 * @param {boolean} ok - 是否检测到 Provider
	 * @param {string} text - 展示的文案
	 */
	function setProviderPill(ok, text) {
		const pill = document.getElementById('providerPill');
		pill.textContent = text;
		pill.className = 'pill ' + (ok ? 'ok' : 'err');
	}

	/** 更新「Provider 状态」区域的详细说明文案。 */
	function setProviderInfo(html) {
		document.getElementById('providerInfo').innerHTML = html;
	}

	/**
	 * 渲染当前账户。取 accounts 数组的第一个地址作为「当前账户」，
	 * 这与大多数钱包的约定一致（MetaMask 等也是如此）。
	 * @param {string[]} accounts
	 */
	function renderAccount(accounts) {
		document.getElementById('accountDisplay').textContent =
			Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : '未连接';
	}

	/**
	 * 渲染当前链 ID，同时把十六进制 chainId 转换成十进制方便阅读。
	 * @param {string} chainId - 十六进制字符串，如 '0x1'
	 */
	function renderChain(chainId) {
		if (!chainId) return;
		const dec = parseInt(chainId, 16);
		document.getElementById('chainDisplay').textContent = `${chainId} (${isNaN(dec) ? '?' : dec})`;
	}

	// 挂载到全局命名空间，供 app.js 使用
	window.WalletDemo = window.WalletDemo || {};
	window.WalletDemo.ui = {
		log,
		setProviderPill,
		setProviderInfo,
		renderAccount,
		renderChain,
	};
})();
