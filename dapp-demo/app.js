/**
 * app.js
 *
 * 【职责】
 * 应用入口：组合 provider.js（与钱包通信）和 ui.js（页面展示），
 * 绑定各个按钮的点击事件，串联出完整的 DApp 连接钱包业务流程。
 *
 * 依赖：provider.js、ui.js 必须在本文件之前加载（见 index.html 中的 <script> 顺序）。
 */
(function () {
	'use strict';

	const { rpc, bindEvents, waitForProvider, isProviderInjected } = window.WalletDemo.provider;
	const { log, setProviderPill, setProviderInfo, renderAccount, renderChain } =
		window.WalletDemo.ui;

	/**
	 * rpc 的局部快捷方式：自动把 ui.log 作为日志回调传入，
	 * 调用方只需要关心 method / params。
	 */
	function request(method, params) {
		return rpc(method, params, log);
	}

	/**
	 * 检测 Provider 注入情况，并在检测到后：
	 * 1. 更新状态面板
	 * 2. 绑定标准事件（accountsChanged / chainChanged / connect / disconnect）
	 * 3. 主动查询一次已授权账户和当前链 ID，恢复 UI 状态
	 *
	 * 这个函数可能会被 waitForProvider 多次调用，这里用 bound 标记确保只初始化一次。
	 */
	let hasBound = false;
	function onProviderDetected() {
		if (!isProviderInjected()) {
			setProviderPill(false, '未检测到');
			setProviderInfo('未检测到 window.ethereum，请确认扩展已加载，且本页面未被 CSP / 插件权限拦截。');
			return;
		}

		setProviderPill(true, '已检测到 window.ethereum');
		setProviderInfo(
			`已找到注入的 Provider（<code>_isWxtProvider = ${!!window.ethereum._isWxtProvider}</code>）。`
		);

		if (hasBound) return;
		hasBound = true;

		bindEvents({
			onAccountsChanged: (accounts) => {
				log('res', `[event] accountsChanged: ${JSON.stringify(accounts)}`);
				renderAccount(accounts);
			},
			onChainChanged: (chainId) => {
				log('res', `[event] chainChanged: ${chainId}`);
				renderChain(chainId);
			},
			onConnect: (info) => {
				log('res', `[event] connect: ${JSON.stringify(info)}`);
			},
			onDisconnect: (err) => {
				log('err', `[event] disconnect: ${JSON.stringify(err)}`);
			},
		});

		// 页面加载时主动查询一次，恢复之前已授权的连接状态（不会弹出用户确认弹窗）
		request('eth_accounts').then(renderAccount).catch(() => {});
		request('eth_chainId').then(renderChain).catch(() => {});
	}

	/**
	 * 「连接钱包」按钮：
	 * 调用 eth_requestAccounts 会触发扩展弹出 Popup 让用户确认授权。
	 */
	function handleConnect() {
		request('eth_requestAccounts')
			.then((accounts) => {
				renderAccount(accounts);
				return request('eth_chainId');
			})
			.then(renderChain)
			.catch(() => {});
	}

	/** 「eth_accounts」按钮：仅查询已授权账户，不会弹出确认框。 */
	function handleGetAccounts() {
		request('eth_accounts').then(renderAccount).catch(() => []);
	}

	/** 「eth_chainId」按钮：查询当前链 ID。 */
	function handleGetChainId() {
		request('eth_chainId').then(renderChain).catch(() => null);
	}

	/**
	 * 「切换网络」按钮：对应 EIP-3085 的 wallet_switchEthereumChain。
	 * 输入框里是十进制 chainId，这里转换成 EIP-1193 要求的十六进制字符串格式。
	 */
	function handleSwitchChain() {
		const decimal = parseInt(document.getElementById('switchChainId').value, 10);
		if (isNaN(decimal)) {
			log('err', '请输入合法的十进制 Chain ID');
			return;
		}
		const hexChainId = '0x' + decimal.toString(16);
		request('wallet_switchEthereumChain', [{ chainId: hexChainId }])
			.then(() => request('eth_chainId'))
			.then(renderChain)
			.catch(() => {});
	}

	/**
	 * 「签名」按钮：对应 personal_sign，需要先确保已连接账户。
	 */
	function handlePersonalSign() {
		request('eth_accounts')
			.catch(() => [])
			.then((accounts) => {
				if (!accounts || accounts.length === 0) {
					log('err', '请先点击「eth_requestAccounts」连接钱包');
					return;
				}
				const message = document.getElementById('signMessage').value;
				// personal_sign 的参数顺序是 [消息, 签名地址]
				return request('personal_sign', [message, accounts[0]]).catch(() => {});
			});
	}

	/**
	 * 「发送交易」按钮：对应 eth_sendTransaction。
	 * 页面上填写的是 ETH 金额（如 0.001），这里换算成 wei 对应的十六进制字符串。
	 */
	function handleSendTransaction() {
		request('eth_accounts')
			.catch(() => [])
			.then((accounts) => {
				if (!accounts || accounts.length === 0) {
					log('err', '请先点击「eth_requestAccounts」连接钱包');
					return;
				}
				const to = document.getElementById('txTo').value.trim();
				const valueEth = parseFloat(document.getElementById('txValue').value || '0');
				if (!to) {
					log('err', '请输入收款地址');
					return;
				}
				// 1 ETH = 10^18 wei，使用 BigInt 避免浮点精度问题
				const valueWei = BigInt(Math.round(valueEth * 1e18));
				const valueHex = '0x' + valueWei.toString(16);
				return request('eth_sendTransaction', [
					{ from: accounts[0], to, value: valueHex },
				]).catch(() => {});
			});
	}

	/**
	 * 「添加代币」按钮：对应 EIP-747 的 wallet_watchAsset。
	 * 注意这里的 params 是对象而不是数组，和其他方法不同。
	 */
	function handleWatchAsset() {
		const address = document.getElementById('tokenAddress').value.trim();
		const symbol = document.getElementById('tokenSymbol').value.trim() || 'TOKEN';
		if (!address) {
			log('err', '请输入代币合约地址');
			return;
		}
		request('wallet_watchAsset', {
			type: 'ERC20',
			options: { address, symbol, decimals: 18 },
		}).catch(() => {});
	}

	/** 统一绑定所有按钮事件。 */
	function bindButtons() {
		document.getElementById('btnConnect').addEventListener('click', handleConnect);
		document.getElementById('btnAccounts').addEventListener('click', handleGetAccounts);
		document.getElementById('btnChainId').addEventListener('click', handleGetChainId);
		document.getElementById('btnSwitchChain').addEventListener('click', handleSwitchChain);
		document.getElementById('btnPersonalSign').addEventListener('click', handlePersonalSign);
		document.getElementById('btnSendTx').addEventListener('click', handleSendTransaction);
		document.getElementById('btnWatchAsset').addEventListener('click', handleWatchAsset);
	}

	// 入口：绑定按钮 + 开始检测 Provider
	bindButtons();
	waitForProvider(onProviderDetected);
})();
