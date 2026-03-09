'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Mic, Square, Loader2, AlertCircle, Pause, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AudioRecorderProps {
    templateId: string
    templateName: string
}

export function AudioRecorder({ templateId, templateName }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [errorDetails, setErrorDetails] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const router = useRouter()

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop()
            }
        }
    }, [])

    const startRecording = async () => {
        try {
            setErrorDetails(null)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)

            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = handleRecordingStop

            mediaRecorder.start(1000) // capture chunks every second
            setIsRecording(true)
            setIsPaused(false)

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1)
            }, 1000)

            toast.success('Gravação iniciada')
        } catch (error) {
            console.error('Error accessing microphone:', error)
            setErrorDetails('Não foi possível acessar o microfone. Verifique as permissões do navegador.')
            toast.error('Erro ao acessar o microfone')
        }
    }

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause()
            setIsPaused(true)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume()
            setIsPaused(false)
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1)
            }, 1000)
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            setIsProcessing(true) // Start loading state eagerly
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setIsPaused(false)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }

    const handleRecordingStop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)
    }

    const processAudio = async (audioBlob: Blob) => {
        try {
            const formData = new FormData()
            formData.append('audio', audioBlob, 'consultation.webm')
            formData.append('templateId', templateId)

            const response = await fetch('/api/process-consultation', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                let errMessage = 'Falha ao processar o áudio com a IA'
                try {
                    const errData = await response.json()
                    errMessage = errData.error || errMessage
                } catch (e) { }
                throw new Error(errMessage)
            }

            const result = await response.json()

            toast.success('Consulta estruturada com sucesso!')
            router.push(`/consultation/${result.consultationId}`)
        } catch (error: any) {
            console.error('Processing error:', error)
            toast.error(error.message || 'Erro ao processar consulta')
            setErrorDetails(error.message)
            setIsProcessing(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <Card className="w-full max-w-md mx-auto shadow-2xl border-amber-500/20 bg-background/80 backdrop-blur-xl animate-fade-in-up transition-all duration-300">
            <CardHeader className="text-center pb-8 border-b border-border/40 bg-gradient-to-b from-amber-500/5 to-transparent">
                <CardTitle className="text-3xl font-bold tracking-tight">Ouvindo a Consulta</CardTitle>
                <CardDescription className="text-base font-medium mt-2">
                    Modelo em uso: <br /><strong className="text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full inline-block mt-2 font-bold shadow-sm">{templateName}</strong>
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center py-12 space-y-10 min-h-[350px]">
                {errorDetails && (
                    <div className="w-full p-4 mb-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-start gap-3 text-sm animate-fade-in-up font-medium">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{errorDetails}</p>
                    </div>
                )}

                {isProcessing ? (
                    <div className="flex flex-col items-center justify-center space-y-6 animate-fade-in-up w-full">
                        <div className="relative">
                            <div className="w-28 h-28 rounded-full border-4 border-amber-500/20 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/20 to-orange-500/0 animate-spin" style={{ animationDuration: '3s' }} />
                                <Loader2 className="w-12 h-12 animate-spin text-amber-500 relative z-10" />
                            </div>
                        </div>
                        <p className="text-xl font-semibold text-center text-foreground animate-pulse-soft">
                            A IA está analisando a consulta...
                        </p>
                        <p className="text-sm text-muted-foreground font-medium text-center -mt-4">
                            Isso pode levar cerca de 10 a 30 segundos dependendo do tamanho do áudio.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="relative flex items-center justify-center group h-40">
                            {isRecording && !isPaused && (
                                <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                            )}
                            <div className={`relative z-10 w-40 h-40 rounded-full border-4 shadow-xl flex items-center justify-center transition-all duration-500 ${isRecording ? (isPaused ? 'border-amber-500/30 bg-background scale-95 shadow-amber-500/5' : 'border-amber-500 bg-amber-500/5 scale-105 shadow-amber-500/30') : 'border-muted/50 bg-background/50 hover:border-amber-500/30 hover:bg-amber-500/5'}`}>
                                <span className={`text-5xl font-mono tracking-tighter transition-colors duration-300 ${isRecording ? 'text-amber-500 drop-shadow-sm' : 'text-muted-foreground'} ${isPaused ? 'opacity-50' : ''}`}>
                                    {formatTime(recordingTime)}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center justify-center h-20 w-full animate-fade-in-up-delay-1">
                            {!isRecording ? (
                                <Button
                                    size="lg"
                                    className="rounded-full w-20 h-20 shadow-lg shadow-amber-500/20 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-transform duration-300 hover:scale-110 group border-4 border-white dark:border-background"
                                    onClick={startRecording}
                                >
                                    <Mic className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                                </Button>
                            ) : (
                                <div className="flex justify-center items-center gap-6 animate-in zoom-in duration-300">
                                    {isPaused ? (
                                        <Button
                                            size="lg"
                                            className="rounded-full w-16 h-16 shadow-lg shadow-amber-500/20 border-4 border-background bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all hover:scale-105"
                                            onClick={resumeRecording}
                                            title="Retomar Gravação"
                                        >
                                            <Play className="w-7 h-7 text-white ml-1" />
                                        </Button>
                                    ) : (
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="rounded-full w-16 h-16 shadow-md border-amber-500/50 text-amber-600 bg-background hover:bg-amber-500/10 hover:border-amber-500 transition-all hover:scale-105"
                                            onClick={pauseRecording}
                                            title="Pausar Gravação"
                                        >
                                            <Pause className="w-7 h-7 fill-current" />
                                        </Button>
                                    )}
                                    <div className="w-1 h-1 rounded-full bg-border mx-2"></div>
                                    <Button
                                        size="lg"
                                        variant="destructive"
                                        className="rounded-full w-16 h-16 shadow-lg shadow-red-500/20 border-4 border-background transition-all hover:scale-105"
                                        onClick={stopRecording}
                                        title="Finalizar Consulta"
                                    >
                                        <Square className="w-6 h-6 fill-current text-white" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>

            {!isProcessing && (
                <CardFooter className="justify-center bg-muted/20 border-t border-border/40 py-5">
                    <p className="text-sm font-medium tracking-wide text-muted-foreground animate-fade-in-up">
                        {!isRecording
                            ? 'Toque no microfone para iniciar a gravação.'
                            : isPaused
                                ? 'Gravação pausada. Toque no play para retomar.'
                                : <span className="text-amber-600/80 animate-pulse-soft">Gravando... Fale os detalhes da consulta naturalmente.</span>
                        }
                    </p>
                </CardFooter>
            )}
        </Card>
    )
}
