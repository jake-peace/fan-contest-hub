// app/changelog/page.tsx (REVISED)

import ReleaseCard from '@/components/ReleaseCard';
import { Badge } from '@/components/ui/badge';
import { getStructuredChangelog } from '@/lib/changelogParser';

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;

export default async function ChangelogPage() {
	// 1. Fetch the data on the server
	const releases = await getStructuredChangelog();

	if (releases.length === 0) {
		return (
			<main>
				<h1>Changelog 📜</h1>
				<p>Could not load any release notes from the file system.</p>
			</main>
		);
	}

	return (
		<main>
			<h1 className="text-2xl mb-5">Changelog</h1>

			{/* 2. Map through the releases */}
			<div>
				{releases.map((release) => (
					<div key={release.header}>
						{/* Display the version and date outside the card for clean separation */}
						<div className="flex items-center gap-2 text-xl font-bold mb-2">
							{release.header}
							{release.header.split(' ')[0] === appVersion && <Badge>Current Version</Badge>}
						</div>

						{/* Pass the raw nested markdown content to the Card for rendering */}
						<ReleaseCard markdownContent={release.markdownContent} />
					</div>
				))}
			</div>
		</main>
	);
}
