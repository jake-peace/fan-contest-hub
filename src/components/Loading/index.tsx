import { Spinner } from '../ui/spinner';

const Loading: React.FC = () => {
	return (
		<div className="min-h-screen bg-background p-4">
			<div className={'max-w-md mx-auto'}>
				<div className="p-6 flex gap-2">
					<Spinner className="size-6" />
					Loading...
				</div>
			</div>
		</div>
	);
};

export default Loading;
