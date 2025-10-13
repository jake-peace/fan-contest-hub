import type { NextConfig } from 'next';
import packageJson from './package.json';

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
			},
			{
				protocol: 'https',
				hostname: 'i.scdn.co',
			},
			{
				protocol: 'https',
				hostname: 'flagcdn.com',
			},
		],
		qualities: [80],
	},
	env: {
		NEXT_PUBLIC_APP_VERSION: packageJson.version,
	},
};

export default nextConfig;
