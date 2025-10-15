import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import { Schema } from '../../../amplify/data/resource';
import { Badge } from '../ui/badge';
import { GripVertical } from 'lucide-react';

type Submission = Schema['Submission']['type'];

interface SortableItemProps {
	id: string;
	song: Submission;
	index: number;
}

const getBadgeColor = (rank: number) => {
	if (rank > 10) {
		return 'bg-(--destructive)';
	}
	switch (rank) {
		case 1:
			return 'bg-(--gold) text-[black]';
		case 2:
			return 'bg-(--silver) text-[black]';
		case 3:
			return 'bg-(--bronze) text-[black]';
		default:
			return '';
	}
};

const ordinalRules = new Intl.PluralRules('en-GB', { type: 'ordinal' });

const suffixes = new Map([
	['one', 'st'],
	['two', 'nd'],
	['few', 'rd'],
	['other', 'th'],
]);

function formatOrdinal(n: number): string {
	const rule = ordinalRules.select(n);
	const suffix = suffixes.get(rule);
	return `${n}${suffix}`;
}

const rankingPoints = new Map<number, number>([
	[1, 12],
	[2, 10],
	[3, 8],
	[4, 7],
	[5, 6],
	[6, 5],
	[7, 4],
	[8, 3],
	[9, 2],
	[10, 1],
]);

const getPointsByRank = (rank: number): number | undefined => {
	return rankingPoints.get(rank);
};

const SortableSong: React.FC<SortableItemProps> = ({ id, song, index }) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div style={style}>
			<div key={song.submissionId} className={`p-2 border rounded-lg transition-all hover:bg-muted/50 cursor-pointer border-border mb-1`}>
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2 touch-none">
						<Badge variant="secondary" className={`${getBadgeColor(index + 1)} w-7.5 font-bold`}>
							{getPointsByRank(index + 1) || formatOrdinal(index + 1)}
						</Badge>
					</div>
					<div className="min-w-10 max-w-10 h-10 rounded-sm overflow-hidden relative touch-none">
						<Image
							src={`https://flagcdn.com/w640/${song.flag?.toLowerCase()}.png`}
							fill
							alt={`${song.artistName}'s flag`}
							style={{ objectFit: 'cover', objectPosition: 'center' }}
							quality={80}
							sizes="640px"
						/>
					</div>
					<div className="flex-1 truncate touch-none">
						<h3 className="font-medium truncate no-select">{song.songTitle}</h3>
						<p className="text-sm text-muted-foreground truncate no-select">by {song.artistName}</p>
					</div>
					<div
						ref={setNodeRef}
						{...attributes}
						{...listeners}
						className="drag-handle cursor-grab p-1" // Unique class
					>
						<GripVertical />
					</div>
				</div>
			</div>
		</div>
	);
};

export default SortableSong;
