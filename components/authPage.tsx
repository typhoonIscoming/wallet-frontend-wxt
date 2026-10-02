import type { PopupRoute } from '@/entrypoints/background/types';

interface MainPageProps {
	onNavigate: (route: PopupRoute) => void;
	onLock?: () => void;
}
export default function AuthPage({ onNavigate, onLock }: MainPageProps) {
	return (
		<div className="w-full">
			<p>Auth Page Component</p>
			<button onClick={() => onNavigate('main')}>跳转到main</button>
		</div>
	);
}
