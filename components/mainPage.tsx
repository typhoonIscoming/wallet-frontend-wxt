import type { PopupRoute } from '@/entrypoints/background/types';
import { useWalletStore } from '@/utils/wallet-store';
import Header from './header';

interface MainPageProps {
	onNavigate: (route: PopupRoute) => void;
}
export default function MainPage({ onNavigate }: MainPageProps) {
	const { isLocked, accounts, currentAccount, mnemonic, currentNetwork } = useWalletStore();
	console.log('accounts', accounts);
	if (accounts.length === 0) {
		return (
			<div className="w-full">
				<div className="pb-4">
					<div className="space-y-3">
						<button
							className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-black hover:bg-accent-light transition-colors shadow-lg shadow-accent/20"
							onClick={() => onNavigate('create')}
						>
							创建新钱包
						</button>
						<button
							className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 hover:border-accent/50 transition-colors"
							onClick={() => onNavigate('import')}
						>
							导入钱包
						</button>
					</div>
				</div>
			</div>
		);
	}
	return (
		<div className="w-full">
			<Header title="钱包" />
			<p>Main Page</p>
			<button onClick={() => onNavigate('auth')}>跳转到auth</button>
		</div>
	);
}
