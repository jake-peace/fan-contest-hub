'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from '../../../components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import z from "zod/v3";
import { toast } from "sonner";
import DateTimeHandler from "@/components/DateTimeHandler";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/store/hooks";
import { useAmplifyClient } from "@/app/amplifyConfig";
import AuthBarrier from "@/components/AuthBarrier";
import { v4 } from "uuid";
import { useQueryClient } from "@tanstack/react-query";
import { createEdition } from "@/utils/APIUtils";

const FormSchema = z.object({
    name: z.string().min(3, {
        message: "Edition name must be at least 3 characters.",
    }),
    description: z.string().optional(),
    submissionsOpen: z.date(),
    submissionDeadline: z.date().min(new Date(), {
        message: 'Submission deadline must be in the future.'
    }),
    votingDeadline: z.date().min(new Date(), {
        message: 'Voting deadline must be in the future.'
    }),
})

const CreateEdition: React.FC = () => {
    const router = useRouter()
    const client = useAmplifyClient();
    const contestId = useAppSelector((state) => state.contest.contestId);
    const queryClient = useQueryClient();

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: '',
            description: '',
            submissionsOpen: new Date(),
            submissionDeadline: new Date(),
            votingDeadline: new Date(),
        },
    })

    const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
        const newEditionId = v4();
        const { errors, createdEdition } = await createEdition(client, { id: newEditionId, contestId: contestId as string, name: data.name, description: data.description as string, })

        if (!errors) {
            toast.success(`${createdEdition?.name} created successfully!`)
            queryClient.invalidateQueries({ queryKey: ['editionListQuery'] })
            router.push('/contest');
        } else {
            toast.error(`Something went wrong: ${JSON.stringify(errors)}`)
        }
    };

    return (
        <AuthBarrier>
            <div className="min-h-screen bg-background p-4">
                <div className="max-w-md mx-auto">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4"
                    >
                        ← Back
                    </Button>

                    <Card className='py-6'>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                New Edition
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                    <FormField control={form.control} name='name' render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Fan Contest Edition #4" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                The name of the Edition
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}>
                                    </FormField>

                                    <FormField control={form.control} name='description' render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="e.g. Submit the best song in your On Repeat playlist..."
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Describe your edition, give some rules etc...
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}>
                                    </FormField>

                                    <FormField control={form.control} name='submissionsOpen' render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                <CalendarIcon className="w-4 h-4" />
                                                Submissions open from
                                            </FormLabel>
                                            <FormControl>
                                                <DateTimeHandler
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Submissions will open at this date and time.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}>
                                    </FormField>

                                    <FormField control={form.control} name='submissionDeadline' render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                <CalendarIcon className="w-4 h-4" />
                                                Submission Deadline
                                            </FormLabel>
                                            <FormControl>
                                                <DateTimeHandler
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {`(Optional) Deadline for submitting entries to the edition`}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}>
                                    </FormField>
                                    <FormField control={form.control} name='votingDeadline' render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                <CalendarIcon className="w-4 h-4" />
                                                Voting Deadline
                                            </FormLabel>
                                            <FormControl>
                                                <DateTimeHandler
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {`(Optional) Deadline for participants to vote`}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}>
                                    </FormField>

                                    <Button type="submit" className="w-full">
                                        Create Edition
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthBarrier>
    );
}

export default CreateEdition;
