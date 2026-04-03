'use client';

import dynamic from 'next/dynamic';

export const AudioRecorderClient = dynamic(
    () => import('./audio-recorder').then((mod) => mod.AudioRecorder),
    {
        ssr: false,
        loading: () => (
            <div className="p-12 text-center text-muted-foreground bg-card/30 border border-border/20 rounded-3xl animate-pulse flex flex-col items-center justify-center min-h-[350px]">
                Carregando módulo de áudio...
            </div>
        ),
    }
);
