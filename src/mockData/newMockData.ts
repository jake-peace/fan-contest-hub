import { Contest, User } from "@/types/Contest";

export type EditionPhase = 'UPCOMING' | 'SUBMISSION' | 'VOTING' | 'RESULTS' | 'COMPLETE'

/**
 * Interfaces for the contest application data structures.
 */

export const users: User[] = [
  {
    id: "user_alpha",
    name: "Alex Parker",
    email: "alex.parker@example.com"
  },
  {
    id: "user_beta",
    name: "Bella Stevens",
    email: "bella.stevens@example.com"
  },
  {
    id: "user_gamma",
    name: "Chris Williams",
    email: "chris.williams@example.com"
  },
  {
    id: "user_epsilon",
    name: "Emily Jones",
    email: "emily.jones@example.com"
  },
  {
    id: "user_zeta",
    name: "Zane Davis",
    email: "zane.davis@example.com"
  },
  {
    id: "user_eta",
    name: "Hannah Brown",
    email: "hannah.brown@example.com"
  },
  {
    id: "user_iota",
    name: "Ian Smith",
    email: "ian.smith@example.com"
  },
  {
    id: "user_kappa",
    name: "Karen Miller",
    email: "karen.miller@example.com"
  },
  {
    id: "user_lambda",
    name: "Liam White",
    email: "liam.white@example.com"
  },
  {
    id: "user_mu",
    name: "Mia Hall",
    email: "mia.hall@example.com"
  },
  {
    id: "user_nu",
    name: "Noah Green",
    email: "noah.green@example.com"
  },
  {
    id: "user_xi",
    name: "Xavier Collins",
    email: "xavier.collins@example.com"
  },
  {
    id: "user_omicron",
    name: "Olivia Scott",
    email: "olivia.scott@example.com"
  },
  {
    id: "user_pi",
    name: "Peter Lee",
    email: "peter.lee@example.com"
  }
];

export const mockContests: Contest[] = [
  {
    "id": "contest_1",
    "title": "Global Music Battle",
    "description": "A worldwide competition to find the best song submissions from different countries.",
    "participants": [
      {
        "id": "user_alpha",
        "hasSubmitted": true,
        "hasVoted": true
      },
      {
        "id": "user_beta",
        "hasSubmitted": true,
        "hasVoted": true
      },
      {
        "id": "user_gamma",
        "hasSubmitted": false,
        "hasVoted": false
      }
    ],
    "joinCode": "GMB2025",
    "hostId": "host_user_1",
    "editions": [
      {
        "id": "edition_1_2024",
        "title": "2024 Summer Edition",
        "optedOutParticipants": [
            "user_gamma"
        ],
        "submissions": [
          {
            "id": "sub_1",
            "participantId": "user_alpha",
            "title": "Chasing the Sun",
            "artist": "Nova Echo",
            "country": "United States",
            "flagEmoji": "🇺🇸",
            "spotifyURI": "spotify:track:12345",
            "points": 150
          },
          {
            "id": "sub_2",
            "participantId": "user_beta",
            "title": "Midnight Serenade",
            "artist": "Luna Bloom",
            "country": "Canada",
            "flagEmoji": "🇨🇦",
            "spotifyURI": "spotify:track:67890",
            "points": 125
          }
        ],
        "submissionDeadline": 1721529540,
        "votingDeadline": 1721961540,
        startDate: 1721525200,
        "phase": "COMPLETE"
      }
    ]
  },
  {
    "id": "contest_2",
    "title": "Songwriter's Showcase",
    "description": "A private contest for aspiring songwriters to share their original work.",
    "participants": [
      {
        "id": "user_epsilon",
        "hasSubmitted": true,
        "hasVoted": true
      },
      {
        "id": "user_zeta",
        "hasSubmitted": true,
        "hasVoted": true
      },
      {
        "id": "user_eta",
        "hasSubmitted": true,
        "hasVoted": true
      }
    ],
    "joinCode": "SS2024",
    "hostId": "host_user_2",
    "editions": [
      {
        "id": "edition_2_2024_Q4",
        "title": "Q4 2024 Edition",
        "optedOutParticipants": [],
        "submissions": [
          {
            "id": "sub_3",
            "participantId": "user_epsilon",
            "title": "The City Lights",
            "artist": "Emma Rose",
            "country": "United Kingdom",
            "flagEmoji": "🇬🇧",
            "points": 95
          },
          {
            "id": "sub_4",
            "participantId": "user_zeta",
            "title": "Echoes in the Rain",
            "artist": "Liam Scott",
            "country": "Australia",
            "flagEmoji": "🇦🇺",
            "spotifyURI": "spotify:track:112233",
            "points": 110
          },
          {
            "id": "sub_5",
            "participantId": "user_eta",
            "title": "Whispers of the Wind",
            "artist": "Anya Sharma",
            "country": "India",
            "flagEmoji": "🇮🇳",
            "points": 105
          }
        ],
        "submissionDeadline": 1731715140,
        "votingDeadline": 1732147140,
        startDate: 1731711140,
        "phase": "RESULTS"
      }
    ]
  },
  {
    "id": "contest_3",
    "title": "Global Film Festival",
    "description": "An annual festival for independent filmmakers to showcase their short films.",
    "participants": [
      {
        "id": "user_iota",
        "hasSubmitted": true,
        "hasVoted": true
      },
      {
        "id": "user_kappa",
        "hasSubmitted": true,
        "hasVoted": true
      },
      {
        "id": "user_lambda",
        "hasSubmitted": true,
        "hasVoted": false
      },
      {
        "id": "user_mu",
        "hasSubmitted": false,
        "hasVoted": false
      }
    ],
    "joinCode": "GFF2025",
    "hostId": "host_user_3",
    "editions": [
      {
        "id": "edition_3_2024_fall",
        "title": "2024 Fall Showcase",
        "optedOutParticipants": [
            "user_mu",
        ],
        "submissions": [
          {
            "id": "sub_6",
            "participantId": "user_iota",
            "title": "Beyond the Horizon",
            "artist": "Olivia Chen",
            "country": "China",
            "flagEmoji": "🇨🇳",
            "points": 210
          },
          {
            "id": "sub_7",
            "participantId": "user_kappa",
            "title": "The Silent City",
            "artist": "Felix Dubois",
            "country": "France",
            "flagEmoji": "🇫🇷",
            "points": 185
          },
          {
            "id": "sub_8",
            "participantId": "user_lambda",
            "title": "A Memory of Tomorrow",
            "artist": "Sofia Rodriguez",
            "country": "Mexico",
            "flagEmoji": "🇲🇽",
            "points": 200
          }
        ],
        "submissionDeadline": 1728604740,
        "votingDeadline": 1729468740,
        startDate: 1728594740,
        "phase": "VOTING"
      },
      {
        "id": "edition_3_2025_spring",
        "title": "2025 Spring Showcase",
        "optedOutParticipants": [],
        "submissions": [
        //   {
        //     "id": "sub_9",
        //     "participantId": "user_mu",
        //     "title": "The Last Star",
        //     "artist": "Leo Parker",
        //     "country": "South Africa",
        //     "flagEmoji": "🇿🇦",
        //     "points": 250
        //   },
        //   {
        //     "id": "sub_10",
        //     "participantId": "user_iota",
        //     "title": "The Painted Sky",
        //     "artist": "Olivia Chen",
        //     "country": "China",
        //     "flagEmoji": "🇨🇳",
        //     "points": 220
        //   }
        ],
        "submissionDeadline": 1744847940,
        "votingDeadline": 1745280000,
        startDate: 1744843940,
        "phase": "UPCOMING"
      }
    ]
  },
  {
    id: 'contest_5',
    title: 'Brand New Contest',
    description: 'A brand new, really fresh, contest',
    participants: [],
    joinCode: 'contest_5_join_code',
    hostId: 'user_alpha',
    editions: [],
  },
  {
    "id": "contest_4",
    "title": "Developer's Code-off",
    "description": "A coding competition for developers to build the best apps.",
    "participants": [
      {
        "id": "user_xi",
        "hasSubmitted": true,
        "hasVoted": true
      },
      {
        "id": "user_omicron",
        "hasSubmitted": false,
        "hasVoted": false
      },
      {
        "id": "user_pi",
        "hasSubmitted": false,
        "hasVoted": false
      }
    ],
    "joinCode": "CODE2025",
    "hostId": "host_user_4",
    "editions": [
      {
        "id": "edition_4_2025_q4",
        "title": "Q4 2025 - Submission Phase",
        "optedOutParticipants": [],
        "submissions": [
          {
            "id": "sub_11",
            "participantId": "user_xi",
            "title": "Project Atlas",
            "artist": "Xavier Collins",
            "country": "Germany",
            "flagEmoji": "🇩🇪",
            "points": 0
          }
        ],
        "submissionDeadline": 1761695940,
        "votingDeadline": 1762127940,
        startDate: 1761691940,
        "phase": "SUBMISSION"
      },
      {
        "id": "edition_4_2025_q3",
        "title": "Q3 2025 - Voting Phase",
        "optedOutParticipants": [],
        "submissions": [
          {
            "id": "sub_12",
            "participantId": "user_pi",
            "title": "The Algorithmic Rhapsody",
            "artist": "Peter Lee",
            "country": "South Korea",
            "flagEmoji": "🇰🇷",
            "points": 190
          },
          {
            "id": "sub_9",
            "participantId": "user_xi",
            "title": "The Last Star",
            "artist": "Leo Parker",
            "country": "South Africa",
            "flagEmoji": "🇿🇦",
            "points": 250
          },
          {
            "id": "sub_10",
            "participantId": "user_omicron",
            "title": "The Painted Sky",
            "artist": "Olivia Chen",
            "country": "China",
            "flagEmoji": "🇨🇳",
            "points": 220
          }
        ],
        "submissionDeadline": 1754044740,
        "votingDeadline": 1754476740,
        startDate: 1754014740,
        "phase": "COMPLETE"
      },
      {
        "id": "edition_4_2025_q2",
        "title": "Q2 2025 - Results",
        "optedOutParticipants": [],
        "submissions": [
          {
            "id": "sub_13",
            "participantId": "user_xi",
            "title": "Synthwave Symphony",
            "artist": "Xavier Collins",
            "country": "Germany",
            "flagEmoji": "🇩🇪",
            "points": 215
          },
          {
            "id": "sub_9",
            "participantId": "user_pi",
            "title": "The Last Star",
            "artist": "Leo Parker",
            "country": "South Africa",
            "flagEmoji": "🇿🇦",
            "points": 250
          },
          {
            "id": "sub_10",
            "participantId": "user_omicon",
            "title": "The Painted Sky",
            "artist": "Olivia Chen",
            "country": "China",
            "flagEmoji": "🇨🇳",
            "points": 220
          }
        ],
        "submissionDeadline": 1749503940,
        "votingDeadline": 1749935940,
        startDate: 1749493940,
        "phase": "COMPLETE"
      },
      {
        "id": "edition_4_2025_q1",
        "title": "Q1 2025 - Complete",
        "optedOutParticipants": [
            "user_xi", "user_omicron",
        ],
        "submissions": [
          {
            "id": "sub_14",
            "participantId": "user_pi",
            "title": "The Data Dream",
            "artist": "Peter Lee",
            "country": "South Korea",
            "flagEmoji": "🇰🇷",
            "points": 240
          }
        ],
        "submissionDeadline": 1738367940,
        "votingDeadline": 1738799940,
        startDate: 1738337940,
        "phase": "COMPLETE"
      }
    ]
  }
];
