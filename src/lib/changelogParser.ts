/* eslint-disable @typescript-eslint/no-explicit-any */
import { promises as fs } from 'fs';
import path from 'path';
import { remark } from 'remark';
import { toMarkdown } from 'mdast-util-to-markdown';
import { RootContent, Content, Root } from 'mdast'; // Import Content type

// Ensure these dependencies are installed:
// npm install remark unist-util-visit mdast-util-to-markdown
// npm install -D @types/unist unist-util-visit-parents

export type Release = {
	header: string;
	markdownContent: string;
};

// Define the type for the object we use to build a release
let currentRelease: { header: string; nodes: RootContent[] } | null = null;

/**
 * Recursively extracts all text content from a list of inline Markdown nodes (Text, Link, Emphasis, etc.).
 * This is necessary because heading children can be links, not just text, and simply accessing '.value' fails.
 */
function extractTextFromInlineNodes(nodes: Content[]): string {
	return nodes
		.map((node: any) => {
			if (node.type === 'text') {
				return node.value;
			}
			if (node.children && Array.isArray(node.children)) {
				// Recurse into children of Link, Emphasis, etc.
				return extractTextFromInlineNodes(node.children);
			}
			return '';
		})
		.join('');
}

/**
 * Reads CHANGELOG.md, parses it into an AST, and extracts releases based on
 * Level 1 (#) OR Level 2 (##) headers by iterating over the root nodes.
 */
export async function getStructuredChangelog(): Promise<Release[]> {
	const filePath = path.join(process.cwd(), 'CHANGELOG.md');
	let fileContent: string;
	const releases: Release[] = [];

	try {
		fileContent = await fs.readFile(filePath, 'utf8');
	} catch (error) {
		console.error('Failed to read CHANGELOG.md:', error);
		return [];
	}

	// Cast the parsed tree to the Root type for easier iteration
	const tree = remark().parse(fileContent) as Root;

	// Reset currentRelease for the execution scope
	currentRelease = null;

	/**
	 * Helper function to finalize the current release block, convert collected
	 * nodes to Markdown, and push it to the releases array.
	 */
	const finalizeAndPushRelease = () => {
		if (currentRelease) {
			// Convert the collected content nodes back to a Markdown string
			const markdown = currentRelease.nodes.length > 0 ? toMarkdown({ type: 'root', children: currentRelease.nodes }) : '';

			releases.push({
				header: currentRelease.header,
				markdownContent: markdown.trim(),
			});
			currentRelease = null;
		}
	};

	// Iterate over all children nodes of the root document sequentially
	for (const node of tree.children) {
		// Check if the node is a new release boundary (Heading 1 or Heading 2)
		const isReleaseHeader = node.type === 'heading' && (node.depth === 1 || node.depth === 2);

		if (isReleaseHeader) {
			// 1. Finalize the previous release block
			finalizeAndPushRelease();

			// 2. Start a new release block
			// Use the new helper function to safely extract text from all inline children,
			// including links (e.g., [1.0.2])
			const headerText = extractTextFromInlineNodes(node.children as Content[]);

			// Start collecting content from the next nodes
			currentRelease = {
				header: headerText.trim(),
				nodes: [],
			};
		} else if (currentRelease) {
			// 3. If we are inside a release block, collect the content node
			currentRelease.nodes.push(node as RootContent);
		}
	}

	// Finalize the very last collected release after the loop ends
	finalizeAndPushRelease();

	// Filter out the 'Unreleased' section and any potential empty title releases
	return releases.filter((r) => !r.header.toLowerCase().includes('unreleased') && r.header.trim() !== '');
}
