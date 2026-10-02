import { useEffect } from 'react';
import useRoute from '@/hooks/useRoute';
import MainPage from './mainPage';

export default function Root() {
	const { route, updateRoute, isAutoRoutingRef } = useRoute();
	console.log('route', route);
	switch (route) {
		case 'main':
			return <MainPage />;
		default:
			return (
				<div className="w-full">
					<p>Root Component</p>
				</div>
			);
	}
}
