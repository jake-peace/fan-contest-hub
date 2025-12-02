'use client';

import { AuthUser } from 'aws-amplify/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { fetchContest } from '../ContestCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Save, Settings } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod/v4';
import { Spinner } from '../ui/spinner';
import { editContest } from '@/app/actions/editContest';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
// import { deleteContest } from '@/app/actions/deleteContest';
// import {
// 	AlertDialog,
// 	AlertDialogAction,
// 	AlertDialogCancel,
// 	AlertDialogContent,
// 	AlertDialogDescription,
// 	AlertDialogFooter,
// 	AlertDialogHeader,
// 	AlertDialogTitle,
// 	AlertDialogTrigger,
// } from '../ui/alert-dialog';

interface ContestSettingsProps {
	contestId: string;
	user: AuthUser;
}

const FormSchema = z.object({
	contestName: z.string().min(3, {
		message: 'Contest name must be at least 3 characters.',
	}),
	contestDescription: z.string().optional(),
});

const ContestSettings: React.FC<ContestSettingsProps> = ({ contestId, user }) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isPending, startTransition] = useTransition();
	// const [isDeleting, startDelete] = useTransition();

	const { data: contest, isFetched } = useQuery({
		queryKey: ['contestDetails', contestId],
		queryFn: () => fetchContest(contestId),
	});

	useEffect(() => {
		if (isFetched && contest?.hostId !== user.userId && process.env.NODE_ENV !== 'development') {
			router.push(`/contest/${contestId}`);
			toast.error('You are not authorized to access this page.');
		}
		if (isFetched && !contest) {
			router.push(`/contest/${contestId}`);
			toast.error('There was an error fetching contest data.');
		}
		if (isFetched && contest) {
			form.setValue('contestName', contest.name);
			form.setValue('contestDescription', contest.description as string);
		}
	}, []);

	const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
		const formData = new FormData();
		formData.append('title', data.contestName);
		formData.append('description', data.contestDescription as string);
		formData.append('contestId', contestId);

		startTransition(async () => {
			const result = await editContest(formData);
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ['contestDetails', contestId] });
				router.push(`/contest/${contestId}`);
				toast.success(`Changes to ${data.contestName} were made successfully!`);
			} else {
				toast.error('Something went wrong saving changes to your contest');
			}
		});
	};

	// const handleDelete = () => {
	// 	startDelete(async () => {
	// 		const result = await deleteContest(contestId);
	// 		if (result.success) {
	// 			queryClient.invalidateQueries({ queryKey: ['contestDetails', contestId] });
	// 			router.push(`/contest`);
	// 			toast.success(`${contest?.name} deleted successfully!`);
	// 		} else {
	// 			toast.error('Something went wrong deleting your contest');
	// 		}
	// 	});
	// };

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			contestName: '',
			contestDescription: '',
		},
	});

	return (
		<Card className="py-6 space-y-2">
			<CardHeader>
				<CardTitle className="flex gap-2 items-center">
					<Settings />
					{`Settings for ${contest?.name} Contest`}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<Accordion type="single" collapsible>
							<AccordionItem value="1">
								<AccordionTrigger>General Settings</AccordionTrigger>
								<AccordionContent className="space-y-4">
									<FormField
										control={form.control}
										name="contestName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Title</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									></FormField>
									<FormField
										control={form.control}
										name="contestDescription"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Description</FormLabel>
												<FormControl>
													<Textarea rows={3} {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									></FormField>
									{/* <AlertDialog>
										<AlertDialogTrigger
											type="button"
											className="flex gap-2 items-center w-full border p-1.5 justify-center rounded-md bg-(--destructive) border-(--destructive) font-semibold"
										>
											{isDeleting ? <Spinner /> : <Trash className="w-4 h-4" />}
											{isDeleting ? 'Deleting...' : 'Delete Contest'}
										</AlertDialogTrigger>
										<AlertDialogContent className="">
											<AlertDialogHeader>
												<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
												<AlertDialogDescription>
													This action cannot be undone. This will permanently delete the contest, the editions, and all submissions.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog> */}
								</AccordionContent>
							</AccordionItem>
							{/* <AccordionItem value="2">
								<AccordionTrigger>Participants</AccordionTrigger>
								<AccordionContent>General settings</AccordionContent>
							</AccordionItem> */}
						</Accordion>
						<Button className="w-full" type="submit" disabled={isPending}>
							{isPending ? <Spinner /> : <Save />}
							{isPending ? 'Saving...' : 'Save Changes'}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};

export default ContestSettings;
