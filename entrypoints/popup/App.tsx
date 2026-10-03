import { useEffect, useMemo, useState } from 'react';
import {
	getSavedAppMode,
	saveAppMode,
	openPopupAndCloseSidePanel,
	openSidePanelAndClosePopup,
	type AppMode,
} from '@/utils/mode';
import './App.css';
import Root from '@/components/root';
import RootContext from '@/components/rootContext';

function App() {
	const [mode, setMode] = useState<AppMode>('popup');

	useEffect(() => {
		void (async () => {
			const savedMode = await getSavedAppMode();
			setMode(savedMode);
		})();
	}, []);

	return (
		<RootContext.Provider value={{ mode }}>
			<div className="wallet-shell p-4">
				<Root />
			</div>
		</RootContext.Provider>
	);
}

export default App;
