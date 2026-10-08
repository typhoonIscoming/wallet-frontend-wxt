/**
 * 授权页面组件
 */
import { useEffect, useState } from 'react';
import { useWalletStore } from '@/utils/wallet-store';
import type { AuthRequest, PopupRoute } from '@/entrypoints/background/types';
import Header from './header';
import useAuth from '@/hooks/useAuth';

interface AuthPageProps {
	onNavigate: (route: PopupRoute) => void;
}

export default function AuthPage({ onNavigate }: AuthPageProps) {
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const { currentAccount } = useWalletStore();
	const { authRequest, fetchAuthRequest, handleAuthApprove, handleAuthReject } = useAuth();

	// 处理授权确认
	const handleAuthApproveClick = async () => {
		try {
			await handleAuthApprove(currentAccount);
			await onNavigate('main');
			setError(null);
		} catch (error: any) {
			setError(error.message || '授权确认失败');
		}
	};

	// 处理授权拒绝
	const handleAuthRejectClick = async () => {
		try {
			await handleAuthReject();
			await onNavigate('main');
			setError(null);
		} catch (error: any) {
			setError(error.message || '授权拒绝失败');
		}
	};

	if (!authRequest) {
		return (
			<div className="min-h-full w-[360px] bg-black text-slate-100">
				<Header title="授权请求" />
				<div className="px-4 pt-6 pb-4">
					<div className="text-sm text-slate-400 mb-4">等待授权请求...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-full w-[360px] bg-black text-slate-100">
			<Header title="连接请求" />
			<div className="px-4 pt-4 pb-4">
				<div className="text-sm text-slate-400 mb-4">以下网站想要连接您的钱包</div>

				<div className="space-y-4">
					<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
						<div className="text-xs text-slate-400 mb-1">网站</div>
						<div className="text-sm font-medium text-slate-100 break-all">
							{authRequest.origin}
						</div>
					</div>

					{currentAccount && (
						<div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
							<div className="text-xs text-slate-400 mb-1">账户</div>
							<div className="text-sm font-mono text-slate-100 break-all">
								{currentAccount.address}
							</div>
							<div className="text-xs text-slate-400 mt-1">{currentAccount.name}</div>
						</div>
					)}

					<div className="rounded-lg border border-yellow-900/40 bg-yellow-950/20 p-3">
						<div className="text-xs text-yellow-200">
							⚠️ 请确认您信任此网站。授权后，该网站将能够查看您的账户地址。
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
							onClick={handleAuthRejectClick}
							disabled={loading}
						>
							拒绝
						</button>
						<button
							className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
							onClick={handleAuthApproveClick}
							disabled={loading || !currentAccount}
						>
							授权
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
