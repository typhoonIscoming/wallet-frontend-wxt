/**
 * 钱包相关类型定义
 */

/**
 * 钱包账户
 */
export interface WalletAccount {
	address: string;
	privateKey: string; // 加密存储
	name: string;
	index: number;
}

/**
 * 网络配置
 */
export interface Network {
	id: string;
	name: string;
	rpcUrl: string;
	chainId: number;
	currencySymbol: string;
	blockExplorerUrl?: string;
}

/**
 * 代币信息
 */
export interface Token {
	address: string;
	symbol: string;
	name: string;
	decimals: number;
	balance?: string;
	logoURI?: string;
}

/**
 * NFT 信息
 */
export interface NFT {
	contractAddress: string;
	tokenId: string;
	name?: string;
	description?: string;
	image?: string;
	metadata?: any;
}

/**
 * NFT 集合信息
 */
export interface NFTCollection {
	contractAddress: string;
	name?: string;
	symbol?: string;
	totalSupply?: string;
	nfts: NFT[];
}

/**
 * 钱包状态
 */
export interface WalletState {
	isLocked: boolean;
	isConnected: boolean;
	accounts: WalletAccount[];
	currentAccount: WalletAccount | null;
	mnemonic: string | null; // 加密存储
	password: string | null; // 哈希存储
	currentNetwork: Network;
	networks: Network[];
	tokens: Token[];
	nftCollections: NFTCollection[];
}

export interface WalletStoreData {
	state: WalletState;
	version?: number;
}

/**
 * 默认网络列表
 */
export const DEFAULT_NETWORKS: Network[] = [
	{
		id: 'ethereum-mainnet',
		name: 'Ethereum Mainnet',
		// rpcUrl: 'https://eth.llamarpc.com',
		rpcUrl: 'https://mainnet.infura.io/v3/b122488eb350495783860d44c3d5689c',
		chainId: 1,
		currencySymbol: 'ETH',
		blockExplorerUrl: 'https://etherscan.io',
	},
	{
		id: 'ethereum-sepolia',
		name: 'Sepolia Testnet',
		// rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
		rpcUrl: 'https://sepolia.infura.io/v3/b122488eb350495783860d44c3d5689c',
		chainId: 11155111,
		currencySymbol: 'ETH',
		blockExplorerUrl: 'https://sepolia.etherscan.io',
	},
	{
		id: 'polygon-mainnet',
		name: 'Polygon',
		// rpcUrl: 'https://polygon-rpc.com',
		rpcUrl: 'https://polygon-mainnet.infura.io/v3/b122488eb350495783860d44c3d5689c',
		chainId: 137,
		currencySymbol: 'MATIC',
		blockExplorerUrl: 'https://polygonscan.com',
	},
	{
		id: 'optimism-mainnet',
		name: 'Optimism',
		// rpcUrl: 'https://mainnet.optimism.io',
		rpcUrl: 'https://optimism-mainnet.infura.io/v3/b122488eb350495783860d44c3d5689c',
		chainId: 10,
		currencySymbol: 'ETH',
		blockExplorerUrl: 'https://optimistic.etherscan.io',
	},
	{
		id: 'bsc-mainnet',
		name: 'BNB Smart Chain',
		// rpcUrl: 'https://bsc-dataseed.binance.org',
		rpcUrl: 'https://bsc-mainnet.infura.io/v3/b122488eb350495783860d44c3d5689c',
		chainId: 56,
		currencySymbol: 'BNB',
		blockExplorerUrl: 'https://bscscan.com',
	},
];
