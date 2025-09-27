'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../../components/ui/button';
import { Music } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import z from 'zod/v3';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createContest } from '@/utils/APIUtils';
import { useAppSelector } from '@/app/store/hooks';
import { useAmplifyClient } from '@/app/amplifyConfig';
import AuthBarrier from '@/components/AuthBarrier';
import { v4 } from 'uuid';
import { useQueryClient } from '@tanstack/react-query';

const FormSchema = z.object({
	contestName: z.string().min(3, {
		message: 'Contest name must be at least 3 characters.',
	}),
	contestDescription: z.string().optional(),
});

const CreateContest: React.FC = () => {
	const router = useRouter();
	const client = useAmplifyClient();
	const currentUser = useAppSelector((state) => state.user.user.id);
	const queryClient = useQueryClient();

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			contestName: '',
			contestDescription: '',
		},
	});

	const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
		const newContestId = v4();
		const { errors, createdContest } = await createContest(client, {
			contestId: newContestId,
			title: data.contestName,
			description: data.contestDescription,
			hostId: currentUser as string,
		});

		if (!errors) {
			toast.success(`${createdContest?.name} created successfully!`, {
				action: {
					label: 'View contest',
					onClick: () => console.log('Action!'),
				},
			});
			queryClient.invalidateQueries({ queryKey: ['userContestList'] });
			router.push('/');
		} else {
			toast.error(`Something went wrong: ${JSON.stringify(errors)}`);
		}
	};

	return (
		<AuthBarrier>
			<div className="min-h-screen bg-background p-4">
				<div className="max-w-md mx-auto">
					<Button variant="ghost" onClick={() => router.back()} className="mb-4">
						← Back
					</Button>

					<Card className="py-6">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Music className="w-5 h-5" />
								Create a new Fan Contest
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Form {...form}>
								<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
									<FormField
										control={form.control}
										name="contestName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Title</FormLabel>
												<FormControl>
													<Input placeholder="My Fan Contest" {...field} />
												</FormControl>
												<FormDescription>The name of your Fan Contest</FormDescription>
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
													<Textarea placeholder="e.g. Submit the best song in your On Repeat playlist..." rows={3} {...field} />
												</FormControl>
												<FormDescription>Describe your contest, give some rules etc...</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									></FormField>

									<Button type="submit" className="w-full">
										Create Contest
									</Button>
								</form>
							</Form>
						</CardContent>
					</Card>
				</div>
			</div>
		</AuthBarrier>
	);
};

export default CreateContest;
