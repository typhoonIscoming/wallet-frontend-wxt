/**
 * EIP-1193 RPC 请求路由器
 *
 * 【职责】
 * 根据 RPC 方法名，将请求路由到对应的处理器。
 *
 * 【设计模式】
 * 使用策略模式（Strategy Pattern）：
 * - 每个 RPC 方法有独立的处理器函数
 * - 路由器只负责分发，不包含业务逻辑
 * - 便于维护和扩展新的 RPC 方法
 *
 * 【支持的 RPC 方法】
 *
 * 账户相关：
 * - eth_requestAccounts: 请求账户授权
 * - eth_accounts: 获取已授权账户
 * - eth_coinbase: 获取当前账户
 *
 * 网络相关：
 * - eth_chainId: 获取当前链 ID
 * - net_version: 获取网络版本
 * - wallet_switchEthereumChain: 切换网络（EIP-3085）
 * - wallet_addEthereumChain: 添加网络（EIP-3085）
 *
 * 余额和区块：
 * - eth_getBalance: 获取账户余额
 * - eth_blockNumber: 获取最新区块号
 * - eth_getBlockByNumber: 根据区块号获取区块
 * - eth_getBlockByHash: 根据区块哈希获取区块
 *
 * 签名：
 * - eth_sign: 签名消息（已弃用，但部分 DApp 仍使用）
 * - personal_sign: 签名消息（推荐）
 * - eth_signTypedData: EIP-712 结构化数据签名
 * - eth_signTypedData_v3: EIP-712 v3
 * - eth_signTypedData_v4: EIP-712 v4
 *
 * 交易：
 * - eth_sendTransaction: 发送交易
 * - eth_signTransaction: 签名交易（不发送）
 * - eth_sendRawTransaction: 发送已签名的交易
 *
 * 资产管理：
 * - wallet_watchAsset: 添加代币到钱包（EIP-747）
 *
 * 【错误处理】
 * 所有未支持的方法都会返回 UNSUPPORTED_METHOD 错误（4200）。
 */

import { EthereumRpcMethod } from '@/types/eip1193';
import {
	handleEthRequestAccounts,
	handleEthAccounts,
	handleEthCoinbase,
} from './handlers/accounts';
import {
	handleEthChainId,
	handleNetVersion,
	handleWalletSwitchEthereumChain,
	handleWalletAddEthereumChain,
} from './handlers/network';
import {
	handleEthGetBalance,
	handleEthBlockNumber,
	handleEthGetBlockByNumber,
	handleEthGetBlockByHash,
} from './handlers/balance';
import {
	handleEthSendTransaction,
	handleEthSignTransaction,
	handleEthSendRawTransaction,
} from './handlers/transaction';
import { handleEthSign, handlePersonalSign, handleEthSignTypedData } from './handlers/sign';
import { handleWalletWatchAsset } from './handlers/token';
/**
 * 处理 EIP-1193 RPC 请求
 *
 * 【参数说明】
 * @param method - RPC 方法名（如 'eth_requestAccounts'）
 * @param params - RPC 参数（数组或对象，取决于方法）
 * @param context - 请求上下文（包含钱包状态、Provider 等）
 * @returns Promise<any> - RPC 方法的返回值
 *
 * 【处理流程】
 * 1. 根据 method 匹配对应的处理器
 * 2. 调用处理器函数，传入 params 和 context
 * 3. 处理器可能：
 *    - 直接返回结果（如 eth_chainId）
 *    - 需要用户确认（如 eth_requestAccounts，会打开 Popup）
 *    - 抛出错误（如方法不支持）
 *
 * 【注意事项】
 * - 某些方法支持字符串匹配作为后备（如 'eth_sendTransaction'）
 *   原因：部分 DApp 可能使用小写字符串而非枚举值
 * - 所有错误都符合 EIP-1193 ProviderRpcError 格式
 */

export default async function handleEIP1193Request(
	method: EthereumRpcMethod,
	params: any,
	context: any
): Promise<any> {
	// 在这里根据 method 路由到对应的处理器
	switch (method) {
		case EthereumRpcMethod.ETH_REQUEST_ACCOUNTS:
			return handleEthRequestAccounts(params, context);
		case EthereumRpcMethod.ETH_ACCOUNTS:
			return handleEthAccounts(params, context);
		case EthereumRpcMethod.ETH_COINBASE:
			return handleEthCoinbase(params, context);
		case EthereumRpcMethod.ETH_CHAIN_ID:
			return handleEthChainId(params, context);
		case EthereumRpcMethod.NET_VERSION:
			return handleNetVersion(params, context);
		case EthereumRpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN:
			return handleWalletSwitchEthereumChain(params, context);
		case EthereumRpcMethod.WALLET_ADD_ETHEREUM_CHAIN:
			return handleWalletAddEthereumChain(params, context);
		case EthereumRpcMethod.ETH_GET_BALANCE:
			return handleEthGetBalance(params, context);
		case EthereumRpcMethod.ETH_BLOCK_NUMBER:
			return handleEthBlockNumber(params, context);
		case EthereumRpcMethod.ETH_GET_BLOCK_BY_NUMBER:
			return handleEthGetBlockByNumber(params, context);
		case EthereumRpcMethod.ETH_GET_BLOCK_BY_HASH:
			return handleEthGetBlockByHash(params, context);
		case EthereumRpcMethod.ETH_SIGN:
			return handleEthSign(params, context);
		case EthereumRpcMethod.PERSONAL_SIGN:
			return handlePersonalSign(params, context);
		case EthereumRpcMethod.ETH_SIGN_TYPED_DATA:
		case EthereumRpcMethod.ETH_SIGN_TYPED_DATA_V3:
		case EthereumRpcMethod.ETH_SIGN_TYPED_DATA_V4:
			return handleEthSignTypedData(method, params, context);
		case EthereumRpcMethod.ETH_SEND_TRANSACTION:
			return handleEthSendTransaction(params, context);
		case EthereumRpcMethod.ETH_SIGN_TRANSACTION:
			return handleEthSignTransaction(params, context);
		case EthereumRpcMethod.ETH_SEND_RAW_TRANSACTION:
			return handleEthSendRawTransaction(params, context);
		case EthereumRpcMethod.WALLET_WATCH_ASSET:
			return handleWalletWatchAsset(params, context);
		default:
			throw {
				message: `Unsupported method: ${method}`,
				code: 4200,
			};
	}
}
