import * as Sentry from '@sentry/nextjs'

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    sendDefaultPii: false,
    enableLogs: false,

    environment: process.env.NODE_ENV,

    ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
        'NEXT_REDIRECT',
        'NEXT_NOT_FOUND',
        'AbortError',
    ],

    beforeSend(event) {
        if (event.request?.cookies) delete event.request.cookies
        if (event.request?.headers) {
            delete event.request.headers['authorization']
            delete event.request.headers['cookie']
        }
        if (event.user) {
            delete event.user.email
            delete event.user.ip_address
            delete event.user.username
        }
        return event
    },
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
