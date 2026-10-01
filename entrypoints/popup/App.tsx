import { useEffect, useMemo, useState } from 'react';
import {
	getSavedAppMode,
	saveAppMode,
	openPopupAndCloseSidePanel,
	openSidePanelAndClosePopup,
	type AppMode,
} from '@/utils/mode';
import './App.css';
import MainPage from '@/components/mainPage';

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

			<MainPage />

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
