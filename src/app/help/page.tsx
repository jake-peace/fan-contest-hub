import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { HelpCircle } from 'lucide-react';

const HelpPage: React.FC = () => {
	return (
		<Card className="p-4 px-2">
			<CardTitle className="flex self-center text-center gap-2">
				<HelpCircle />
				<div className="self-center">Help</div>
			</CardTitle>
			<CardContent>
				<div>
					Thanks for using Fan Contest Hub! This is still a work in progress so bugs are to be expected, and if you encounter any, please
					contact the developer.
				</div>
				<Separator className="m-2" />
				<div>
					The submissions open time/submission deadline/voting deadline has passed but the status hasn&apos;t updated? This can take up to
					15 minutes to process. Refresh the page and try again.
				</div>
			</CardContent>
		</Card>
	);
};

export default HelpPage;
