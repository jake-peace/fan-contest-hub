import Loading from '@/components/Loading';

export default function loading() {
	return (
		<div className="min-h-screen bg-background p-4">
			<div className={'max-w-md mx-auto'}>
				<Loading />
			</div>
		</div>
	);
}
