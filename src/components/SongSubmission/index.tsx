'use client';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Check, ChevronDown, Flag, Keyboard, Music, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod/v3';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import SpotifySearch from '../SpotifySearch';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { v4 } from 'uuid';
import { AuthUser } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import countries from 'i18n-iso-countries';
import { submitSong } from '@/app/actions/submitSong';
import { fetchEdition } from '../EditionDetails';
import Image from 'next/image';
import countryList from '../../utils/countryList.json';
import { Spinner } from '../ui/spinner';

interface SongSubmissionProps {
	editionId: string;
	user: AuthUser;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

type CountryCode = string; // e.g., "us"
type CountryName = string; // e.g., "United States"
export interface CountryList {
	[key: CountryCode]: CountryName;
}

const SongSubmission: React.FC<SongSubmissionProps> = ({ editionId, user }) => {
	const [activeTab, setActiveTab] = useState<'spotify' | 'manual'>('spotify');
	const queryClient = useQueryClient();
	const router = useRouter();

	const [isPending, startTransition] = useTransition();

	const countries: CountryList = countryList as CountryList;

	const { data: edition, isLoading } = useQuery({
		queryKey: ['editionDetailsForSubmit', editionId],
		queryFn: () => fetchEdition(editionId),
	});

	useEffect(() => {
		if (!isLoading) {
			if (edition?.submissionList?.find((s) => s.userId === user.userId && s.rejected !== true) !== undefined) {
				router.push(`/edition/${editionId}`);
				toast.error('You have already submitted a song for this edition.');
			}
		}
	}, [isLoading]);

	const FormSchema = z
		.object({
			spotifyURI: z.string().optional(),
			songTitle: z.string(),
			artistName: z.string(),
			manualURL: z.string().optional(),
			flag: z.string().optional(),
			countryName: z.string().optional(),
		})
		.refine(
			(data) => {
				return data.flag && data.countryName;
			},
			{
				message: 'You must have a flag and country name.',
				path: ['flag'],
			}
		);

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
	});

	const { errors } = form.formState;

	const onSubmit = (data: z.infer<typeof FormSchema>) => {
		// 1. Manually create the FormData object
		const formData = new FormData();
		formData.append('submissionId', v4());
		formData.append('songTitle', data.songTitle);
		formData.append('artistName', data.artistName);
		formData.append('spotifyURI', (data.spotifyURI as string) || '');
		formData.append('manualURL', (data.manualURL as string) || '');
		formData.append('editionId', editionId);
		formData.append('flag', data.flag as string);
		formData.append('countryName', data.countryName as string);

		// 2. Wrap the Server Action call in startTransition
		startTransition(async () => {
			const result = await submitSong(formData);
			if (result.success) {
				// form.reset(); // Reset form on success
				// toast.success(`Your song "${data.songTitle}" was submitted successfully. Good luck!`);
				queryClient.removeQueries({ queryKey: ['editionDetails', editionId] });
				router.push(`/edition/${editionId}?song=${data.songTitle}`);
				// Handle success UI (e.g., toast, revalidation)
			} else {
				// Handle error UI
			}
		});
	};

	const [countryOpen, setCountryOpen] = useState(false);

	if (errors.spotifyURI) {
		toast.error(errors.spotifyURI.message, {
			id: 'spotifyError',
		});
	}

	if (errors.songTitle) {
		toast.error(errors.songTitle.message, {
			id: 'manualSongError',
		});
	}

	if (errors.flag) {
		toast.error(errors.flag.message, {
			id: 'flagError',
		});
	}

	return (
		<>
			<Card className="py-6 gap-2">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Music className="w-5 h-5" />
						Submit Your Song
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<Tabs
								value={activeTab}
								onValueChange={(value) => {
									setActiveTab(value as 'spotify' | 'manual');
								}}
							>
								<TabsList className="grid w-full grid-cols-2 mb-1">
									<TabsTrigger value="spotify">
										<Search className="w-4 h-4 mr-2" />
										Search Spotify
									</TabsTrigger>
									<TabsTrigger value="manual">
										<Keyboard className="w-4 h-4 mr-2" />
										Manual Entry
									</TabsTrigger>
								</TabsList>

								<TabsContent value="spotify" className="space-y-4">
									<FormField
										control={form.control}
										name="spotifyURI"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Search for your song</FormLabel>
												<FormControl>
													<SpotifySearch
														field={field}
														onChangeArtistName={(artist) => form.setValue('artistName', artist)}
														onChangeSongTitle={(song) => form.setValue('songTitle', song)}
													/>
												</FormControl>
												<FormDescription>Is your song not on Spotify? Use Manual Entry instead</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									></FormField>
								</TabsContent>

								<TabsContent value="manual" className="space-y-4">
									<FormField
										control={form.control}
										name="songTitle"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Song Title</FormLabel>
												<FormControl>
													<Input placeholder="Enter song title" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									></FormField>

									<FormField
										control={form.control}
										name="artistName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Artist Name</FormLabel>
												<FormControl>
													<Input placeholder="Enter artist name" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									></FormField>

									<FormField
										control={form.control}
										name="manualURL"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Link to your song</FormLabel>
												<FormControl>
													<Input placeholder="Enter a link to your song" {...field} />
												</FormControl>
												<FormDescription>Optional</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									></FormField>

									{form.getValues('artistName') && form.getValues('songTitle') && (
										<Card className="border-secondary/20 bg-secondary/5">
											<CardContent className="p-4">
												<div className="flex items-center gap-3">
													<div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
														<Music className="w-6 h-6 text-muted-foreground" />
													</div>
													<div>
														<h3 className="font-medium">{form.getValues('songTitle')}</h3>
														<p className="text-sm text-muted-foreground">by {form.getValues('artistName')}</p>
														<Badge variant="secondary" className="text-xs mt-1">
															Manual Entry
														</Badge>
													</div>
												</div>
											</CardContent>
										</Card>
									)}
								</TabsContent>
							</Tabs>

							<div className="space-y-4">
								<div>
									<FormField
										control={form.control}
										name="flag"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Flag</FormLabel>
												<FormControl>
													<Popover open={countryOpen} onOpenChange={setCountryOpen}>
														<PopoverTrigger asChild>
															<Button variant="outline" role="combobox" className="w-full justify-between">
																{field.value ? (
																	<span className="flex items-center gap-2">
																		<div className="w-5 h-5 rounded-sm overflow-hidden relative">
																			<Image
																				src={`https://flagcdn.com/w640/${field.value.toLowerCase()}.png`}
																				fill
																				alt={`${field.value}'s flag`}
																				style={{ objectFit: 'cover', objectPosition: 'center' }}
																				quality={80}
																				sizes="640px"
																			/>
																		</div>
																		<span>{countries[field.value]}</span>
																	</span>
																) : (
																	<span className="flex items-center gap-2">
																		<Flag className="w-4 h-4" />
																		Select flag...
																	</span>
																)}
																<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
															</Button>
														</PopoverTrigger>
														<PopoverContent className="w-full p-0">
															<Command>
																<CommandInput placeholder="Search countries..." />
																<CommandList>
																	<CommandEmpty>No country found.</CommandEmpty>
																	<CommandGroup>
																		{Object.entries(countries).map(([code, name]) => (
																			<CommandItem
																				key={code}
																				value={name}
																				onSelect={() => {
																					field.onChange(code);
																					form.setValue('countryName', name);
																					setCountryOpen(false);
																				}}
																			>
																				<div className="w-5 h-5 rounded-sm overflow-hidden relative">
																					<Image
																						src={`https://flagcdn.com/w640/${code.toLowerCase()}.png`}
																						fill
																						alt={`${name}'s flag`}
																						style={{ objectFit: 'cover', objectPosition: 'center' }}
																						quality={80}
																						sizes="640px"
																					/>
																				</div>
																				<span className="mr-2 text-lg">{name}</span>
																				<Check
																					className={`ml-auto h-4 w-4 ${form.getValues('flag') === code ? 'opacity-100' : 'opacity-0'}`}
																				/>
																			</CommandItem>
																		))}
																	</CommandGroup>
																</CommandList>
															</Command>
														</PopoverContent>
													</Popover>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									></FormField>
								</div>

								{form.getValues('flag') && (
									<FormField
										control={form.control}
										name="countryName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Country Name</FormLabel>
												<FormControl>
													<Input placeholder="" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									></FormField>
								)}
							</div>

							<Button type="submit" className="w-full">
								{isPending ? <Spinner /> : <Check className="w-4 h-4 mr-2" />}
								{isPending ? 'Submitting...' : 'Submit Song'}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</>
	);
};

export default SongSubmission;
