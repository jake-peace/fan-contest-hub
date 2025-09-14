import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Check, ChevronDown, Flag, Music, Search, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod/v3";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import SpotifySearch from "../SpotifySearch";

interface SongSubmissionProps {
    onBack: () => void;
}

interface Country {
    name: string;
    flag: string;
    code: string;
}

const COUNTRIES: Country[] = [
    { name: 'United States', flag: '🇺🇸', code: 'US' },
    { name: 'United Kingdom', flag: '🇬🇧', code: 'GB' },
    { name: 'Canada', flag: '🇨🇦', code: 'CA' },
    { name: 'Australia', flag: '🇦🇺', code: 'AU' },
    { name: 'Germany', flag: '🇩🇪', code: 'DE' },
    { name: 'France', flag: '🇫🇷', code: 'FR' },
    { name: 'Italy', flag: '🇮🇹', code: 'IT' },
    { name: 'Spain', flag: '🇪🇸', code: 'ES' },
    { name: 'Netherlands', flag: '🇳🇱', code: 'NL' },
    { name: 'Sweden', flag: '🇸🇪', code: 'SE' },
    { name: 'Norway', flag: '🇳🇴', code: 'NO' },
    { name: 'Denmark', flag: '🇩🇰', code: 'DK' },
    { name: 'Finland', flag: '🇫🇮', code: 'FI' },
    { name: 'Ireland', flag: '🇮🇪', code: 'IE' },
    { name: 'Belgium', flag: '🇧🇪', code: 'BE' },
    { name: 'Switzerland', flag: '🇨🇭', code: 'CH' },
    { name: 'Austria', flag: '🇦🇹', code: 'AT' },
    { name: 'Portugal', flag: '🇵🇹', code: 'PT' },
    { name: 'Poland', flag: '🇵🇱', code: 'PL' },
    { name: 'Czech Republic', flag: '🇨🇿', code: 'CZ' },
    { name: 'Japan', flag: '🇯🇵', code: 'JP' },
    { name: 'South Korea', flag: '🇰🇷', code: 'KR' },
    { name: 'Brazil', flag: '🇧🇷', code: 'BR' },
    { name: 'Mexico', flag: '🇲🇽', code: 'MX' },
    { name: 'Argentina', flag: '🇦🇷', code: 'AR' },
    { name: 'India', flag: '🇮🇳', code: 'IN' },
    { name: 'China', flag: '🇨🇳', code: 'CN' },
    { name: 'Russia', flag: '🇷🇺', code: 'RU' },
];

const SongSubmission: React.FC<SongSubmissionProps> = ({ onBack }) => {

    const [activeTab, setActiveTab] = useState<'spotify' | 'manual'>('spotify');

    const FormSchema = z.object({
        spotifyURI: z.string().optional(),
        songTitle: z.string().optional(),
        artistName: z.string().optional(),
        manualURL: z.string().optional(),
        flag: z.string().optional(),
        countryName: z.string().optional(),
    })
        .refine(
            (data) => {
                if (activeTab === 'spotify') {
                    return data.spotifyURI;
                } else {
                    return !!data.artistName && !!data.songTitle;
                }
            },
            {
                message: 'You must either select a song from Spotify search or enter the song details manually.',
                path: activeTab === 'spotify' ? ['spotifyURI'] : ['songTitle'],
            }
        )
        .refine(
            (data) => {
                return data.flag && data.countryName;
            },
            {
                message: 'You must have a flag and country name.',
                path: ['flag'],
            }
        )

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    })

    const { errors } = form.formState;

    const handleSubmit = (data: z.infer<typeof FormSchema>) => {
        toast.success(`Your song "${data.songTitle}" was submitted successfully. Good luck!`)
        onBack();

        // onCreateContest({
        //     title,
        //     description,
        //     deadline,
        //     maxParticipants
        // });
    };

    const [countryOpen, setCountryOpen] = useState(false);

    const getCountryInfo = (flag: string): Country => {
        return COUNTRIES.filter((country) => country.flag === flag)[0];
    }

    console.log(errors)

    if (errors.spotifyURI) {
        toast.error(errors.spotifyURI.message, {
            id: 'spotifyError'
        });
    }

    if (errors.songTitle) {
        toast.error(errors.songTitle.message, {
            id: 'manualSongError'
        });
    }

    if (errors.flag) {
        toast.error(errors.flag.message, {
            id: 'flagError'
        });
    }

    // if (submitted) {
    //     return (
    //         <div className="min-h-screen bg-background p-4">
    //             <div className="max-w-md mx-auto">
    //                 <Card className="text-center">
    //                     <CardContent className="pt-6">
    //                         <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
    //                             <Check className="w-8 h-8 text-green-600" />
    //                         </div>
    //                         <h2 className="mb-2">Song Submitted!</h2>
    //                         <p className="text-muted-foreground mb-4">
    //                             Your song has been successfully submitted to the contest.
    //                         </p>
    //                         <Button onClick={onBack} className="w-full">
    //                             Back to Contest
    //                         </Button>
    //                     </CardContent>
    //                 </Card>
    //             </div>
    //         </div>
    //     );
    // }

    console.log(form.getValues('artistName'))

    return (
        <Card className="py-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Submit Your Song
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <Tabs value={activeTab} onValueChange={(value) => {
                            setActiveTab(value as 'spotify' | 'manual')
                            form.setValue('artistName', undefined);
                            form.setValue('songTitle', undefined);
                            form.setValue('spotifyURI', undefined);
                        }
                        }>
                            <TabsList className="grid w-full grid-cols-2 mb-1">
                                <TabsTrigger value="spotify">
                                    <Search className="w-4 h-4 mr-2" />
                                    Search Spotify
                                </TabsTrigger>
                                <TabsTrigger value="manual">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Manual Entry
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="spotify" className="space-y-4">
                                <FormField control={form.control} name='spotifyURI' render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Search for your song</FormLabel>
                                        <FormControl>
                                            <SpotifySearch
                                                field={field}
                                                onChangeArtistName={(artist) => form.setValue('artistName', artist)}
                                                onChangeSongTitle={(song) => form.setValue('songTitle', song)}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Is your song not on Spotify? Use Manual Entry instead
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}>
                                </FormField>
                            </TabsContent>

                            <TabsContent value="manual" className="space-y-4">
                                <FormField control={form.control} name='songTitle' render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Song Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter song title" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}>
                                </FormField>

                                <FormField control={form.control} name='artistName' render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Artist Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter artist name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}>
                                </FormField>

                                <FormField control={form.control} name='manualURL' render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Link to your song</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter a link to your song" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Optional
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}>
                                </FormField>

                                {form.getValues('artistName') && form.getValues('songTitle') && (
                                    <Card className="border-secondary/20 bg-secondary/5">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                                                    <Music className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium">{form.getValues('songTitle')}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        by {form.getValues("artistName")}
                                                    </p>
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
                                <FormField control={form.control} name='flag' render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Flag</FormLabel>
                                        <FormControl>
                                            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                    >
                                                        {field.value ? (
                                                            <span className="flex items-center gap-2">
                                                                <span className="text-lg">{getCountryInfo(field.value).flag}</span>
                                                                {getCountryInfo(field.value).name}
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
                                                                {COUNTRIES.map((country) => (
                                                                    <CommandItem
                                                                        key={country.code}
                                                                        value={country.name}
                                                                        onSelect={() => {
                                                                            field.onChange(country.flag);
                                                                            form.setValue("countryName", country.name);
                                                                            setCountryOpen(false);
                                                                        }}
                                                                    >
                                                                        <span className="mr-2 text-lg">{country.flag}</span>
                                                                        {country.name}
                                                                        <Check
                                                                            className={`ml-auto h-4 w-4 ${getCountryInfo(form.getValues('flag') as string)?.code === country.code
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                                }`}
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
                                )}>
                                </FormField>
                            </div>

                            {form.getValues('flag') && (
                                <FormField control={form.control} name='countryName' render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Country Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Leave blank to use &quot;{getCountryInfo(form.getValues('flag') as string).name}&quot;
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}>
                                </FormField>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                        >
                            <>
                                <Check className="w-4 h-4 mr-2" />
                                Submit Song
                            </>
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

export default SongSubmission;