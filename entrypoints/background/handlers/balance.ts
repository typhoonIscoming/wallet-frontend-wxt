import { ProviderErrorCode } from '@/types/eip1193';
import type { ProviderRpcError } from '@/types/eip1193';
import { ethers } from 'ethers';
import type { RequestContext } from '../types';

/**
 * 处理 eth_getBalance
 */
export async function handleEthGetBalance(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<string> {
	// 获取账户余额
	const paramsArray = Array.isArray(params) ? params : [];
	const address = paramsArray[0] as string;
	const blockTag = (paramsArray[1] as string) || 'latest';

	if (!address) {
		throw {
			name: 'ProviderError',
			message: 'Missing address parameter',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	// 验证地址格式
	if (!ethers.isAddress(address)) {
		throw {
			name: 'ProviderError',
			message: 'Invalid address format',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	try {
		const provider = await context.getProvider();
		if (!provider) {
			throw {
				name: 'ProviderError',
				message: 'Provider not available',
				code: ProviderErrorCode.DISCONNECTED,
			} as ProviderRpcError;
		}

		// 获取余额，添加超时处理
		const balancePromise = provider.getBalance(address, blockTag);
		const timeoutPromise = new Promise<bigint>((_, reject) =>
			setTimeout(() => reject(new Error('Balance query timeout')), 30000)
		);

		const balance = await Promise.race([balancePromise, timeoutPromise]);

		// 确保返回的是 BigInt，然后转换为十六进制字符串
		const balanceBigInt = typeof balance === 'bigint' ? balance : BigInt(balance);
		const hexBalance = '0x' + balanceBigInt.toString(16);

		console.log(`[Background] eth_getBalance: address=${address}, balance=${hexBalance}`);
		return hexBalance;
	} catch (error: any) {
		console.error('[Background] eth_getBalance error:', error);

		// 如果已经是 ProviderRpcError，直接抛出
		if (error.code) {
			throw error;
		}

		// 否则包装为 ProviderRpcError
		throw {
			name: 'ProviderError',
			message: error.message || 'Failed to get balance',
			code: ProviderErrorCode.DISCONNECTED,
		} as ProviderRpcError;
	}
}

/**
 * 处理 eth_blockNumber
 */
export async function handleEthBlockNumber(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<string> {
	// 获取当前区块号
	const provider = await context.getProvider();
	if (!provider) {
		return '0x0';
	}
	const blockNumber = await provider.getBlockNumber();
	return '0x' + blockNumber.toString(16);
}

/**
 * 处理 eth_getBlockByNumber
 */
export async function handleEthGetBlockByNumber(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<any> {
	// 根据区块号获取区块
	const paramsArray = Array.isArray(params) ? params : [];
	const blockTag = paramsArray[0] as string;
	const includeTransactions = (paramsArray[1] as boolean) || false;

	if (!blockTag) {
		throw {
			name: 'ProviderError',
			message: 'Missing block number parameter',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	const provider = await context.getProvider();
	if (!provider) {
		throw {
			name: 'ProviderError',
			message: 'Provider not available',
			code: ProviderErrorCode.DISCONNECTED,
		} as ProviderRpcError;
	}

	const block = await provider.getBlock(blockTag, includeTransactions);
	if (!block) {
		return null;
	}

	return {
		number: '0x' + block.number.toString(16),
		hash: block.hash,
		parentHash: block.parentHash,
		timestamp: '0x' + block.timestamp.toString(16),
		gasLimit: '0x' + block.gasLimit.toString(16),
		gasUsed: '0x' + block.gasUsed.toString(16),
		transactions: includeTransactions
			? block.transactions
			: block.transactions.map((tx: any) => (typeof tx === 'string' ? tx : tx.hash)),
	};
}

/**
 * 处理 eth_getBlockByHash
 */
export async function handleEthGetBlockByHash(
	params: readonly unknown[] | object,
	context: RequestContext
): Promise<any> {
	// 根据区块哈希获取区块
	const paramsArray = Array.isArray(params) ? params : [];
	const blockHash = paramsArray[0] as string;
	const includeTransactions = (paramsArray[1] as boolean) || false;

	if (!blockHash) {
		throw {
			name: 'ProviderError',
			message: 'Missing block hash parameter',
			code: ProviderErrorCode.UNSUPPORTED_METHOD,
		} as ProviderRpcError;
	}

	const provider = await context.getProvider();
	if (!provider) {
		throw {
			name: 'ProviderError',
			message: 'Provider not available',
			code: ProviderErrorCode.DISCONNECTED,
		} as ProviderRpcError;
	}

	const block = await provider.getBlock(blockHash, includeTransactions);
	if (!block) {
		return null;
	}

	return {
		number: '0x' + block.number.toString(16),
		hash: block.hash,
		parentHash: block.parentHash,
		timestamp: '0x' + block.timestamp.toString(16),
		gasLimit: '0x' + block.gasLimit.toString(16),
		gasUsed: '0x' + block.gasUsed.toString(16),
		transactions: includeTransactions
			? block.transactions
			: block.transactions.map((tx: any) => (typeof tx === 'string' ? tx : tx.hash)),
	};
}
