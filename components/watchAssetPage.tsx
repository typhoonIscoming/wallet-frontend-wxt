/**
 * 添加代币确认页面组件
 */
import type { PopupRoute, WatchAssetRequest } from '@/entrypoints/background/types';
import Header from './header';
import useWatchAsset from '@/hooks/useWatchAsset';

interface WatchAssetPageProps {
	onNavigate: (route: PopupRoute) => void;
}

export function WatchAssetPage({ onNavigate }: WatchAssetPageProps) {
	const { watchAssetRequest, loading, error, handleWatchAssetApprove, handleWatchAssetReject } =
		useWatchAsset();

	// 处理添加代币确认
	const handleWatchAssetApproveClick = async () => {
		try {
			await handleWatchAssetApprove();
			await onNavigate('main');
		} catch (error: any) {
			// 错误已经在 hook 中处理
		}
	};

	// 处理添加代币拒绝
	const handleWatchAssetRejectClick = async () => {
		try {
			await handleWatchAssetReject();
			await onNavigate('main');
		} catch (error: any) {
			// 错误已经在 hook 中处理
		}
	};

	if (!watchAssetRequest) {
		return (
			<div className="min-h-full w-[360px] bg-black text-slate-100">
				<Header title="添加代币" />
				<div className="px-4 pt-6 pb-4">
					<div className="text-sm text-slate-400 mb-4">等待添加代币请求...</div>
				</div>
			</div>
		);
	}

	const { address, symbol, decimals, image } = watchAssetRequest.assetParams.options;

	return (
		<div className="min-h-full w-[360px] bg-black text-slate-100">
			<Header title="添加代币" />
			<div className="px-4 pt-4 pb-4">
				<div className="text-sm text-slate-400 mb-4">以下网站想要添加代币到您的钱包</div>

				<div className="space-y-4">
					<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
						<div className="text-xs text-slate-400 mb-1">网站</div>
						<div className="text-sm font-medium text-slate-100 break-all">
							{watchAssetRequest.origin}
						</div>
					</div>

					<div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
						<div className="text-xs text-accent mb-2">代币信息</div>
						<div className="space-y-2">
							{image && (
								<div className="flex items-center gap-3 mb-2">
									<img
										src={image}
										alt={symbol || 'Token'}
										className="w-12 h-12 rounded-full"
									/>
									<div>
										<div className="text-sm font-medium text-slate-100">
											{symbol || 'Unknown'}
										</div>
										<div className="text-xs text-slate-400">代币</div>
									</div>
								</div>
							)}
							<div>
								<div className="text-xs text-slate-400 mb-0.5">代币符号</div>
								<div className="text-sm font-medium text-slate-100">
									{symbol || '将从链上获取'}
								</div>
							</div>
							<div>
								<div className="text-xs text-slate-400 mb-0.5">小数位数</div>
								<div className="text-sm font-medium text-slate-100">
									{decimals !== undefined ? decimals : '将从链上获取'}
								</div>
							</div>
							<div>
								<div className="text-xs text-slate-400 mb-0.5">合约地址</div>
								<div className="text-xs font-mono text-slate-300 break-all">
									{address}
								</div>
							</div>
						</div>
					</div>

					<div className="rounded-lg border border-yellow-900/40 bg-yellow-950/20 p-3">
						<div className="text-xs text-yellow-200">
							⚠️ 请确认代币信息正确。添加代币后，您可以在代币列表中查看余额。
						</div>
					</div>

					{error && (
						<div className="rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
							{error}
						</div>
					)}

					<div className="flex gap-3">
						<button
							className="flex-1 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
							onClick={handleWatchAssetRejectClick}
							disabled={loading}
						>
							拒绝
						</button>
						<button
							className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
							onClick={handleWatchAssetApproveClick}
							disabled={loading}
						>
							{loading ? '添加中...' : '添加'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
