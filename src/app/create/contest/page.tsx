'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from '../../../components/ui/button';
import { CalendarIcon, Music } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import z from "zod/v3";
import { toast } from "sonner";
import DateTimeHandler from "@/components/DateTimeHandler";
import { useRouter } from "next/navigation";

interface CreateContestProps {
    onCreateContest: (contest: {
        title: string;
        description: string;
        deadline: Date;
        maxParticipants: number;
    }) => void;
    onBack: () => void;
}

const FormSchema = z.object({
    contestName: z.string().min(3, {
        message: "Contest name must be at least 3 characters.",
    }),
    contestDescription: z.string().optional(),
    contestDeadline: z.date().min(new Date(), {
        message: 'Submission deadline must be in the future.'
    }),
})

const CreateContest: React.FC<CreateContestProps> = () => {

    const router = useRouter()

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            contestName: '',
            contestDescription: '',
            contestDeadline: new Date(),
        },
    })

    const handleSubmit = (data: z.infer<typeof FormSchema>) => {
        toast.success(`${data.contestName} created successfully!`, {
            action: {
                label: 'Go to contest',
                onClick: () => console.log('Action!'),
                // onClick: () => router.push(`/contest/${contestId}`)
            }
        })

        // onCreateContest({
        //     title,
        //     description,
        //     deadline,
        //     maxParticipants
        // });
    };

    return (
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
                            <Music className="w-5 h-5" />
                            Create a new Fan Contest
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                <FormField control={form.control} name='contestName' render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="My Fan Contest" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The name of your Fan Contest
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}>
                                </FormField>

                                <FormField control={form.control} name='contestDescription' render={({ field }) => (
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
                                            Describe your contest, give some rules etc...
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}>
                                </FormField>

                                <FormField control={form.control} name='contestDeadline' render={({ field }) => (
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
                                            Deadline for submitting entries to your contest
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}>
                                </FormField>

                                {/* <div>
                                    <Label htmlFor="participants" className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Max Participants
                                    </Label>
                                    <Input
                                        id="participants"
                                        type="number"
                                        value={maxParticipants}
                                        onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                                        min="2"
                                        max="50"
                                    />
                                </div> */}

                                <Button type="submit" className="w-full">
                                    Create Contest
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default CreateContest;
