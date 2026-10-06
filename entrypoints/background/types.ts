import type { WalletState, Network } from '@/types/wallet';
import type { ethers } from 'ethers';
import type { ProviderRpcError } from '@/types/eip1193';

// 钱包存储结构类型
export interface WalletStoreData {
	state: WalletState;
	version?: number;
}
// 授权请求管理
export interface PendingAuthRequest {
	requestId: string;
	origin: string;
	resolve: (accounts: string[]) => void;
	reject: (error: ProviderRpcError) => void;
	timestamp: number;
}

// 签名请求管理
export interface PendingSignRequest {
	requestId: string;
	origin: string;
	method: string;
	address: string;
	message?: string;
	typedData?: {
		domain: any;
		types: any;
		message: any;
		primaryType?: string;
	};
	resolve: (signature: string) => void;
	reject: (error: ProviderRpcError) => void;
	timestamp: number;
}

// 切换链请求管理
export interface PendingSwitchChainRequest {
	requestId: string;
	origin: string;
	chainId: string;
	targetNetwork: Network | null;
	resolve: (value: PromiseLike<null> | null) => void;
	reject: (error: ProviderRpcError) => void;
	timestamp: number;
}

// 交易请求管理
export interface PendingTransactionRequest {
	requestId: string;
	origin: string;
	method: string; // 'eth_sendTransaction' | 'eth_signTransaction'
	transaction: ethers.TransactionRequest;
	resolve: (txHash: string) => void;
	reject: (error: ProviderRpcError) => void;
	timestamp: number;
}

// 添加链请求管理
export interface PendingAddChainRequest {
	requestId: string;
	origin: string;
	chainParams: {
		chainId: string;
		chainName: string;
		nativeCurrency: {
			name: string;
			symbol: string;
			decimals: number;
		};
		rpcUrls: string[];
		blockExplorerUrls?: string[];
	};
	resolve: (value: PromiseLike<null> | null) => void;
	reject: (error: ProviderRpcError) => void;
	timestamp: number;
}

// 关注资产请求管理
export interface PendingWatchAssetRequest {
	requestId: string;
	origin: string;
	assetParams: {
		type: string;
		options: {
			address: string;
			symbol?: string;
			decimals?: number;
			image?: string;
		};
	};
	resolve: (value: boolean | PromiseLike<boolean>) => void;
	reject: (error: ProviderRpcError) => void;
	timestamp: number;
}

export interface RequestContext {
	sender?: { url?: string; tab?: { url?: string } };
	getWalletState: () => Promise<WalletState | null>;
	getWalletAccounts: () => Promise<string[]>;
	getProvider: () => Promise<ethers.JsonRpcProvider | null>;
	getUnlockedWallet: () => Promise<ethers.Wallet | null>;
	requestUserAuth: (origin: string) => Promise<string[]>;
	openPopup: () => Promise<void>;
	currentPopupRoute: string | null;
	setCurrentPopupRoute: (route: string) => void;
	pendingAuthRequests: Map<string, PendingAuthRequest>;
	pendingSignRequests: Map<string, PendingSignRequest>;
	pendingSwitchChainRequests: Map<string, PendingSwitchChainRequest>;
	pendingTransactionRequests: Map<string, PendingTransactionRequest>;
	pendingAddChainRequests: Map<string, PendingAddChainRequest>;
	pendingWatchAssetRequests: Map<string, PendingWatchAssetRequest>;
}

export type PopupRoute =
	| 'main'
	| 'create'
	| 'import'
	| 'unlock'
	| 'auth'
	| 'sign'
	| 'switch-chain'
	| 'transaction'
	| 'add-chain'
	| 'watch-asset'
	| 'send'
	| 'receive'
	| 'networks'
	| 'add-network'
	| 'tokens'
	| 'nfts'
	| 'send-token'
	| 'transfer-nft';

export interface SwitchChainRequest {
	requestId: string;
	origin: string;
	chainId: string;
	targetNetwork: {
		id: string;
		name: string;
		chainId: number;
		currencySymbol: string;
	} | null;
	timestamp: number;
}

export interface WatchAssetRequest {
	requestId: string;
	origin: string;
	assetParams: {
		type: string;
		options: {
			address: string;
			symbol?: string;
			decimals?: number;
			image?: string;
		};
	};
	timestamp: number;
}

export interface AddChainRequest {
	requestId: string;
	origin: string;
	chainParams: {
		chainId: string;
		chainName: string;
		nativeCurrency: {
			name: string;
			symbol: string;
			decimals: number;
		};
		rpcUrls: string[];
		blockExplorerUrls?: string[];
	};
	timestamp: number;
}
