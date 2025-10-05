import { Spinner } from '../ui/spinner';

const Loading: React.FC = () => {
	return (
		<div className="p-6 flex gap-2">
			<Spinner className="size-6" />
			Loading...
		</div>
	);
};

export default Loading;
