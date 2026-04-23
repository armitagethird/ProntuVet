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

    beforeSend(event) {
        if (event.request?.cookies) delete event.request.cookies
        if (event.request?.headers) {
            delete event.request.headers['authorization']
            delete event.request.headers['cookie']
            delete event.request.headers['x-api-key']
        }
        if (event.request?.data) event.request.data = '[redacted]'
        return event
    },
})
