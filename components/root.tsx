import { useEffect } from 'react';
import useRoute from '@/hooks/useRoute';
import useSwitchChain from '@/hooks/useSwitchChain';
import useAddChain from '@/hooks/useAddChain';

import MainPage from './mainPage';
import AuthPage from './authPage';
import CreateWallet from './createWallet';
import ImportWalletPage from './importWalletPage';
import UnlockPage from './unlock';
import SendPage from './sendPage';
import NetworksPage from './network';
import SwitchChainPage from './switchNetwork';
import ReceivePage from './receivePage';
import TokensPage from './tokensPage';
import NFTsPage from './nftsPage';
import AddNetworkPage from './addNetwork';
import SendTokenPage from './sendTokenPage';
import TransferNFTPage from './transferNFTPage';

export default function Root() {
	const { route, updateRoute, isAutoRoutingRef } = useRoute();
	const { fetchSwitchChainRequest } = useSwitchChain();
	const { fetchAddChainRequest } = useAddChain();
	// console.log('route', route);
	useEffect(() => {
		if (route === 'switch-chain') {
			fetchSwitchChainRequest();
		}
	}, [route, fetchSwitchChainRequest]);

	// 从 background 获取添加网络请求
	useEffect(() => {
		if (route === 'add-chain') {
			fetchAddChainRequest();
		}
	}, [route, fetchAddChainRequest]);

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
		case 'receive':
			return <ReceivePage onNavigate={updateRoute} />;
		case 'tokens':
			return <TokensPage onNavigate={updateRoute} />;
		case 'nfts':
			return <NFTsPage onNavigate={updateRoute} />;
		case 'add-network':
			return <AddNetworkPage onNavigate={updateRoute} />;
		case 'send-token':
			return <SendTokenPage onNavigate={updateRoute} />;
		case 'main':
			return <MainPage onNavigate={updateRoute} />;
		case 'transfer-nft':
			return <TransferNFTPage onNavigate={updateRoute} />;
		default:
			return <MainPage onNavigate={updateRoute} />;
	}
}
