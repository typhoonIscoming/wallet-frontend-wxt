/**
 * NFT 列表页面组件
 */
import { useState } from 'react';
import { useWalletStore } from '@/utils/wallet-store';
import { useNFTCollections } from '@/hooks/useNFTBalance';
import type { PopupRoute } from '@/entrypoints/background/types';
import Header from './header';
import { ethers } from 'ethers';
import { PlusIcon, CancelIcon } from './icons';

interface NFTsPageProps {
	onNavigate: (route: PopupRoute) => void;
}

export default function NFTsPage({ onNavigate }: NFTsPageProps) {
	const { nftCollections, currentAccount, addNFT, removeNFT } = useWalletStore();
	const { loading } = useNFTCollections();
	const [showAddNFT, setShowAddNFT] = useState(false);
	const [collectionAddress, setCollectionAddress] = useState('');
	const [tokenId, setTokenId] = useState('');
	const [adding, setAdding] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// 将所有集合中的 NFT 提取到一个扁平列表中
	const allNFTs = nftCollections.flatMap((collection) =>
		collection.nfts.map((nft) => ({
			...nft,
			collectionName: collection.name || 'Unknown Collection',
		}))
	);

	const handleAddSingleNFT = async () => {
		if (!collectionAddress || !tokenId || !currentAccount) return;

		setAdding(true);
		setError(null);

		try {
			const provider = useWalletStore.getState().getProvider();
			if (!provider) {
				throw new Error('Provider not available');
			}

			// ERC-721 ABI
			const ERC721_ABI = [
				'function ownerOf(uint256 tokenId) view returns (address)',
				'function tokenURI(uint256 tokenId) view returns (string)',
				'function name() view returns (string)',
				'function symbol() view returns (string)',
			];

			const nftContract = new ethers.Contract(collectionAddress, ERC721_ABI, provider);

			// 验证 tokenId 是否属于当前账户
			const owner = await nftContract.ownerOf(tokenId);
			if (owner.toLowerCase() !== currentAccount.address.toLowerCase()) {
				throw new Error('此 NFT 不属于当前账户');
			}

			// 获取 tokenURI 和元数据
			let tokenURI: string | null = null;
			let metadata: any = null;
			let image: string | undefined;
			let name: string | undefined;
			let description: string | undefined;

			try {
				tokenURI = await nftContract.tokenURI(tokenId);
				if (tokenURI) {
					const metadataUrl = tokenURI.startsWith('ipfs://')
						? `https://ipfs.io/ipfs/${tokenURI.replace('ipfs://', '')}`
						: tokenURI;
					const response = await fetch(metadataUrl);
					if (response.ok) {
						metadata = await response.json();
						image = metadata.image || metadata.image_url;
						name = metadata.name;
						description = metadata.description;
						if (image && image.startsWith('ipfs://')) {
							image = `https://ipfs.io/ipfs/${image.replace('ipfs://', '')}`;
						}
					}
				}
			} catch (err) {
				console.error('获取 NFT 元数据失败:', err);
			}

			// 添加 NFT
			addNFT({
				contractAddress: collectionAddress,
				tokenId: tokenId,
				name,
				description,
				image,
				metadata,
			});

			setCollectionAddress('');
			setTokenId('');
			setShowAddNFT(false);
		} catch (err: any) {
			console.error('添加 NFT 失败:', err);
			setError(err.message || '添加 NFT 失败');
		} finally {
			setAdding(false);
		}
	};

	return (
		<div className="min-h-full">
			<Header
				title="NFT"
				showBack
				onBack={() => onNavigate('main')}
				rightAction={
					<div
						className="flex cursor-pointer p-2 hover:bg-[#e8e8e8] items-center gap-2"
						onClick={() => setShowAddNFT(!showAddNFT)}
					>
						{showAddNFT ? <CancelIcon /> : <PlusIcon />}
						{showAddNFT ? '取消' : '添加'}
					</div>
				}
				className="p-2 sticky top-0 bg-white"
			/>
			<div className="px-2 pt-4 pb-4">
				{showAddNFT && (
					<div className="mb-4 p-4 rounded-lg border border-slate-800 bg-gray-600">
						{/* NFT 合约地址 */}
						<div className="mb-3">
							<div className="text-sm text-slate-200 mb-2">NFT 合约地址</div>
							<input
								type="text"
								placeholder="0x..."
								value={collectionAddress}
								onChange={(e) => setCollectionAddress(e.target.value)}
								className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none font-mono transition-colors"
							/>
						</div>

						{/* Token ID */}
						<div className="mb-3">
							<div className="text-sm text-slate-200 mb-2">Token ID</div>
							<input
								type="text"
								placeholder="输入 Token ID"
								value={tokenId}
								onChange={(e) => setTokenId(e.target.value)}
								className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none transition-colors"
							/>
						</div>

						{error && <div className="text-xs text-red-400 mb-3">{error}</div>}

						<button
							onClick={handleAddSingleNFT}
							disabled={adding || !collectionAddress || !tokenId}
							className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-light transition-colors disabled:opacity-60"
						>
							{adding ? '添加中...' : '添加 NFT'}
						</button>
					</div>
				)}

				{loading && allNFTs.length === 0 && (
					<div className="text-center text-slate-400 py-8">加载中...</div>
				)}

				{!loading && allNFTs.length === 0 && (
					<div className="text-center text-slate-600 py-8">
						<div className="mb-2">暂无 NFT</div>
						<div className="text-xs">点击右上角"添加"按钮添加 NFT</div>
					</div>
				)}

				{/* 平铺展示所有 NFT */}
				{allNFTs.length > 0 && (
					<div className="grid grid-cols-2 gap-3">
						{allNFTs.map((nft) => (
							<div
								key={`${nft.contractAddress}-${nft.tokenId}`}
								className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 cursor-pointer hover:bg-slate-900/80 transition-colors relative group"
								onClick={() => {
									onNavigate('transfer-nft');
								}}
							>
								{/* 删除按钮 */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										removeNFT(nft.contractAddress, nft.tokenId);
									}}
									className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
								>
									<svg
										className="w-4 h-4 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>

								{nft.image ? (
									<img
										src={nft.image}
										alt={nft.name || `NFT #${nft.tokenId}`}
										className="w-full aspect-square object-cover rounded-lg mb-2"
										onError={(e) => {
											(e.target as HTMLImageElement).src =
												'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="12"%3ENFT%3C/text%3E%3C/svg%3E';
										}}
									/>
								) : (
									<div className="w-full aspect-square bg-slate-800 rounded-lg mb-2 flex items-center justify-center">
										<span className="text-xs text-slate-400">
											#{nft.tokenId}
										</span>
									</div>
								)}
								<div className="text-xs text-slate-300 truncate mb-1">
									{nft.name || `#${nft.tokenId}`}
								</div>
								<div className="text-xs text-slate-500 truncate">
									{nft.collectionName}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
