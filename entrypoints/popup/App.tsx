import { useEffect, useMemo, useState } from 'react';
import {
	getSavedAppMode,
	saveAppMode,
	openPopupAndCloseSidePanel,
	openSidePanelAndClosePopup,
	type AppMode,
} from '@/utils/mode';
import './App.css';

function App() {
	const [mode, setMode] = useState<AppMode>('popup');

	const statusText = useMemo(() => {
		return mode === 'popup' ? '弹窗模式已启用' : '侧边栏模式已启用';
	}, [mode]);

	const switchMode = async (nextMode: AppMode) => {
		setMode(nextMode);
		await saveAppMode(nextMode);
		if (nextMode === 'sidepanel') {
			await openSidePanelAndClosePopup();
			return;
		}
		await openPopupAndCloseSidePanel();
	};

	useEffect(() => {
		void (async () => {
			const savedMode = await getSavedAppMode();
			setMode(savedMode);
		})();
	}, []);

	return (
		<div className="wallet-shell">
			<div className="wallet-header">
				<div className="wallet-badge">Wallet</div>
				<span className="wallet-status">{statusText}</span>
			</div>

			<div className="mode-switcher">
				<button
					className={mode === 'popup' ? 'active' : ''}
					onClick={() => switchMode('popup')}
				>
					弹窗模式
				</button>
				<button
					className={mode === 'sidepanel' ? 'active' : ''}
					onClick={() => switchMode('sidepanel')}
				>
					侧边栏模式
				</button>
			</div>

			<div className="wallet-card">
				<h2>钱包概览</h2>
				<div className="wallet-balance">$24,680.00</div>
				<div className="wallet-row">
					<span>总资产</span>
					<strong>2.84 ETH</strong>
				</div>
				<div className="wallet-row">
					<span>最近操作</span>
					<strong>转账成功</strong>
				</div>
			</div>

			<button
				className="primary-btn"
				onClick={() => switchMode(mode === 'popup' ? 'sidepanel' : 'popup')}
			>
				{mode === 'popup' ? '切换到侧边栏' : '切回弹窗'}
			</button>
		</div>
	);
}

export default App;
