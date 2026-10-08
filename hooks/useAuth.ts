/**
 * 授权请求管理 Hook
 */
import { useCallback, useState } from 'react';
import { browser } from 'wxt/browser';
import type { AuthRequest } from '@/entrypoints/background/types';

export default function useAuth() {
	const [authRequest, setAuthRequest] = useState<AuthRequest | null>(null);
	const hasRuntime = !!browser?.runtime && typeof browser.runtime.sendMessage === 'function';

	// 获取授权请求
	const fetchAuthRequest = useCallback(async () => {
		if (!hasRuntime) {
			setAuthRequest(null);
			return;
		}
		try {
			const response = await browser.runtime.sendMessage({ type: 'AUTH_REQUEST_GET' });
			if (response?.requests && response.requests.length > 0) {
				setAuthRequest(response.requests[0]);
			}
		} catch (error) {
			console.error('获取授权请求失败:', error);
		}
	}, [hasRuntime]);

	// 处理授权确认
	const handleAuthApprove = useCallback(
		async (currentAccount: { address: string } | null) => {
			if (!authRequest || !currentAccount) return;
			if (!hasRuntime) {
				return false;
			}

			try {
				await browser.runtime.sendMessage({
					type: 'AUTH_REQUEST_APPROVE',
					requestId: authRequest.requestId,
					accounts: [currentAccount.address],
				});
				setAuthRequest(null);
				return true;
			} catch (error) {
				console.error('授权确认失败:', error);
				throw error;
			}
		},
		[authRequest, hasRuntime]
	);

	// 处理授权拒绝
	const handleAuthReject = useCallback(async () => {
		if (!authRequest) return;
		if (!hasRuntime) {
			return false;
		}

		try {
			await browser.runtime.sendMessage({
				type: 'AUTH_REQUEST_REJECT',
				requestId: authRequest.requestId,
			});
			setAuthRequest(null);
			return true;
		} catch (error) {
			console.error('授权拒绝失败:', error);
			throw error;
		}
	}, [authRequest, hasRuntime]);

	return {
		authRequest,
		setAuthRequest,
		fetchAuthRequest,
		handleAuthApprove,
		handleAuthReject,
	};
}
