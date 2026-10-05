/**
 * 添加代币请求管理 Hook
 */
import { useEffect, useState, useCallback } from 'react';
import { browser } from 'wxt/browser';
import type { WatchAssetRequest } from '@/entrypoints/background/types';

export default function useWatchAsset() {
	const [watchAssetRequest, setWatchAssetRequest] = useState<WatchAssetRequest | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const hasRuntime = !!browser?.runtime && typeof browser.runtime.sendMessage === 'function';

	const fetchWatchAssetRequest = useCallback(async () => {
		if (!hasRuntime) {
			setWatchAssetRequest(null);
			setError(null);
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const response = await browser.runtime.sendMessage({ type: 'WATCH_ASSET_REQUEST_GET' });
			if (response?.requests && response.requests.length > 0) {
				setWatchAssetRequest(response.requests[0]);
			} else {
				setWatchAssetRequest(null);
			}
		} catch (err: any) {
			console.error('获取添加代币请求失败:', err);
			setError(err.message || '获取添加代币请求失败');
		} finally {
			setLoading(false);
		}
	}, [hasRuntime]);

	const handleWatchAssetApprove = useCallback(async () => {
		if (!watchAssetRequest) return;
		if (!hasRuntime) {
			return false;
		}
		setLoading(true);
		setError(null);
		try {
			await browser.runtime.sendMessage({
				type: 'WATCH_ASSET_REQUEST_APPROVE',
				requestId: watchAssetRequest.requestId,
			});
			setWatchAssetRequest(null);
			return true;
		} catch (err: any) {
			console.error('添加代币确认失败:', err);
			setError(err.message || '添加代币确认失败');
			throw err;
		} finally {
			setLoading(false);
		}
	}, [watchAssetRequest, hasRuntime]);

	const handleWatchAssetReject = useCallback(async () => {
		if (!watchAssetRequest) return;
		if (!hasRuntime) {
			return false;
		}
		setLoading(true);
		setError(null);
		try {
			await browser.runtime.sendMessage({
				type: 'WATCH_ASSET_REQUEST_REJECT',
				requestId: watchAssetRequest.requestId,
			});
			setWatchAssetRequest(null);
			return true;
		} catch (err: any) {
			console.error('添加代币拒绝失败:', err);
			setError(err.message || '添加代币拒绝失败');
			throw err;
		} finally {
			setLoading(false);
		}
	}, [watchAssetRequest, hasRuntime]);

	useEffect(() => {
		if (!hasRuntime) {
			setWatchAssetRequest(null);
			return;
		}
		fetchWatchAssetRequest();
		const listener = (message: any) => {
			if (message?.type === 'WATCH_ASSET_REQUEST_CHANGED') {
				fetchWatchAssetRequest();
			}
		};
		browser.runtime.onMessage.addListener(listener);
		return () => {
			browser.runtime.onMessage.removeListener(listener);
		};
	}, [fetchWatchAssetRequest, hasRuntime]);

	return {
		watchAssetRequest,
		loading,
		error,
		fetchWatchAssetRequest,
		handleWatchAssetApprove,
		handleWatchAssetReject,
	};
}
