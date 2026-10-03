import React from 'react';
import ReactDOM from 'react-dom/client';
import { openPopupAndCloseSidePanel, saveAppMode } from '@/utils/mode';
import './style.css';
import Root from '@/components/root';
import RootContext from '@/components/rootContext';

function SidePanelApp() {
	return (
		<div className="sidepanel-shell p-4">
			<RootContext.Provider value={{ mode: 'sidepanel' }}>
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
