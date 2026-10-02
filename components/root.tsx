import { useEffect } from 'react';
import useRoute from '@/hooks/useRoute';
import MainPage from './mainPage';
import AuthPage from './authPage';

export default function Root() {
	const { route, updateRoute, isAutoRoutingRef } = useRoute();
	console.log('route', route);
	switch (route) {
		case 'main':
			return <MainPage onNavigate={updateRoute} />;
		case 'auth':
			return <AuthPage onNavigate={updateRoute} />;
		default:
			return (
				<div className="w-full">
					<p>Root Component</p>
				</div>
			);
	}
}
