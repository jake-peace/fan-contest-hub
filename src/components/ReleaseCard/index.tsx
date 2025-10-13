/* eslint-disable @typescript-eslint/no-explicit-any */
// app/components/ReleaseCard.tsx
'use client';

import ReactMarkdown from 'react-markdown';
import { Card } from '../ui/card';

// Define base styles (using CSS/Tailwind is better, but inline for demo)
const styles = {
	// card: {
	// 	border: '1px solid #e0e0e0',
	// 	borderRadius: '12px',
	// 	padding: '25px',
	// 	marginBottom: '30px',
	// 	backgroundColor: '#ffffff',
	// },
	header: {
		marginBottom: '20px',
		borderBottom: '1px solid #f0f0f0',
		paddingBottom: '10px',
	},
	version: {
		fontSize: '1.6em',
		fontWeight: '700' as const,
	},
	date: {
		fontSize: '0.9em',
	},
	// Style for the Level 3 headings (e.g., '### Features')
	categoryHeader: {
		fontSize: '1.2em',
		fontWeight: '600' as const,
	},
	// Style for the bulleted lists
	changeList: {
		listStyleType: 'disc',
		paddingLeft: '25px',
	},
};

type ReleaseCardProps = {
	markdownContent: string; // Raw markdown for a single release
};

export default function ReleaseCard({ markdownContent }: ReleaseCardProps) {
	// Custom renderers map Markdown elements (like h3, ul, li) to styled React components
	const customRenderers = {
		// We expect the category titles (Features, Fixes) to be h3
		h3: ({ children }: any) => <h3 style={styles.categoryHeader}>{children}</h3>,
		// Customize the unordered list (bullet points)
		ul: ({ children }: any) => <ul style={styles.changeList}>{children}</ul>,
		// Customize the list items
		li: ({ children }: any) => <li style={{ marginBottom: '5px', lineHeight: '1.4' }}>{children}</li>,
	};

	return (
		<Card className="p-2 mb-5">
			<ReactMarkdown components={customRenderers}>{markdownContent}</ReactMarkdown>
		</Card>
	);
}
