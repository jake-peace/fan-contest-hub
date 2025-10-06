'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { CalendarIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import z from 'zod/v3';
import { toast } from 'sonner';
import DateTimeHandler from '@/components/DateTimeHandler';
import { useRouter } from 'next/navigation';
import { v4 } from 'uuid';
import { useQueryClient } from '@tanstack/react-query';
import { startTransition } from 'react';
import { formatISO } from 'date-fns';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { AuthUser } from 'aws-amplify/auth';
import { createEdition } from '@/app/actions/createEdition';
import Header from '../Header';

const FormSchema = z.object({
	name: z.string().min(3, {
		message: 'Edition name must be at least 3 characters.',
	}),
	description: z.string().optional(),
	submissionsOpen: z.date(),
	submissionDeadline: z.date().min(new Date(), {
		message: 'Submission deadline must be in the future.',
	}),
	votingDeadline: z.date().min(new Date(), {
		message: 'Voting deadline must be in the future.',
	}),
	closeSubmissionType: z.string(),
	closeVotingType: z.string(),
});

interface CreateEditionProps {
	user: AuthUser;
	contestId: string;
}

const CreateEdition: React.FC<CreateEditionProps> = ({ contestId }) => {
	const router = useRouter();
	const queryClient = useQueryClient();

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			name: '',
			description: '',
			submissionsOpen: new Date(),
			submissionDeadline: new Date(),
			votingDeadline: new Date(),
			closeSubmissionType: 'specificDate',
			closeVotingType: 'specificDate',
		},
	});

	const submissionRadio = form.watch('closeSubmissionType');
	const votingRadio = form.watch('closeVotingType');

	const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
		const formData = new FormData();
		formData.append('editionId', v4());
		formData.append('contestId', contestId);
		formData.append('name', data.name);
		formData.append('description', data.description as string);
		formData.append('submissionsOpen', formatISO(data.submissionsOpen));
		formData.append('submissionDeadline', formatISO(data.submissionDeadline));
		formData.append('votingDeadline', formatISO(data.votingDeadline));
		formData.append('closeSubmissionType', data.closeSubmissionType);
		formData.append('closeVotingType', data.closeVotingType);

		startTransition(async () => {
			const result = await createEdition(formData);
			if (result.success) {
				queryClient.invalidateQueries({ queryKey: ['contestEditionList', contestId] });
				router.push(`/contest/${contestId}`);
				toast.success(`${data.name} was created successfully!`);
			} else {
				toast.error('Something went wrong creating the edition');
			}
		});
	};

	return (
		<>
			<Header />

			<Card className="py-6">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">New Edition</CardTitle>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Title</FormLabel>
										<FormControl>
											<Input placeholder="Fan Contest Edition #4" {...field} />
										</FormControl>
										<FormDescription>The name of the Edition</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							></FormField>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea placeholder="e.g. Submit the best song in your On Repeat playlist..." rows={3} {...field} />
										</FormControl>
										<FormDescription>Describe your edition, give some rules etc...</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							></FormField>

							<Separator />

							<FormField
								control={form.control}
								name="submissionsOpen"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											<CalendarIcon className="w-4 h-4" />
											Submissions open from
										</FormLabel>
										<FormControl>
											<DateTimeHandler disabled={false} value={field.value} onChange={field.onChange} />
										</FormControl>
										<FormDescription>Submissions will open at this date and time. You can change this later.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Separator />

							<FormField
								control={form.control}
								name="closeSubmissionType"
								render={({ field }) => (
									<FormItem className="space-y-3">
										<FormLabel>Close submissions after...</FormLabel>
										<FormControl>
											<RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col">
												<FormItem className="flex items-center gap-3">
													<FormControl>
														<RadioGroupItem value="specificDate" />
													</FormControl>
													<FormLabel className="font-normal">A specific date</FormLabel>
												</FormItem>
												<FormItem className="flex items-center gap-3">
													<FormControl>
														<RadioGroupItem value="allEntries" />
													</FormControl>
													<FormLabel className="font-normal">All entries are in</FormLabel>
												</FormItem>
												<FormItem className="flex items-center gap-3">
													<FormControl>
														<RadioGroupItem value="manually" />
													</FormControl>
													<FormLabel className="font-normal">{`I'll close submissions myself`}</FormLabel>
												</FormItem>
											</RadioGroup>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Collapsible open={submissionRadio === 'specificDate' ? true : false}>
								<CollapsibleContent>
									<FormField
										control={form.control}
										name="submissionDeadline"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													<CalendarIcon className="w-4 h-4" />
													Submission Deadline
												</FormLabel>
												<FormControl>
													<DateTimeHandler disabled={false} value={field.value} onChange={field.onChange} />
												</FormControl>
												<FormDescription>{`Set a deadline for participants to submit their entries. You can change this later.`}</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CollapsibleContent>
							</Collapsible>

							<Separator />

							<FormField
								control={form.control}
								name="closeVotingType"
								render={({ field }) => (
									<FormItem className="space-y-3">
										<FormLabel>Close voting after...</FormLabel>
										<FormControl>
											<RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col">
												<FormItem className="flex items-center gap-3">
													<FormControl>
														<RadioGroupItem value="specificDate" />
													</FormControl>
													<FormLabel className="font-normal">A specific date</FormLabel>
												</FormItem>
												<FormItem className="flex items-center gap-3">
													<FormControl>
														<RadioGroupItem value="allEntries" />
													</FormControl>
													<FormLabel className="font-normal">All votes are in</FormLabel>
												</FormItem>
												<FormItem className="flex items-center gap-3">
													<FormControl>
														<RadioGroupItem value="manually" />
													</FormControl>
													<FormLabel className="font-normal">{`I'll close voting myself`}</FormLabel>
												</FormItem>
											</RadioGroup>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Collapsible open={votingRadio === 'specificDate'}>
								<CollapsibleContent>
									<FormField
										control={form.control}
										name="votingDeadline"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													<CalendarIcon className="w-4 h-4" />
													Voting Deadline
												</FormLabel>
												<FormControl>
													<DateTimeHandler disabled={false} value={field.value} onChange={field.onChange} />
												</FormControl>
												<FormDescription>{`Set a deadline for participants to vote. You can change this later.`}</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</CollapsibleContent>
							</Collapsible>

							<Button type="submit" className="w-full">
								Create Edition
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</>
	);
};

export default CreateEdition;
