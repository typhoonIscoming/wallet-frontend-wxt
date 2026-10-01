import React from 'react';
import ReactDOM from 'react-dom/client';
import { openPopupAndCloseSidePanel, saveAppMode } from '@/utils/mode';
import './style.css';
import MainPage from '@/components/mainPage';

function SidePanelApp() {
	const switchToPopup = async () => {
		await saveAppMode('popup');
		await openPopupAndCloseSidePanel();
	};

	return (
		<div className="sidepanel-shell">
			<div className="sidepanel-header">
				<div className="wallet-badge">Wallet</div>
				<span>侧边栏模式</span>
			</div>

			<div className="sidepanel-card">
				<h2>钱包侧边栏</h2>
				<p>这是侧边栏初始化页面，后续可以继续扩展资产列表、交易记录和授权管理。</p>
			</div>
			<MainPage />

			<div className="sidepanel-list">
				<div className="list-item">
					<span>账户</span>
					<strong>0xA1...F9</strong>
				</div>
				<div className="list-item">
					<span>网络</span>
					<strong>Ethereum</strong>
				</div>
				<div className="list-item">
					<span>状态</span>
					<strong>已连接</strong>
				</div>
			</div>

			<button className="primary-btn" onClick={switchToPopup}>
				切换到弹窗模式
			</button>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<SidePanelApp />
	</React.StrictMode>
);
