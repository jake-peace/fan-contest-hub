// sentry.client.config.ts (or .js)
import * as Sentry from '@sentry/nextjs';
// Make sure you import it as a function if you aren't using Sentry.replayIntegration()
// import { replayIntegration } from '@sentry/nextjs';

Sentry.init({
	// ... dsn, tracesSampleRate, etc.
	integrations: [
		// This is the correct place for Replay.
		Sentry.replayIntegration({
			// Replay configuration options
			maskAllText: false,
		}),
	],
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
});
