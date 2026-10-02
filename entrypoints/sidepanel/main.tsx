import React from 'react';
import ReactDOM from 'react-dom/client';
import { openPopupAndCloseSidePanel, saveAppMode } from '@/utils/mode';
import './style.css';
import Root from '@/components/root';

function SidePanelApp() {
	const switchToPopup = async () => {
		await saveAppMode('popup');
		await openPopupAndCloseSidePanel();
	};

	return (
		<div className="sidepanel-shell">
			<Root />

			<button className="primary-btn bg-blue-500" onClick={switchToPopup}>
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
