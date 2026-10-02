import type { PopupRoute } from '@/entrypoints/background/types';

interface MainPageProps {
	onNavigate: (route: PopupRoute) => void;
}
export default function MainPage({ onNavigate }: MainPageProps) {
	return (
		<div className="w-full">
			<p>Main Page</p>
			<button onClick={() => onNavigate('auth')}>跳转到auth</button>
		</div>
	);
}
