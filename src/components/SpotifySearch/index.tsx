import { Search, Check } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import Image from "next/image";
import { ScrollArea } from "../ui/scroll-area";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { ControllerRenderProps } from "react-hook-form";

interface SpotifyTrack {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
        name: string;
        images: { url: string }[];
    };
    external_urls: {
        spotify: string;
    };
}

// Mock Spotify search results
const MOCK_SPOTIFY_RESULTS: SpotifyTrack[] = [
    {
        id: '4iV5W9uYEdYUVa79Axb7Rh',
        name: 'Watermelon Sugar',
        artists: [{ name: 'Harry Styles' }],
        album: {
            name: 'Fine Line',
            images: [{ url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center' }]
        },
        external_urls: {
            spotify: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh'
        }
    },
    {
        id: '7qiZfU4dY1lWllzX7mPBI3',
        name: 'Shape of You',
        artists: [{ name: 'Ed Sheeran' }],
        album: {
            name: '÷ (Divide)',
            images: [{ url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop&crop=center' }]
        },
        external_urls: {
            spotify: 'https://open.spotify.com/track/7qiZfU4dY1lWllzX7mPBI3'
        }
    },
    {
        id: '1mWdTewIgB3gtBM3TOSFhB',
        name: 'Blinding Lights',
        artists: [{ name: 'The Weeknd' }],
        album: {
            name: 'After Hours',
            images: [{ url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop&crop=center' }]
        },
        external_urls: {
            spotify: 'https://open.spotify.com/track/1mWdTewIgB3gtBM3TOSFhB'
        }
    }
];

interface SpotifySearchProps {
    field: ControllerRenderProps;
    onChangeSongTitle: (song: string) => void;
    onChangeArtistName: (artist: string) => void;
}

const SpotifySearch: React.FC<SpotifySearchProps> = ({ field, onChangeArtistName, onChangeSongTitle }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
    // const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);

    const handleSpotifySearch = (query: string) => {
        setSearchQuery(query);
        if (query.length > 2) {
            // Mock search - filter results based on query
            const filtered = MOCK_SPOTIFY_RESULTS.filter(track =>
                track.name.toLowerCase().includes(query.toLowerCase()) ||
                track.artists[0].name.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(filtered);
        } else {
            setSearchResults([]);
        }
    };

    const handleSelectTrack = (track: SpotifyTrack) => {
        field.onChange(track.id);
        onChangeArtistName(track.artists[0].name);
        onChangeSongTitle(track.name);
    }

    const getTrackCardContent = (trackId: string) => {
        const track = MOCK_SPOTIFY_RESULTS.filter((track) => track.id === trackId)[0];

        return (
            <div className="flex items-center gap-3">
                <Image
                    width={500}
                    height={500}
                    src={track.album.images[0].url}
                    alt={track.album.name}
                    className="w-12 h-12 rounded object-cover"
                />
                <div>
                    <h3 className="font-medium">{track.name}</h3>
                    <p className="text-sm text-muted-foreground">
                        by {track.artists[0].name}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1 bg-[#1DB954]">
                        From Spotify
                    </Badge>
                </div>
            </div>
        )
    };

    return (
        <>
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    id="spotify-search"
                    placeholder="Song title or artist name..."
                    value={searchQuery}
                    onChange={(e) => handleSpotifySearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {searchResults.length > 0 && (
                <ScrollArea className="h-64 border rounded-lg">
                    <div className="p-2">
                        {searchResults.map((track) => (
                            <div
                                key={track.id}
                                className={`flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-colors ${field.value === track.id
                                    ? 'bg-primary/10 border border-primary'
                                    : 'hover:bg-muted'
                                    }`}
                                onClick={() => handleSelectTrack(track)}
                            >
                                <Image
                                    width={500}
                                    height={500}
                                    src={track.album.images[0]?.url}
                                    alt={track.album.name}
                                    className="w-12 h-12 rounded object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{track.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {track.artists[0].name} • {track.album.name}
                                    </p>
                                </div>
                                {field.value === track.id && (
                                    <Check className="w-5 h-5 text-primary" />
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )
            }

            {field.value && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                        {getTrackCardContent(field.value)}
                    </CardContent>
                </Card>
            )
            }
        </>
    );
};

export default SpotifySearch;
