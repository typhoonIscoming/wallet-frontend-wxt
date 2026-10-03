/**
 * 导入钱包页面组件
 */
import { useState, useEffect } from 'react';
import type { PopupRoute } from '@/entrypoints/background/types';
import Header from './header';
import { useWalletStore } from '@/utils/wallet-store';

interface ImportWalletPageProps {
	onNavigate: (route: PopupRoute) => void;
}
let timer: ReturnType<typeof setTimeout>;
export default function ImportWalletPage({ onNavigate }: ImportWalletPageProps) {
	const { importWallet } = useWalletStore();
	const [importMnemonic, setImportMnemonic] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const onImportMnemonicChange = (mnemonic: string) => setImportMnemonic(mnemonic);
	const onPasswordChange = (password: string) => setPassword(password);
	const onImportWallet = async () => {
		setLoading(true);
		setError(null);
		try {
			// 调用导入钱包的逻辑，这里可以根据实际情况进行修改
			await importWallet(importMnemonic, password);
			setError('导入成功！');
			timer = setTimeout(() => {
				onNavigate('main');
				clearTimeout(timer);
			}, 3500);
		} catch (err: any) {
			setError(err.message || '导入失败');
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		return () => {
			if (timer) {
				clearTimeout(timer);
			}
		};
	}, []);
	return (
		<div className="min-h-full text-slate-100">
			<Header
				title="导入钱包"
				showBack
				onBack={() => {
					onNavigate('main');
					onImportMnemonicChange('');
					onPasswordChange('');
				}}
			/>

			<div className="pt-6 pb-4">
				<div className="space-y-4">
					<div>
						<div className="text-sm text-black mb-2">助记词</div>
						<textarea
							placeholder="请输入12或24个助记词，用空格分隔"
							value={importMnemonic}
							onChange={(e) => onImportMnemonicChange(e.target.value)}
							rows={4}
							className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-white focus:border-accent focus:outline-none resize-none transition-colors"
							disabled={loading}
						/>
					</div>

					<div>
						<div className="text-sm text-black mb-2">设置密码</div>
						<input
							type="password"
							placeholder="至少8位字符"
							value={password}
							onChange={(e) => onPasswordChange(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && onImportWallet()}
							className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-white focus:border-accent focus:outline-none transition-colors"
							disabled={loading}
						/>
					</div>

					{error && (
						<div className="rounded-lg px-3 py-2 text-sm text-red-500">{error}</div>
					)}

					<button
						className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
						onClick={onImportWallet}
						disabled={loading || !importMnemonic || !password}
					>
						{loading ? '导入中...' : '导入钱包'}
					</button>
				</div>
			</div>
		</div>
	);
}
