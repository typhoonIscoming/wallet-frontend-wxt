import { browser } from 'wxt/browser';
import type { PendingWatchAssetRequest } from '../types';
import { ProviderErrorCode } from '@/types/eip1193';
import type { ProviderRpcError } from '@/types/eip1193';

/**
 * 获取待处理的添加代币请求
 */
export async function handleWatchAssetRequestGet(): Promise<{
	requests: PendingWatchAssetRequest[];
}> {
	// 这个函数应该从 background.ts 中调用，获取 pendingWatchAssetRequests
	// 由于我们需要访问 background.ts 中的状态，这个函数会在 background.ts 中实现
	return { requests: [] };
}

/**
 * 批准添加代币请求
 */
export async function handleWatchAssetRequestApprove(
	requestId: string,
	pendingWatchAssetRequests: Map<string, PendingWatchAssetRequest>
): Promise<void> {
	const request = pendingWatchAssetRequests.get(requestId);
	if (!request) {
		throw new Error('Request not found');
	}

	pendingWatchAssetRequests.delete(requestId);
	request.resolve(true);
}

/**
 * 拒绝添加代币请求
 */
export async function handleWatchAssetRequestReject(
	requestId: string,
	pendingWatchAssetRequests: Map<string, PendingWatchAssetRequest>
): Promise<void> {
	const request = pendingWatchAssetRequests.get(requestId);
	if (!request) {
		throw new Error('Request not found');
	}

	pendingWatchAssetRequests.delete(requestId);
	const error: ProviderRpcError = {
		name: 'ProviderError',
		message: 'User rejected the request',
		code: ProviderErrorCode.USER_REJECTED_REQUEST,
	};
	request.reject(error);
}
