// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
	dsn: 'https://91a53dda5e5c7c090c5fee202484a78c@o4510461604200448.ingest.de.sentry.io/4510461610098768',

	integrations: [
		// send console.log, console.warn, and console.error calls as logs to Sentry
		Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
	],

	// Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
	tracesSampleRate: 1,

	// Enable logs to be sent to Sentry
	enableLogs: true,

	// Enable sending user PII (Personally Identifiable Information)
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
	sendDefaultPii: true,
});
