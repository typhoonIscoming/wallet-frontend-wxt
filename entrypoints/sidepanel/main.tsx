import React from 'react';
import ReactDOM from 'react-dom/client';
import { openPopupAndCloseSidePanel, saveAppMode } from '@/utils/mode';
import './style.css';
import Root from '@/components/root';
import RootContext, { initRootContext } from '@/components/rootContext';

function SidePanelApp() {
	const switchToPopup = async () => {
		await saveAppMode('popup');
		await openPopupAndCloseSidePanel();
	};

	return (
		<div className="sidepanel-shell p-4">
			<RootContext.Provider value={initRootContext}>
				<Root />
			</RootContext.Provider>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<SidePanelApp />
	</React.StrictMode>
);
