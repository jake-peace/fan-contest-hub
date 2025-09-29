import { Search, Check } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';
import { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { ControllerRenderProps } from 'react-hook-form';
import { toast } from 'sonner';
import { useAmplifyClient } from '@/app/amplifyConfig';
import { Skeleton } from '../ui/skeleton';

interface SpotifyTrack {
	id: string;
	name: string;
	artists: string[];
	album: {
		name: string;
		images: string[];
	};
	external_urls: {
		spotify: string;
	};
}

// Mock Spotify search results
// const MOCK_SPOTIFY_RESULTS: SpotifyTrack[] = [
// 	{
// 		id: '4iV5W9uYEdYUVa79Axb7Rh',
// 		name: 'Watermelon Sugar',
// 		artists: [{ name: 'Harry Styles' }],
// 		album: {
// 			name: 'Fine Line',
// 			images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center' }],
// 		},
// 		external_urls: {
// 			spotify: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
// 		},
// 	},
// 	{
// 		id: '7qiZfU4dY1lWllzX7mPBI3',
// 		name: 'Shape of You',
// 		artists: [{ name: 'Ed Sheeran' }],
// 		album: {
// 			name: '÷ (Divide)',
// 			images: [{ url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop&crop=center' }],
// 		},
// 		external_urls: {
// 			spotify: 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3',
// 		},
// 	},
// 	{
// 		id: '1mWdTewIgB3gtBM3TOSFhB',
// 		name: 'Blinding Lights',
// 		artists: [{ name: 'The Weeknd' }],
// 		album: {
// 			name: 'After Hours',
// 			images: [{ url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop&crop=center' }],
// 		},
// 		external_urls: {
// 			spotify: 'https://open.spotify.com/track/1mWdTewIgB3gtBM3TOSFhB',
// 		},
// 	},
// ];

interface SpotifySearchProps {
	field: ControllerRenderProps<
		{
			songTitle: string;
			artistName: string;
			flag?: string | undefined;
			countryName?: string | undefined;
			spotifyURI?: string | undefined;
			manualURL?: string | undefined;
		},
		'spotifyURI'
	>;
	onChangeSongTitle: (song: string) => void;
	onChangeArtistName: (artist: string) => void;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function useDebounce(value: string, delay: number) {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		// Set a timeout to update the debounced value after the delay
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		// This cleanup function is crucial. If the 'value' changes 
		// (i.e., the user types another character) before the timeout executes, 
		// the previous timeout is cleared, resetting the delay.
		return () => {
			clearTimeout(handler);
		};
	}, 
	// Rerun the effect only if the input value or the delay changes
	[value, delay] 
	);

	return debouncedValue;
}

const SpotifySearch: React.FC<SpotifySearchProps> = ({ field, onChangeArtistName, onChangeSongTitle }) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
	const [accessToken, setAccessToken] = useState('');
	const [isSearching, setIsSearching] = useState(false);
	const client = useAmplifyClient();
	const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);

	const debouncedSearchTerm = useDebounce(searchQuery, 500); 

	useEffect(() => {
		async function searchSpotify() {
			if(debouncedSearchTerm) {
				if (debouncedSearchTerm.trim() === '') {
					setSearchResults([]);
					return;
				}

				setIsSearching(true);
				setSearchResults([]);

				const spotifyResults = await fetch(`https://api.spotify.com/v1/search?q=${searchQuery.replace(/ /g, '+')}&type=track&market=GB`, {
					headers: {
						'Authorization': `Bearer ${accessToken}`,
					},
				});

				const spotifyResultsData = await spotifyResults.json();
				const convertToSearchResults: SpotifyTrack[] = spotifyResultsData.tracks.items.map((item: any) => {
					return {
						id: item.id,
						name: item.name,
						artists: item.artists.map((a: any) => a.name),
						album: {
							name: item.album.name,
							images: item.album.images.map((i: any) => i.url),
						},
						external_urls: {
							spotify: item.external_urls.spotify
						}
					};
				})
				console.log(convertToSearchResults);
				setSearchResults(convertToSearchResults);
			} else {
				setSearchResults([]);
				setIsSearching(false);
			}
		}

		searchSpotify();
	}, [debouncedSearchTerm])

	useEffect(() => {
		async function fetchAccessToken() {
			const response = await client.queries.spotifyApi();

			const bodyMatch = (response.data as string).split(',')

            if (bodyMatch && bodyMatch[1]) {
                const accessTokenString = bodyMatch[1].split('=')[1];
                
                if (accessTokenString) {
                    console.log("Successfully extracted access token string.");
                    setAccessToken(accessTokenString);
                }

			}
		}

		fetchAccessToken();
	}, []);

	const handleSelectTrack = (track: SpotifyTrack) => {
		field.onChange(track.id);
		onChangeArtistName(track.artists[0]);
		onChangeSongTitle(track.name);
		setSelectedTrack(track);
		setSearchResults([]);
	};

	const getTrackCardContent = (trackId: string) => {
		return (
			selectedTrack && <div className="flex items-center gap-3">
				<Image width={500} height={500} src={selectedTrack.album.images[0]} alt={selectedTrack.album.name} className="w-12 h-12 rounded object-cover" />
				<div>
					<h3 className="font-medium">{selectedTrack.name}</h3>
					<p className="text-sm text-muted-foreground">by {selectedTrack.artists[0]}</p>
					<Badge variant="outline" className="text-xs mt-1 bg-[#1DB954]">
						From Spotify
					</Badge>
				</div>
			</div>
		);
	};

	return (
		<>
			<div className="relative">
				<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
				<Input
					id="spotify-search"
					placeholder="Song title or artist name..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-10"
				/>
			</div>

			{searchResults.length > 0 && (
				<ScrollArea className="h-64 border rounded-lg w-100">
					<div className="p-2">
						{searchResults.map((track) => (
							<div
								key={track.id}
								className={`flex items-center gap-3 p-2 cursor-pointer rounded-lg transition-colors w-100 ${
									field.value === track.id ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
								}`}
								onClick={() => handleSelectTrack(track)}
							>
								{track.album.images[0] && <Image
									width={500}
									height={500}
									src={track.album.images[0]}
									alt={track.album.name}
									className="w-12 h-12 rounded object-cover"
								/>}
								<div className="flex-1 min-w-0">
									<p className="font-medium truncate">{track.name}</p>
									<p className="text-sm text-muted-foreground truncate">
										{track.artists[0]} • {track.album.name}
									</p>
								</div>
								{field.value === track.id && <Check className="w-5 h-5 text-primary" />}
							</div>
						))}
					</div>
				</ScrollArea>
			)}

			{field.value && (
				<Card className="border-primary/20 bg-primary/5">
					<CardContent className="p-4">{getTrackCardContent(field.value)}</CardContent>
				</Card>
			)}
		</>
	);
};

export default SpotifySearch;
