'use client';

import { usePathname } from 'next/navigation';
import React, { ReactNode } from 'react';

interface StyleWrapperProps {
	children: ReactNode;
}

export function StyleWrapper({ children }: StyleWrapperProps) {
	const pathname = usePathname();

	if (pathname.includes('/results')) {
		return <>{children}</>;
	}

	return (
		<div className="min-h-screen bg-background p-4">
			<div className="max-w-md mx-auto">{children}</div>
		</div>
	);
}
