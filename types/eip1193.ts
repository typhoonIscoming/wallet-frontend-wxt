/**
 * EIP-1193: Ethereum Provider JavaScript API
 * https://eips.ethereum.org/EIPS/eip-1193
 */

/**
 * 请求参数接口
 */
export interface RequestArguments {
	readonly method: string;
	readonly params?: readonly unknown[] | object;
}

/**
 * RPC 错误接口
 */
export interface ProviderRpcError extends Error {
	code: number;
	data?: unknown;
}

/**
 * 提供者消息接口
 */
export interface ProviderMessage {
	readonly type: string;
	readonly data: unknown;
}

/**
 * 连接信息接口
 */
export interface ProviderConnectInfo {
	readonly chainId: string;
}

/**
 * 事件监听器类型
 */
export type Listener = (...args: unknown[]) => void;

/**
 * EIP-1193 提供者接口
 */
export interface EIP1193Provider {
	/**
	 * 发送请求到提供者
	 * @param args 请求参数
	 * @returns Promise，解析为请求结果
	 */
	request<T = unknown>(args: RequestArguments): Promise<T>;

	/**
	 * 监听事件
	 * @param event 事件名称
	 * @param listener 事件监听器
	 */
	on(event: 'connect', listener: (connectInfo: ProviderConnectInfo) => void): void;
	on(event: 'disconnect', listener: (error: ProviderRpcError) => void): void;
	on(event: 'chainChanged', listener: (chainId: string) => void): void;
	on(event: 'accountsChanged', listener: (accounts: string[]) => void): void;
	on(event: string, listener: Listener): void;

	/**
	 * 移除事件监听器
	 * @param event 事件名称
	 * @param listener 事件监听器
	 */
	removeListener(event: 'connect', listener: (connectInfo: ProviderConnectInfo) => void): void;
	removeListener(event: 'disconnect', listener: (error: ProviderRpcError) => void): void;
	removeListener(event: 'chainChanged', listener: (chainId: string) => void): void;
	removeListener(event: 'accountsChanged', listener: (accounts: string[]) => void): void;
	removeListener(event: string, listener: Listener): void;

	/**
	 * 移除所有事件监听器
	 * @param event 事件名称（可选）
	 */
	removeAllListeners?(event?: string): void;
}

/**
 * 扩展的 Window 接口，包含 ethereum 提供者
 */
declare global {
	interface Window {
		ethereum?: EIP1193Provider;
	}
}

/**
 * 常用的 RPC 方法枚举
 */
export enum EthereumRpcMethod {
	// 账户相关
	ETH_REQUEST_ACCOUNTS = 'eth_requestAccounts',
	ETH_ACCOUNTS = 'eth_accounts',
	ETH_COINBASE = 'eth_coinbase',

	// 链相关
	ETH_CHAIN_ID = 'eth_chainId',
	NET_VERSION = 'net_version',

	// 余额相关
	ETH_GET_BALANCE = 'eth_getBalance',

	// 交易相关
	ETH_SEND_TRANSACTION = 'eth_sendTransaction',
	ETH_SIGN_TRANSACTION = 'eth_signTransaction',
	ETH_SEND_RAW_TRANSACTION = 'eth_sendRawTransaction',

	// 签名相关
	ETH_SIGN = 'eth_sign',
	PERSONAL_SIGN = 'personal_sign',
	ETH_SIGN_TYPED_DATA = 'eth_signTypedData',
	ETH_SIGN_TYPED_DATA_V3 = 'eth_signTypedData_v3',
	ETH_SIGN_TYPED_DATA_V4 = 'eth_signTypedData_v4',

	// 区块相关
	ETH_BLOCK_NUMBER = 'eth_blockNumber',
	ETH_GET_BLOCK_BY_NUMBER = 'eth_getBlockByNumber',
	ETH_GET_BLOCK_BY_HASH = 'eth_getBlockByHash',

	// 交易收据相关
	ETH_GET_TRANSACTION_RECEIPT = 'eth_getTransactionReceipt',
	ETH_GET_TRANSACTION = 'eth_getTransaction',

	// Gas 相关
	ETH_GAS_PRICE = 'eth_gasPrice',
	ETH_ESTIMATE_GAS = 'eth_estimateGas',

	// 网络相关
	ETH_GET_CODE = 'eth_getCode',
	ETH_CALL = 'eth_call',

	// 钱包网络管理 (EIP-3085)
	WALLET_SWITCH_ETHEREUM_CHAIN = 'wallet_switchEthereumChain',
	WALLET_ADD_ETHEREUM_CHAIN = 'wallet_addEthereumChain',

	// 钱包资产管理 (EIP-747)
	WALLET_WATCH_ASSET = 'wallet_watchAsset',
}

/**
 * 错误代码枚举
 */
export enum ProviderErrorCode {
	USER_REJECTED_REQUEST = 4001,
	UNAUTHORIZED = 4100,
	UNSUPPORTED_METHOD = 4200,
	DISCONNECTED = 4900,
	CHAIN_DISCONNECTED = 4901,
}
