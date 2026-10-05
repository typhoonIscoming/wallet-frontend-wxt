/**
 * ERC-721 NFT 余额管理 Hook
 */
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWalletStore } from '@/utils/wallet-store';
import type { NFT, NFTCollection } from '@/types/wallet';

// ERC-721 标准 ABI
const ERC721_ABI = [
	'function balanceOf(address owner) view returns (uint256)',
	'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
	'function tokenURI(uint256 tokenId) view returns (string)',
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function totalSupply() view returns (uint256)',
];

export function useNFTBalance(contractAddress: string) {
	const { currentAccount, isLocked, currentNetwork, getProvider } = useWalletStore();
	const [nfts, setNfts] = useState<NFT[]>([]);
	const [collectionInfo, setCollectionInfo] = useState<{ name?: string; symbol?: string } | null>(
		null
	);
	const [loading, setLoading] = useState(false);
	const [balance, setBalance] = useState<number>(0);

	const fetchNFTBalance = useCallback(async () => {
		if (!currentAccount || isLocked || !contractAddress) {
			setNfts([]);
			setBalance(0);
			return;
		}

		setLoading(true);
		try {
			const provider = getProvider();
			if (!provider) {
				console.error('[NFTBalance] Provider not available');
				setNfts([]);
				setBalance(0);
				return;
			}

			const nftContract = new ethers.Contract(contractAddress, ERC721_ABI, provider);

			// 获取余额
			const balanceResult = await nftContract.balanceOf(currentAccount.address);
			const balanceNum = Number(balanceResult);
			setBalance(balanceNum);

			// 获取集合信息
			try {
				const [name, symbol] = await Promise.all([
					nftContract.name().catch(() => null),
					nftContract.symbol().catch(() => null),
				]);
				setCollectionInfo({ name: name || undefined, symbol: symbol || undefined });
			} catch (error) {
				console.error('获取 NFT 集合信息失败:', error);
			}

			// 获取所有 tokenId
			const tokenIds: string[] = [];
			for (let i = 0; i < balanceNum; i++) {
				try {
					const tokenId = await nftContract.tokenOfOwnerByIndex(
						currentAccount.address,
						i
					);
					tokenIds.push(tokenId.toString());
				} catch (error) {
					console.error(`获取 tokenId at index ${i} 失败:`, error);
				}
			}

			// 获取每个 NFT 的元数据
			const nftPromises = tokenIds.map(async (tokenId) => {
				try {
					const tokenURI = await nftContract.tokenURI(tokenId);
					let metadata: any = null;
					let image: string | undefined;
					let name: string | undefined;
					let description: string | undefined;

					// 尝试获取元数据
					if (tokenURI) {
						try {
							// 处理 IPFS 链接
							const metadataUrl = tokenURI.startsWith('ipfs://')
								? `https://ipfs.io/ipfs/${tokenURI.replace('ipfs://', '')}`
								: tokenURI;

							const response = await fetch(metadataUrl);
							if (response.ok) {
								metadata = await response.json();
								image = metadata.image || metadata.image_url;
								name = metadata.name;
								description = metadata.description;

								// 处理 IPFS 图片链接
								if (image && image.startsWith('ipfs://')) {
									image = `https://ipfs.io/ipfs/${image.replace('ipfs://', '')}`;
								}
							}
						} catch (error) {
							console.error(`获取 NFT ${tokenId} 元数据失败:`, error);
						}
					}

					return {
						contractAddress,
						tokenId,
						name,
						description,
						image,
						metadata,
					} as NFT;
				} catch (error) {
					console.error(`获取 NFT ${tokenId} 信息失败:`, error);
					return {
						contractAddress,
						tokenId,
					} as NFT;
				}
			});

			const nftResults = await Promise.all(nftPromises);
			setNfts(nftResults);
		} catch (error: any) {
			console.error('获取 NFT 余额失败:', error);
			setNfts([]);
			setBalance(0);
		} finally {
			setLoading(false);
		}
	}, [currentAccount, isLocked, currentNetwork, contractAddress, getProvider]);

	useEffect(() => {
		if (!isLocked && currentAccount && contractAddress) {
			fetchNFTBalance();
		}
	}, [currentAccount, isLocked, currentNetwork, contractAddress, fetchNFTBalance]);

	return {
		nfts,
		balance,
		collectionInfo,
		loading,
		fetchNFTBalance,
	};
}

/**
 * 获取所有 NFT 集合
 */
export function useNFTCollections() {
	const { currentAccount, isLocked, currentNetwork, nftCollections, updateNFTCollection } =
		useWalletStore();
	const [loading, setLoading] = useState(false);
	const [lastCollectionCount, setLastCollectionCount] = useState(0);

	const fetchAllNFTs = useCallback(async () => {
		if (!currentAccount || isLocked || nftCollections.length === 0) {
			return;
		}

		setLoading(true);
		try {
			// 为每个集合获取 NFT
			const promises = nftCollections.map(async (collection) => {
				// 直接在这里实现逻辑，因为 hooks 不能在循环中使用
				const provider = useWalletStore.getState().getProvider();
				if (!provider) return;

				const ERC721_ABI = [
					'function balanceOf(address owner) view returns (uint256)',
					'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
					'function tokenURI(uint256 tokenId) view returns (string)',
				];

				try {
					const nftContract = new ethers.Contract(
						collection.contractAddress,
						ERC721_ABI,
						provider
					);
					const balanceResult = await nftContract.balanceOf(currentAccount.address);
					const balanceNum = Number(balanceResult);

					const tokenIds: string[] = [];
					for (let i = 0; i < balanceNum; i++) {
						try {
							const tokenId = await nftContract.tokenOfOwnerByIndex(
								currentAccount.address,
								i
							);
							tokenIds.push(tokenId.toString());
						} catch (error) {
							console.error(`获取 tokenId at index ${i} 失败:`, error);
						}
					}

					// 获取现有的 NFT 列表（保留手动添加的 NFT）
					const existingNFTs = collection.nfts || [];
					const existingTokenIds = new Set(existingNFTs.map((nft) => nft.tokenId));

					const nftPromises = tokenIds.map(async (tokenId) => {
						// 如果已经存在，保留现有数据
						const existingNFT = existingNFTs.find((nft) => nft.tokenId === tokenId);
						if (existingNFT) {
							return existingNFT;
						}

						// 否则获取新数据
						try {
							const tokenURI = await nftContract.tokenURI(tokenId);
							let metadata: any = null;
							let image: string | undefined;
							let name: string | undefined;

							if (tokenURI) {
								try {
									const metadataUrl = tokenURI.startsWith('ipfs://')
										? `https://ipfs.io/ipfs/${tokenURI.replace('ipfs://', '')}`
										: tokenURI;
									const response = await fetch(metadataUrl);
									if (response.ok) {
										metadata = await response.json();
										image = metadata.image || metadata.image_url;
										name = metadata.name;
										if (image && image.startsWith('ipfs://')) {
											image = `https://ipfs.io/ipfs/${image.replace('ipfs://', '')}`;
										}
									}
								} catch (error) {
									console.error(`获取 NFT ${tokenId} 元数据失败:`, error);
								}
							}

							return {
								contractAddress: collection.contractAddress,
								tokenId,
								name,
								image,
								metadata,
							} as NFT;
						} catch (error) {
							return {
								contractAddress: collection.contractAddress,
								tokenId,
							} as NFT;
						}
					});

					const chainNFTs = await Promise.all(nftPromises);

					// 合并链上 NFT 和手动添加的 NFT（手动添加的 NFT 可能不在链上）
					const manualNFTs = existingNFTs.filter(
						(nft) => !tokenIds.includes(nft.tokenId)
					);
					const mergedNFTs = [...chainNFTs, ...manualNFTs];

					updateNFTCollection(collection.contractAddress, mergedNFTs);
				} catch (error) {
					console.error(`获取集合 ${collection.contractAddress} NFT 失败:`, error);
				}
			});

			await Promise.all(promises);
		} catch (error: any) {
			console.error('批量获取 NFT 失败:', error);
		} finally {
			setLoading(false);
		}
	}, [currentAccount, isLocked, currentNetwork, nftCollections, updateNFTCollection]);

	useEffect(() => {
		// 只在集合数量变化时自动刷新（新增或删除集合），而不是在 NFT 列表变化时刷新
		const currentCollectionCount = nftCollections.length;
		if (!isLocked && currentAccount && currentCollectionCount > 0) {
			// 如果集合数量变化了，才刷新
			if (currentCollectionCount !== lastCollectionCount) {
				setLastCollectionCount(currentCollectionCount);
				fetchAllNFTs();
			}

			// 每60秒自动刷新（但不会覆盖手动添加的 NFT）
			const interval = setInterval(fetchAllNFTs, 60000);
			return () => clearInterval(interval);
		} else if (currentCollectionCount === 0) {
			setLastCollectionCount(0);
		}
	}, [
		currentAccount,
		isLocked,
		currentNetwork,
		nftCollections.length,
		lastCollectionCount,
		fetchAllNFTs,
	]);

	return {
		loading,
		fetchAllNFTs,
	};
}
