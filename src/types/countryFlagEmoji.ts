declare module 'country-flag-emoji' {
	interface Country {
		name: string;
		code: string;
		emoji: string;
		unicode: string;
	}

	const list: Country[];
	const findByCode: (code: string) => Country | undefined;
	const findByName: (name: string) => Country | undefined;
	const findByEmoji: (emoji: string) => Country | undefined;
}
