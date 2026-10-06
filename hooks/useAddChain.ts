/**
 * 添加网络请求管理 Hook
 */
import { useEffect, useState, useCallback } from 'react';
import { browser } from 'wxt/browser';
import type { AddChainRequest } from '@/entrypoints/background/types';

export default function useAddChain() {
	const [addChainRequest, setAddChainRequest] = useState<AddChainRequest | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const hasRuntime = !!browser?.runtime && typeof browser.runtime.sendMessage === 'function';

	const fetchAddChainRequest = useCallback(async () => {
		if (!hasRuntime) {
			setAddChainRequest(null);
			setError(null);
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const response = await browser.runtime.sendMessage({ type: 'ADD_CHAIN_REQUEST_GET' });
			if (response?.requests && response.requests.length > 0) {
				setAddChainRequest(response.requests[0]);
			} else {
				setAddChainRequest(null);
			}
		} catch (err: any) {
			console.error('获取添加网络请求失败:', err);
			setError(err.message || '获取添加网络请求失败');
		} finally {
			setLoading(false);
		}
	}, [hasRuntime]);

	const handleAddChainApprove = useCallback(async () => {
		if (!addChainRequest) return;
		if (!hasRuntime) {
			return false;
		}
		setLoading(true);
		setError(null);
		try {
			await browser.runtime.sendMessage({
				type: 'ADD_CHAIN_REQUEST_APPROVE',
				requestId: addChainRequest.requestId,
			});
			setAddChainRequest(null);
			return true;
		} catch (err: any) {
			console.error('添加网络确认失败:', err);
			setError(err.message || '添加网络确认失败');
			throw err;
		} finally {
			setLoading(false);
		}
	}, [addChainRequest, hasRuntime]);

	const handleAddChainReject = useCallback(async () => {
		if (!addChainRequest) return;
		if (!hasRuntime) {
			return false;
		}
		setLoading(true);
		setError(null);
		try {
			await browser.runtime.sendMessage({
				type: 'ADD_CHAIN_REQUEST_REJECT',
				requestId: addChainRequest.requestId,
			});
			setAddChainRequest(null);
			return true;
		} catch (err: any) {
			console.error('添加网络拒绝失败:', err);
			setError(err.message || '添加网络拒绝失败');
			throw err;
		} finally {
			setLoading(false);
		}
	}, [addChainRequest, hasRuntime]);

	useEffect(() => {
		if (!hasRuntime) {
			setAddChainRequest(null);
			return;
		}
		fetchAddChainRequest();
		const listener = (message: any) => {
			if (message?.type === 'ADD_CHAIN_REQUEST_CHANGED') {
				fetchAddChainRequest();
			}
		};
		browser.runtime.onMessage.addListener(listener);
		return () => {
			browser.runtime.onMessage.removeListener(listener);
		};
	}, [fetchAddChainRequest, hasRuntime]);

	return {
		addChainRequest,
		loading,
		error,
		fetchAddChainRequest,
		handleAddChainApprove,
		handleAddChainReject,
	};
}
