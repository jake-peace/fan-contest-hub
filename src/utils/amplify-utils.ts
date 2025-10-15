export const dynamic = 'force-dynamic';

import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
import { getCurrentUser } from 'aws-amplify/auth/server';
import { type Schema } from '../../amplify/data/resource';
import outputs from '../../amplify_outputs.json';
import { cookies } from 'next/headers';

// Define a type for the 'cookies' function reference for clarity
type CookiesFn = typeof cookies;

export const { runWithAmplifyServerContext } = createServerRunner({
	config: outputs,
	runtimeOptions: {
		cookies: {
			// **CRITICAL: Ensure sameSite is not overly strict (like 'strict')**
			// If the login is a redirect (which 2FA often is), 'strict' will fail.
			sameSite: 'lax',
			// The domain is often omitted in dev, but if specified, it must match.
			// domain: 'localhost',
			// ...
		},
	},
});

export const cookiesClient = generateServerClientUsingCookies<Schema>({
	config: outputs,
	authMode: 'userPool',
	cookies,
});

export async function AuthGetCurrentUserServer(requestCookies: CookiesFn) {
	try {
		const currentUser = await runWithAmplifyServerContext({
			nextServerContext: { cookies: requestCookies },
			operation: (contextSpec) => getCurrentUser(contextSpec),
		});
		return currentUser;
	} catch (error) {
		console.error(error);
	}
}
