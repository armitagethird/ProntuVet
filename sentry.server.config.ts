import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    sendDefaultPii: false,
    enableLogs: false,

    environment: process.env.NODE_ENV,

    ignoreErrors: [
        'NEXT_REDIRECT',
        'NEXT_NOT_FOUND',
        'AbortError',
    ],

    beforeSend(event, hint) {
        if (event.request?.cookies) delete event.request.cookies
        if (event.request?.headers) {
            delete event.request.headers['authorization']
            delete event.request.headers['cookie']
            delete event.request.headers['x-api-key']
        }
        if (event.request?.data) event.request.data = '[redacted]'

        const err = hint.originalException as { digest?: string } | undefined
        if (err?.digest === 'NEXT_REDIRECT' || err?.digest === 'NEXT_NOT_FOUND') {
            return null
        }

        return event
    },
})
