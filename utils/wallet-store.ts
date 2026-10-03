/**
 * 钱包状态管理 Store
 *
 * 基于 Zustand 实现的以太坊钱包状态管理，提供完整的钱包生命周期管理功能。
 * 使用 Chrome Extension 的 storage.local API 进行数据持久化存储。
 *
 * 主要功能模块：
 * 1. 钱包管理：创建钱包、导入钱包（助记词/私钥）、解锁/锁定钱包
 * 2. 账户管理：创建账户、切换账户、更新账户名称
 * 3. 网络管理：添加自定义网络、切换网络
 * 4. 代币管理：添加/删除代币、更新代币余额
 * 5. DApp 集成：连接钱包、签名消息、断开连接
 *
 * 安全特性：
 * - 使用 AES 加密存储助记词和私钥
 * - 使用 SHA256 哈希存储密码
 * - 所有敏感数据在存储前均经过加密处理
 *
 * 技术实现：
 * - 使用 BIP39 标准生成和验证助记词
 * - 使用 BIP44 路径 (m/44'/60'/0'/0/0) 派生账户
 * - 使用 ethers.js 进行钱包操作和 RPC 交互
 */

import { Buffer } from 'buffer';

// 在全局作用域提供 Buffer polyfill（备用，主要 polyfill 在 popup/main.tsx）
if (typeof globalThis.Buffer === 'undefined') {
	globalThis.Buffer = Buffer;
}

import {
	type Network,
	type Token,
	type NFT,
	type NFTCollection,
	type WalletAccount,
	type WalletState,
	DEFAULT_NETWORKS,
} from '@/types/wallet';
import { browser } from 'wxt/browser';
import * as bip39 from 'bip39';
import { AES, SHA256, enc } from 'crypto-js';
import { ethers } from 'ethers';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletStore extends WalletState {
	// Wallet management
	createWallet: (password: string) => Promise<{ mnemonic: string; account: WalletAccount }>;
	importWallet: (mnemonic: string, password: string) => Promise<WalletAccount>;
	importPrivateKey: (
		privateKey: string,
		password: string,
		name?: string
	) => Promise<WalletAccount>;
	unlockWallet: (password: string) => Promise<boolean>;
	lockWallet: () => Promise<void>;

	// Account management
	createAccount: (name?: string) => Promise<WalletAccount>;
	switchAccount: (address: string) => void;
	updateAccountName: (address: string, name: string) => void;

	// Network management
	addNetwork: (network: Network) => void;
	switchNetwork: (networkId: string) => void;

	// Token management
	addToken: (token: Token) => void;
	removeToken: (address: string) => void;
	updateTokenBalance: (address: string, balance: string) => void;

	// NFT management
	addNFT: (nft: NFT) => void;
	removeNFT: (contractAddress: string, tokenId: string) => void;
	addNFTCollection: (collection: NFTCollection) => void;
	removeNFTCollection: (contractAddress: string) => void;
	updateNFTCollection: (contractAddress: string, nfts: NFT[]) => void;

	// Utility
	getProvider: () => ethers.JsonRpcProvider | null;
	isValidPassword: (password: string) => boolean;
	getDecryptedPrivateKey: (password?: string, accountAddress?: string) => Promise<string>;
	getWallet: (password?: string, accountAddress?: string) => Promise<ethers.Wallet | null>;

	// DApp integration
	connect: () => Promise<WalletAccount>;
	signMessage: (message: string) => Promise<string>;
	disconnect: () => void;
}

const initialState: WalletState = {
	isLocked: true,
	isConnected: false,
	accounts: [],
	currentAccount: null,
	mnemonic: null,
	password: null,
	currentNetwork: DEFAULT_NETWORKS[0] as Network,
	networks: DEFAULT_NETWORKS,
	tokens: [],
	nftCollections: [],
};

// 辅助函数：与 background 通信
const setPasswordInBackground = async (password: string): Promise<void> => {
	return new Promise((resolve, reject) => {
		browser.runtime.sendMessage(
			{
				type: 'WALLET_SET_PASSWORD',
				data: { password },
			},
			(response: any) => {
				if (browser.runtime.lastError) {
					reject(new Error(browser.runtime.lastError.message));
				} else if (response?.error) {
					reject(new Error(response.error));
				} else {
					resolve();
				}
			}
		);
	});
};

const getPasswordFromBackground = async (): Promise<string | null> => {
	return new Promise((resolve, reject) => {
		browser.runtime.sendMessage(
			{
				type: 'WALLET_GET_PASSWORD',
				data: {},
			},
			(response: any) => {
				if (browser.runtime.lastError) {
					reject(new Error(browser.runtime.lastError.message));
				} else if (response?.error) {
					reject(new Error(response.error));
				} else {
					resolve(response?.password || null);
				}
			}
		);
	});
};

const clearPasswordInBackground = async (): Promise<void> => {
	return new Promise((resolve, reject) => {
		browser.runtime.sendMessage(
			{
				type: 'WALLET_CLEAR_PASSWORD',
				data: {},
			},
			(response: any) => {
				if (browser.runtime.lastError) {
					reject(new Error(browser.runtime.lastError.message));
				} else if (response?.error) {
					reject(new Error(response.error));
				} else {
					resolve();
				}
			}
		);
	});
};

// 辅助函数：安全获取 storage API
const getStorage = () => {
	// 优先使用 browser API (WXT)
	if (browser?.storage?.local) {
		return browser.storage.local;
	}
	// 回退到 chrome API
	if (typeof chrome !== 'undefined' && chrome.storage?.local) {
		return chrome.storage.local;
	}
	// 浏览器预览/非扩展环境下，回退到 localStorage
	if (typeof window !== 'undefined' && window.localStorage) {
		return {
			get: async (key: string | string[]) => {
				const targets = Array.isArray(key) ? key : [key];
				const result: Record<string, any> = {};
				for (const item of targets) {
					const value = window.localStorage.getItem(item);
					if (value !== null) {
						try {
							result[item] = JSON.parse(value);
						} catch {
							result[item] = value;
						}
					}
				}
				return result;
			},
			set: async (items: Record<string, any>) => {
				Object.entries(items).forEach(([key, value]) => {
					window.localStorage.setItem(key, JSON.stringify(value));
				});
			},
			remove: async (key: string | string[]) => {
				const keys = Array.isArray(key) ? key : [key];
				keys.forEach((item) => window.localStorage.removeItem(item));
			},
		};
	}
	throw new Error('Storage API not available. Make sure the extension has storage permission.');
};

export const useWalletStore = create<WalletStore>()(
	// 使用 persist 让状态持久化
	persist(
		(set, get) => ({
			...initialState,

			createWallet: async (password: string) => {
				// 生成助记词
				const mnemonic = bip39.generateMnemonic();
				// 生成种子
				const seedBuffer = await bip39.mnemonicToSeed(mnemonic);
				// 转成 Uint8Array
				const seed = new Uint8Array(seedBuffer);

				// 生成钱包
				const hdNode = ethers.HDNodeWallet.fromSeed(seed);
				// 生成账户
				const wallet = hdNode.derivePath("m/44'/60'/0'/0/0");

				const account: WalletAccount = {
					address: wallet.address,
					privateKey: wallet.privateKey,
					name: 'Account 1',
					index: 0,
				};

				// Encrypt sensitive data
				const encryptedMnemonic = AES.encrypt(mnemonic, password).toString();
				const encryptedPrivateKey = AES.encrypt(wallet.privateKey, password).toString();

				// 创建加密后的账户对象
				const encryptedAccount = { ...account, privateKey: encryptedPrivateKey };

				set({
					isLocked: false,
					accounts: [encryptedAccount],
					currentAccount: encryptedAccount, // 使用加密后的账户
					mnemonic: encryptedMnemonic,
					password: SHA256(password).toString(),
				});

				// 将密码存储到 background
				await setPasswordInBackground(password);

				return { mnemonic, account };
			},

			// 通过助记词导入钱包
			importWallet: async (mnemonic: string, password: string) => {
				if (!bip39.validateMnemonic(mnemonic)) {
					throw new Error('Invalid mnemonic phrase');
				}

				const seedBuffer = await bip39.mnemonicToSeed(mnemonic);
				const seed = new Uint8Array(seedBuffer);
				const hdNode = ethers.HDNodeWallet.fromSeed(seed);
				const wallet = hdNode.derivePath("m/44'/60'/0'/0/0");

				const account: WalletAccount = {
					address: wallet.address,
					privateKey: wallet.privateKey,
					name: 'Account 1',
					index: 0,
				};

				const encryptedMnemonic = AES.encrypt(mnemonic, password).toString();
				const encryptedPrivateKey = AES.encrypt(wallet.privateKey, password).toString();

				// 创建加密后的账户对象
				const encryptedAccount = { ...account, privateKey: encryptedPrivateKey };

				set({
					isLocked: false,
					accounts: [encryptedAccount],
					currentAccount: encryptedAccount, // 使用加密后的账户
					mnemonic: encryptedMnemonic,
					password: SHA256(password).toString(),
				});

				// 将密码存储到 background
				await setPasswordInBackground(password);

				return account;
			},

			importPrivateKey: async (
				privateKey: string,
				password: string,
				name = 'Imported Account'
			) => {
				try {
					const wallet = new ethers.Wallet(privateKey);
					const existingAccounts = get().accounts;

					const account: WalletAccount = {
						address: wallet.address,
						privateKey: wallet.privateKey,
						name,
						index: existingAccounts.length,
					};

					const encryptedPrivateKey = AES.encrypt(wallet.privateKey, password).toString();

					// 创建加密后的账户对象
					const encryptedAccount = { ...account, privateKey: encryptedPrivateKey };

					set((state) => ({
						accounts: [...state.accounts, encryptedAccount],
						currentAccount: encryptedAccount, // 使用加密后的账户
						password: state.password || SHA256(password).toString(),
						isLocked: false,
					}));

					// 将密码存储到 background
					await setPasswordInBackground(password);

					return account;
				} catch (error) {
					throw new Error('Invalid private key');
				}
			},

			unlockWallet: async (password: string) => {
				const state = get();
				const hashedPassword = SHA256(password).toString();

				if (state.password === hashedPassword) {
					set({ isLocked: false });
					// 将密码存储到 background
					await setPasswordInBackground(password);
					return true;
				}
				return false;
			},

			lockWallet: async () => {
				set({ isLocked: true });
				// 清除 background 中的密码
				await clearPasswordInBackground();
			},

			createAccount: async (name?: string) => {
				const state = get();
				if (!state.mnemonic || !state.password) {
					throw new Error('No wallet found');
				}

				// 从 background 获取已解锁的密码
				const unlockedPassword = await getPasswordFromBackground();
				if (!unlockedPassword) {
					throw new Error('钱包已锁定，请先解锁钱包');
				}

				// Decrypt mnemonic to create new account
				const decryptedMnemonic = AES.decrypt(state.mnemonic, unlockedPassword).toString(
					enc.Utf8
				);
				const seedBuffer = bip39.mnemonicToSeedSync(decryptedMnemonic);
				const seed = new Uint8Array(seedBuffer);
				const hdNode = ethers.HDNodeWallet.fromSeed(seed);
				const accountIndex = state.accounts.length;
				const wallet = hdNode.derivePath(`m/44'/60'/0'/0/${accountIndex}`);

				const account: WalletAccount = {
					address: wallet.address,
					privateKey: wallet.privateKey,
					name: name || `Account ${accountIndex + 1}`,
					index: accountIndex,
				};

				const encryptedPrivateKey = AES.encrypt(
					wallet.privateKey,
					unlockedPassword
				).toString();

				// 创建加密后的账户对象
				const encryptedAccount = { ...account, privateKey: encryptedPrivateKey };

				set((state) => ({
					accounts: [...state.accounts, encryptedAccount],
					currentAccount: encryptedAccount, // 使用加密后的账户
				}));

				return account;
			},

			switchAccount: (address: string) => {
				const state = get();
				const account = state.accounts.find((acc) => acc.address === address);
				if (account) {
					set({ currentAccount: account });
				}
			},

			updateAccountName: (address: string, name: string) => {
				set((state) => ({
					accounts: state.accounts.map((acc) =>
						acc.address === address ? { ...acc, name } : acc
					),
					currentAccount:
						state.currentAccount?.address === address
							? { ...state.currentAccount, name }
							: state.currentAccount,
				}));
			},

			addNetwork: (network: Network) => {
				set((state) => ({
					networks: [...state.networks, network],
				}));
			},

			switchNetwork: (networkId: string) => {
				const state = get();
				const network = state.networks.find((net) => net.id === networkId);
				if (network) {
					set({ currentNetwork: network });
				}
			},

			addToken: (token: Token) => {
				set((state) => ({
					tokens: [...state.tokens.filter((t) => t.address !== token.address), token],
				}));
			},

			removeToken: (address: string) => {
				set((state) => ({
					tokens: state.tokens.filter((token) => token.address !== address),
				}));
			},

			updateTokenBalance: (address: string, balance: string) => {
				set((state) => ({
					tokens: state.tokens.map((token) =>
						token.address === address ? { ...token, balance } : token
					),
				}));
			},

			addNFT: (nft: NFT) => {
				set((state) => {
					const collection = state.nftCollections.find(
						(col) =>
							col.contractAddress.toLowerCase() === nft.contractAddress.toLowerCase()
					);
					if (collection) {
						// 如果集合已存在，添加 NFT
						const existingNFT = collection.nfts.find((n) => n.tokenId === nft.tokenId);
						if (!existingNFT) {
							return {
								nftCollections: state.nftCollections.map((col) =>
									col.contractAddress.toLowerCase() ===
									nft.contractAddress.toLowerCase()
										? { ...col, nfts: [...col.nfts, nft] }
										: col
								),
							};
						}
						return state;
					} else {
						// 创建新集合
						return {
							nftCollections: [
								...state.nftCollections,
								{
									contractAddress: nft.contractAddress,
									nfts: [nft],
								},
							],
						};
					}
				});
			},

			removeNFT: (contractAddress: string, tokenId: string) => {
				set((state) => ({
					nftCollections: state.nftCollections
						.map((collection) =>
							collection.contractAddress.toLowerCase() ===
							contractAddress.toLowerCase()
								? {
										...collection,
										nfts: collection.nfts.filter(
											(nft) => nft.tokenId !== tokenId
										),
									}
								: collection
						)
						.filter((collection) => collection.nfts.length > 0),
				}));
			},

			addNFTCollection: (collection: NFTCollection) => {
				set((state) => ({
					nftCollections: [
						...state.nftCollections.filter(
							(col) =>
								col.contractAddress.toLowerCase() !==
								collection.contractAddress.toLowerCase()
						),
						collection,
					],
				}));
			},

			removeNFTCollection: (contractAddress: string) => {
				set((state) => ({
					nftCollections: state.nftCollections.filter(
						(col) => col.contractAddress.toLowerCase() !== contractAddress.toLowerCase()
					),
				}));
			},

			updateNFTCollection: (contractAddress: string, nfts: NFT[]) => {
				set((state) => ({
					nftCollections: state.nftCollections.map((collection) =>
						collection.contractAddress.toLowerCase() === contractAddress.toLowerCase()
							? { ...collection, nfts }
							: collection
					),
				}));
			},

			getProvider: () => {
				const state = get();
				try {
					// 为 JsonRpcProvider 添加超时和重试配置
					const provider = new ethers.JsonRpcProvider(state.currentNetwork.rpcUrl, {
						name: state.currentNetwork.name,
						chainId: state.currentNetwork.chainId,
					});
					return provider;
				} catch (error) {
					console.error('Failed to create provider:', error);
					return null;
				}
			},

			isValidPassword: (password: string) => {
				const state = get();
				const hashedPassword = SHA256(password).toString();
				return state.password === hashedPassword;
			},

			getDecryptedPrivateKey: async (password?: string, accountAddress?: string) => {
				const state = get();
				const account = accountAddress
					? state.accounts.find((acc) => acc.address === accountAddress)
					: state.currentAccount;

				if (!account) {
					throw new Error('账户不存在');
				}

				// 如果没有提供密码，从 background 获取已解锁的密码
				let passwordToUse = password as string | null;
				if (!passwordToUse) {
					passwordToUse = await getPasswordFromBackground();
				}

				if (!passwordToUse) {
					// 如果 background 中没有密码，自动锁定钱包（安全措施）
					if (!state.isLocked) {
						set({ isLocked: true });
					}
					throw new Error('钱包已锁定，请先解锁钱包');
				}

				try {
					const decryptedBytes = AES.decrypt(account.privateKey, passwordToUse);
					const decryptedPrivateKey = decryptedBytes.toString(enc.Utf8);

					if (!decryptedPrivateKey || decryptedPrivateKey.trim().length === 0) {
						throw new Error('私钥解密失败，请检查密码是否正确');
					}

					// 清理私钥格式：去除空白字符，确保有 0x 前缀
					let cleanPrivateKey = decryptedPrivateKey.trim();
					if (!cleanPrivateKey.startsWith('0x')) {
						cleanPrivateKey = '0x' + cleanPrivateKey;
					}

					// 验证私钥格式
					if (!/^0x[a-fA-F0-9]{64}$/.test(cleanPrivateKey)) {
						throw new Error('私钥格式无效');
					}

					return cleanPrivateKey;
				} catch (error: any) {
					throw new Error(error.message || '私钥解密失败');
				}
			},

			getWallet: async (password?: string, accountAddress?: string) => {
				try {
					const privateKey = await get().getDecryptedPrivateKey(password, accountAddress);
					const provider = get().getProvider();
					if (!provider) {
						throw new Error('无法连接到网络');
					}
					return new ethers.Wallet(privateKey, provider);
				} catch (error: any) {
					console.error('创建钱包失败:', error);
					return null;
				}
			},

			// DApp integration
			connect: async (): Promise<WalletAccount> => {
				const state = await (async (): Promise<WalletState | null> => {
					try {
						const storage = getStorage();
						if (storage && 'get' in storage) {
							const result = await storage.get('wallet-store');
							const stored = result['wallet-store'];
							if (stored && stored.state) {
								return stored.state;
							}
						}
					} catch (error) {
						console.warn('Failed to read wallet state from storage:', error);
					}
					return null;
				})();

				if (!state || !state.currentAccount) {
					throw new Error('请先在插件中导入账户');
				}

				const account = state.currentAccount as WalletAccount;
				set({
					currentAccount: account,
					isConnected: true,
				});

				return account;
			},

			signMessage: async (message: string): Promise<string> => {
				const state = get();
				if (!state.currentAccount) {
					throw new Error('未连接钱包');
				}

				// 从 background 获取已解锁的密码
				const unlockedPassword = await getPasswordFromBackground();
				if (!unlockedPassword) {
					throw new Error('钱包已锁定，请先解锁钱包');
				}

				const decryptedBytes = AES.decrypt(
					state.currentAccount.privateKey,
					unlockedPassword
				);
				const privateKey = decryptedBytes.toString(enc.Utf8);

				// 清理私钥格式
				let cleanPrivateKey = privateKey.trim();
				if (!cleanPrivateKey.startsWith('0x')) {
					cleanPrivateKey = '0x' + cleanPrivateKey;
				}

				const wallet = new ethers.Wallet(cleanPrivateKey);
				return wallet.signMessage(message);
			},

			disconnect: () => {
				set({ currentAccount: null, isConnected: false });
			},
		}),
		{
			name: 'wallet-store',
			// 自定义存储：使用 chrome.storage.local 或 browser.storage.local
			storage: {
				getItem: async (name: string) => {
					try {
						const storage = getStorage();
						const result = await storage.get(name);
						return result[name] || null;
					} catch (error) {
						console.error('Failed to get item from storage:', error);
						return null;
					}
				},
				setItem: async (name: string, value: any) => {
					try {
						const storage = getStorage();
						await storage.set({ [name]: value });
					} catch (error) {
						console.error('Failed to set item to storage:', error);
						throw error;
					}
				},
				removeItem: async (name: string) => {
					try {
						const storage = getStorage();
						await storage.remove(name);
					} catch (error) {
						console.error('Failed to remove item from storage:', error);
						throw error;
					}
				},
			},
			partialize: (state) => ({
				accounts: state.accounts,
				mnemonic: state.mnemonic,
				password: state.password,
				networks: state.networks,
				tokens: state.tokens,
				currentNetwork: state.currentNetwork,
				currentAccount: state.currentAccount,
				isConnected: state.isConnected,
				isLocked: state.isLocked,
				// 注意：密码存储在 background 中，不持久化
			}),
			onRehydrateStorage: () => async (state) => {
				if (!state) return;

				// 更新网络列表：将存储的网络配置与最新的 DEFAULT_NETWORKS 合并
				// 这样可以确保使用最新的 RPC URL
				const updatedNetworks = DEFAULT_NETWORKS.map((defaultNetwork) => {
					// 如果存储的网络列表中有相同 ID 的网络，保留存储的配置（用户可能自定义过）
					// 但更新 RPC URL 为最新的默认值（如果存储的网络 RPC URL 是旧的）
					const storedNetwork = state.networks?.find((n) => n.id === defaultNetwork.id);
					if (storedNetwork) {
						// 检查是否是旧的 RPC URL，如果是则更新
						const isOldRpcUrl = storedNetwork.rpcUrl !== defaultNetwork.rpcUrl;
						if (isOldRpcUrl) {
							console.log(
								`[WalletStore] 更新网络 ${defaultNetwork.name} 的 RPC URL: ${storedNetwork.rpcUrl} -> ${defaultNetwork.rpcUrl}`
							);
							return { ...storedNetwork, rpcUrl: defaultNetwork.rpcUrl };
						}
						return storedNetwork;
					}
					// 如果存储的网络列表中没有，添加新的默认网络
					return defaultNetwork;
				});

				// 更新当前网络：如果当前网络的 RPC URL 是旧的，更新它
				if (state.currentNetwork) {
					const defaultNetwork = DEFAULT_NETWORKS.find(
						(n) => n.id === state.currentNetwork?.id
					);
					if (defaultNetwork && state.currentNetwork.rpcUrl !== defaultNetwork.rpcUrl) {
						console.log(
							`[WalletStore] 更新当前网络 ${defaultNetwork.name} 的 RPC URL: ${state.currentNetwork.rpcUrl} -> ${defaultNetwork.rpcUrl}`
						);
						state.currentNetwork = {
							...state.currentNetwork,
							rpcUrl: defaultNetwork.rpcUrl,
						};
					}
				}

				// 更新状态中的网络列表
				state.networks = updatedNetworks;

				// 恢复状态后，检查 background 中是否有密码
				if (state.accounts.length > 0) {
					try {
						const password = await getPasswordFromBackground();
						if (!password) {
							// 如果 background 中没有密码，自动锁定钱包（安全措施）
							state.isLocked = true;
						} else {
							// 如果 background 中有密码，钱包已解锁
							state.isLocked = false;
						}
					} catch (error) {
						// 如果无法获取密码（background 可能未启动），锁定钱包
						state.isLocked = true;
					}
				}
			},
		}
	)
);
