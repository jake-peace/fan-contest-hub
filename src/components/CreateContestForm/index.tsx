'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Music } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import z from 'zod/v3';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { v4 } from 'uuid';
import { useQueryClient } from '@tanstack/react-query';
import { startTransition } from 'react';
import { Button } from '../ui/button';
import { AuthUser } from 'aws-amplify/auth';
import { createContest } from '@/app/actions/createContest';

interface CreateContestProps {
	user: AuthUser;
}

const FormSchema = z.object({
	contestName: z.string().min(3, {
		message: 'Contest name must be at least 3 characters.',
	}),
	contestDescription: z.string().optional(),
});

const CreateContest: React.FC<CreateContestProps> = ({ user }) => {
	const router = useRouter();
	const queryClient = useQueryClient();

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			contestName: '',
			contestDescription: '',
		},
	});

	const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
		const formData = new FormData();
		formData.append('contestId', v4());
		formData.append('title', data.contestName);
		formData.append('description', data.contestDescription as string);
		formData.append('hostId', user.userId);

		// 2. Wrap the Server Action call in startTransition
		startTransition(async () => {
			const result = await createContest(formData);
			if (result.success) {
				// form.reset(); // Reset form on success
				// toast.success(`Your song "${data.songTitle}" was submitted successfully. Good luck!`);
				queryClient.invalidateQueries({ queryKey: ['userContestList'] });
				router.push(`/`);
				toast.success(`${data.contestName} was created successfully!`);
				// Handle success UI (e.g., toast, revalidation)
			} else {
				toast.error('Something went wrong creating your contest');
				// Handle error UI
			}
		});
	};

	return (
		<>
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
		</>
	);
};

export default CreateContest;
