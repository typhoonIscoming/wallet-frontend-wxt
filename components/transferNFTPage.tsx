/**
 * 转账 ERC-721 NFT 页面组件
 */
import { useState, useEffect } from 'react';
import { useWalletStore } from '@/utils/wallet-store';
import type { PopupRoute } from '@/entrypoints/background/types';
import type { NFT } from '@/types/wallet';
import Header from './header';
import { ethers } from 'ethers';

interface TransferNFTPageProps {
	nft?: NFT;
	onNavigate: (route: PopupRoute) => void;
}

export default function TransferNFTPage({ nft, onNavigate }: TransferNFTPageProps) {
	const { nftCollections, currentAccount, isLocked, getWallet } = useWalletStore();
	const [selectedNFT, setSelectedNFT] = useState<NFT | null>(nft || null);
	const [selectedCollection, setSelectedCollection] = useState<string>('');
	const [sendTo, setSendTo] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (nftCollections.length > 0 && !selectedCollection) {
			setSelectedCollection(nftCollections[0].contractAddress);
			if (nftCollections[0].nfts.length > 0) {
				setSelectedNFT(nftCollections[0].nfts[0]);
			}
		}
	}, [nftCollections, selectedCollection]);

	const currentCollection = nftCollections.find(
		(col) => col.contractAddress === selectedCollection
	);

	const handleTransfer = async () => {
		if (!selectedNFT || !sendTo || !currentAccount || isLocked) return;

		setLoading(true);
		setError(null);

		try {
			const wallet = await getWallet();
			if (!wallet) {
				throw new Error('钱包未解锁');
			}

			const provider = useWalletStore.getState().getProvider();
			if (!provider) {
				throw new Error('Provider not available');
			}

			// ERC-721 transferFrom ABI
			const ERC721_ABI = [
				'function transferFrom(address from, address to, uint256 tokenId)',
				'function safeTransferFrom(address from, address to, uint256 tokenId)',
			];

			const nftContract = new ethers.Contract(
				selectedNFT.contractAddress,
				ERC721_ABI,
				wallet
			);

			// 使用 safeTransferFrom（更安全）
			const gasEstimate = await nftContract.safeTransferFrom.estimateGas(
				currentAccount.address,
				sendTo,
				selectedNFT.tokenId
			);
			const gasPrice = await provider.getFeeData();

			const tx = await nftContract.safeTransferFrom(
				currentAccount.address,
				sendTo,
				selectedNFT.tokenId,
				{
					gasLimit: gasEstimate,
					maxFeePerGas: gasPrice.maxFeePerGas,
					maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
				}
			);

			// 等待交易确认
			await tx.wait();

			// 清空表单
			setSendTo('');

			// 返回主页面
			onNavigate('main');
		} catch (err: any) {
			console.error('转账 NFT 失败:', err);
			setError(err.message || '转账 NFT 失败');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-full w-[360px] bg-black text-slate-100">
			<Header
				title="转账 NFT"
				showBack
				onBack={() => {
					onNavigate('nfts');
					setSendTo('');
				}}
			/>
			<div className="px-4 pt-4 pb-4">
				<div className="space-y-4">
					{/* 选择集合 */}
					<div>
						<div className="text-sm text-slate-300 mb-2">选择集合</div>
						<select
							value={selectedCollection}
							onChange={(e) => {
								setSelectedCollection(e.target.value);
								const collection = nftCollections.find(
									(col) => col.contractAddress === e.target.value
								);
								if (collection && collection.nfts.length > 0) {
									setSelectedNFT(collection.nfts[0]);
								} else {
									setSelectedNFT(null);
								}
							}}
							className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-accent focus:outline-none transition-colors"
						>
							{nftCollections.map((col) => (
								<option key={col.contractAddress} value={col.contractAddress}>
									{col.name || 'Unknown Collection'}
								</option>
							))}
						</select>
					</div>

					{/* 选择 NFT */}
					{currentCollection && currentCollection.nfts.length > 0 && (
						<div>
							<div className="text-sm text-slate-300 mb-2">选择 NFT</div>
							<div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
								{currentCollection.nfts.map((n) => (
									<div
										key={`${n.contractAddress}-${n.tokenId}`}
										className={`rounded-lg border p-2 cursor-pointer transition-colors ${
											selectedNFT?.tokenId === n.tokenId
												? 'border-accent bg-accent/10'
												: 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/80'
										}`}
										onClick={() => setSelectedNFT(n)}
									>
										{n.image ? (
											<img
												src={n.image}
												alt={n.name || `NFT #${n.tokenId}`}
												className="w-full aspect-square object-cover rounded-lg mb-1"
												onError={(e) => {
													(e.target as HTMLImageElement).src =
														'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="12"%3ENFT%3C/text%3E%3C/svg%3E';
												}}
											/>
										) : (
											<div className="w-full aspect-square bg-slate-800 rounded-lg mb-1 flex items-center justify-center">
												<span className="text-xs text-slate-400">
													#{n.tokenId}
												</span>
											</div>
										)}
										<div className="text-xs text-slate-300 truncate text-center">
											{n.name || `#${n.tokenId}`}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* 选中的 NFT 预览 */}
					{selectedNFT && (
						<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
							<div className="text-xs text-slate-400 mb-2">将转账</div>
							<div className="flex items-center gap-3">
								{selectedNFT.image ? (
									<img
										src={selectedNFT.image}
										alt={selectedNFT.name || `NFT #${selectedNFT.tokenId}`}
										className="w-16 h-16 object-cover rounded-lg"
										onError={(e) => {
											(e.target as HTMLImageElement).src =
												'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="12"%3ENFT%3C/text%3E%3C/svg%3E';
										}}
									/>
								) : (
									<div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
										<span className="text-xs text-slate-400">
											#{selectedNFT.tokenId}
										</span>
									</div>
								)}
								<div className="flex-1">
									<div className="text-sm font-medium text-slate-100">
										{selectedNFT.name || `NFT #${selectedNFT.tokenId}`}
									</div>
									<div className="text-xs text-slate-400 font-mono">
										Token ID: {selectedNFT.tokenId}
									</div>
								</div>
							</div>
						</div>
					)}

					{/* 接收地址 */}
					<div>
						<div className="text-sm text-slate-300 mb-2">接收地址</div>
						<input
							type="text"
							placeholder="0x..."
							value={sendTo}
							onChange={(e) => setSendTo(e.target.value)}
							className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none font-mono transition-colors"
							disabled={loading}
						/>
					</div>

					{error && (
						<div className="rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
							{error}
						</div>
					)}

					<button
						className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
						onClick={handleTransfer}
						disabled={loading || !sendTo || !selectedNFT || isLocked}
					>
						{loading ? '转账中...' : '转账 NFT'}
					</button>
				</div>
			</div>
		</div>
	);
}
