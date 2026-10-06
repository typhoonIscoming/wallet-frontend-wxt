import { browser } from 'wxt/browser';
import type { PendingAddChainRequest } from '../types';
import { ProviderErrorCode, type ProviderRpcError } from '@/types/eip1193';

/**
 * 获取待处理的添加网络请求
 */
export async function handleAddChainRequestGet(): Promise<{ requests: PendingAddChainRequest[] }> {
	// 这个函数应该从 background.ts 中调用，获取 pendingAddChainRequests
	// 由于我们需要访问 background.ts 中的状态，这个函数会在 background.ts 中实现
	return { requests: [] };
}

/**
 * 批准添加网络请求
 */
export async function handleAddChainRequestApprove(
	requestId: string,
	pendingAddChainRequests: Map<string, PendingAddChainRequest>
): Promise<void> {
	const request = pendingAddChainRequests.get(requestId);
	if (!request) {
		throw new Error('Request not found');
	}

	pendingAddChainRequests.delete(requestId);
	request.resolve(null);
}

/**
 * 拒绝添加网络请求
 */
export async function handleAddChainRequestReject(
	requestId: string,
	pendingAddChainRequests: Map<string, PendingAddChainRequest>
): Promise<void> {
	const request = pendingAddChainRequests.get(requestId);
	if (!request) {
		throw new Error('Request not found');
	}

	pendingAddChainRequests.delete(requestId);
	const error: ProviderRpcError = {
		name: 'ProviderError',
		message: 'User rejected the request',
		code: ProviderErrorCode.USER_REJECTED_REQUEST,
	};
	request.reject(error);
}
