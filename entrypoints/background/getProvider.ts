/**
 * 获取当前网络的 Provider
 *
 * 【用途】
 * Provider 用于与区块链网络交互：
 * - 查询余额（getBalance）
 * - 获取区块信息（getBlock）
 * - 发送交易（sendTransaction）
 * - 调用合约方法
 *
 * 【Provider 类型】
 * ethers.JsonRpcProvider - 通过 JSON-RPC 与节点通信
 *
 * 【RPC URL】
 * 从 currentNetwork.rpcUrl 获取，支持：
 * - 公共 RPC（如 Infura、Alchemy）
 * - 本地节点（如 http://localhost:8545）
 * - 自定义 RPC
 *
 * @returns Promise<ethers.JsonRpcProvider | null> - Provider 实例，如果网络未设置则返回 null
 */
import { ethers } from 'ethers';
import getWalletState from './getWalletState';

export default async function getProvider(): Promise<ethers.JsonRpcProvider | null> {
	try {
		const state = await getWalletState();
		if (!state || !state?.currentNetwork || !state.currentNetwork.rpcUrl) {
			return null;
		}
		return new ethers.JsonRpcProvider(state.currentNetwork.rpcUrl);
	} catch (error) {
		console.error('[Background] Failed to get provider:', error);
		return null;
	}
}
