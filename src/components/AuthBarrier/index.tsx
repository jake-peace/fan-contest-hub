'use client';

import { isLoggedIn } from '@/utils/AuthUtils';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { useAppDispatch } from '@/app/store/hooks';
import { setAttributes, setUser } from '@/app/store/reducers/userReducer';
import Loading from '../Loading';

interface AuthBarrierProps {
	children: ReactNode;
}

const AuthBarrier: React.FC<AuthBarrierProps> = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();
	const dispatch = useAppDispatch();

	useEffect(() => {
		async function checkUser() {
			try {
				const userResponse = await isLoggedIn();
				setIsAuthenticated(true);
				const response = await fetchUserAttributes();
				dispatch(setAttributes(response.nickname as string));
				dispatch(setUser(userResponse.userId));
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (e) {
				setIsAuthenticated(false);
				await signOut();
				router.push('/signin');
			} finally {
				setIsLoading(false);
			}
		}
		checkUser();
	}, [dispatch, router]);

	if (isLoading) {
		return <Loading />;
	}

	return isAuthenticated ? children : null;
};

export default AuthBarrier;
