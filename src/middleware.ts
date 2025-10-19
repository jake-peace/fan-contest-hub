import { NextRequest, NextResponse } from 'next/server';

import { fetchAuthSession } from 'aws-amplify/auth/server';

import { runWithAmplifyServerContext } from '@/utils/amplify-utils';

export async function middleware(request: NextRequest) {
	// 1. **Development Environment Cookie Fix**
	if (process.env.NODE_ENV === 'development') {
		const host = request.headers.get('host');

		// Check if the request is coming from a local IP address (e.g., 192.168.x.x or 10.x.x.x)
		if (host && /^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/.test(host)) {
			const newHeaders = new Headers(request.headers);

			// CRITICAL STEP: Rewrite the Host header to trick the browser/auth service
			// into treating it as a same-site request for cookie validation.
			newHeaders.set('host', 'localhost:3000');

			// Return a response with the modified request headers
			return NextResponse.next({
				request: {
					headers: newHeaders,
				},
			});
		}
	}
	const response = NextResponse.next();

	const authenticated = await runWithAmplifyServerContext({
		nextServerContext: { request, response },
		operation: async (contextSpec) => {
			try {
				const session = await fetchAuthSession(contextSpec, {});
				return session.tokens !== undefined;
			} catch (error) {
				console.log(error);
				return false;
			}
		},
	});

	if (authenticated) {
		return response;
	}
	console.log('redirecting');
	return NextResponse.redirect(new URL('/signin', request.url));
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - login
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|signin|televote).*)',
		'/',
	],
};
