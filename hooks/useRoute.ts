import { useEffect, useState, useCallback, useRef } from 'react';
import { browser } from 'wxt/browser';

import type { PopupRoute } from '@/entrypoints/background/types';

export default function useRoute() {
	const [route, setRoute] = useState<PopupRoute>('switch-chain');
	const isAutoRoutingRef = useRef(false);
	const hasRuntime =
		!!browser?.runtime && !!browser.runtime.sendMessage && !!browser.runtime.onMessage;

	// 从 background 获取路由
	useEffect(() => {
		const getRouteFromBackground = async () => {
			if (!hasRuntime) {
				return;
			}

			try {
				// 延迟获取路由，确保 background 已经设置好路由
				await new Promise((resolve) => setTimeout(resolve, 50));
				const response = await browser.runtime.sendMessage({ type: 'POPUP_GET_ROUTE' });
				if (response?.route) {
					const route = response.route as PopupRoute;
					console.log('[Popup] Got route from background:', route);
					setRoute(route);
				}
			} catch (error) {
				console.error('获取路由失败:', error);
			}
		};
		getRouteFromBackground();
	}, [hasRuntime]);

	// 监听 background 的路由变化
	useEffect(() => {
		if (!hasRuntime) {
			return;
		}
		const listener = async (message: any) => {
			if (message?.type === 'POPUP_ROUTE_CHANGED' && message.route) {
				const route = message.route as PopupRoute;
				console.log('[Popup] Route changed from background:', route);
				setRoute(route);
			}
		};
		browser.runtime.onMessage.addListener(listener);
		return () => {
			browser.runtime.onMessage.removeListener(listener);
		};
	}, [hasRuntime]);

	// 更新路由到 background
	const updateRoute = useCallback(
		async (newRoute: PopupRoute) => {
			setRoute(newRoute);
			if (!hasRuntime) {
				return;
			}
			try {
				await browser.runtime.sendMessage({
					type: 'POPUP_SET_ROUTE',
					route: newRoute,
				});
			} catch (error) {
				console.error('更新路由失败:', error);
			}
		},
		[hasRuntime]
	);

	return {
		route,
		isAutoRoutingRef,
		setRoute,
		updateRoute,
	};
}
