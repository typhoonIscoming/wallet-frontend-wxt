import { useEffect } from 'react';
import useRoute from '@/hooks/useRoute';
import MainPage from './mainPage';
import AuthPage from './authPage';
import CreateWallet from './createWallet';
import ImportWalletPage from './importWalletPage';
import UnlockPage from './unlock';
import SendPage from './sendPage';
import NetworksPage from './network';
import SwitchChainPage from './switchNetwork';

export default function Root() {
	const { route, updateRoute, isAutoRoutingRef } = useRoute();
	console.log('route', route);
	switch (route) {
		case 'auth':
			return <AuthPage onNavigate={updateRoute} />;
		case 'create':
			return <CreateWallet onNavigate={updateRoute} />;
		case 'import':
			return <ImportWalletPage onNavigate={updateRoute} />;
		case 'unlock':
			return <UnlockPage onNavigate={updateRoute} />;
		case 'send':
			return <SendPage onNavigate={updateRoute} />;
		case 'networks':
			return <NetworksPage onNavigate={updateRoute} />;
		case 'switch-chain':
			return <SwitchChainPage onNavigate={updateRoute} />;
		case 'main':
			return <MainPage onNavigate={updateRoute} />;
		default:
			return <MainPage onNavigate={updateRoute} />;
	}
}
