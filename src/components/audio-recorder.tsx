'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, Square, Loader2, AlertCircle, Pause, Play, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface AudioRecorderProps {
    templateId: string
    templateName: string
}

function WaveVisualizer({ stream, isRecording, isPaused }: { stream: MediaStream | null, isRecording: boolean, isPaused: boolean }) {
    const barsRef = useRef<(HTMLDivElement | null)[]>([])
    const animationRef = useRef<number | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    
    const bars = Array.from({ length: 40 })

    useEffect(() => {
        // Somente roda o visualizador se tivermos um stream e estivermos gravando ativamente
        if (isRecording && stream && !isPaused) {
            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
                }
                
                const context = audioContextRef.current
                
                if (context.state === 'suspended') {
                    context.resume()
                }

                const analyser = context.createAnalyser()
                analyser.fftSize = 256
                analyserRef.current = analyser
                
                if (sourceRef.current) {
                    sourceRef.current.disconnect()
                }

                const source = context.createMediaStreamSource(stream)
                source.connect(analyser)
                sourceRef.current = source
                
                const bufferLength = analyser.frequencyBinCount
                const dataArray = new Uint8Array(bufferLength)
                
                const updateVisualizer = () => {
                    if (!analyserRef.current || !isRecording || isPaused) return
                    
                    analyserRef.current.getByteFrequencyData(dataArray)
                    
                    for (let i = 0; i < barsRef.current.length; i++) {
                        const bar = barsRef.current[i]
                        if (bar) {
                            const dataIndex = Math.floor((i / barsRef.current.length) * (bufferLength / 2))
                            const value = dataArray[dataIndex]
                            const height = (value / 255) * 60 + 4
                            bar.style.height = `${height}px`
                            bar.style.opacity = `${Math.max(0.2, value / 255)}`
                        }
                    }
                    
                    animationRef.current = requestAnimationFrame(updateVisualizer)
                }
                
                animationRef.current = requestAnimationFrame(updateVisualizer)
            } catch (err) {
                console.error("Visualizer Error:", err)
            }
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                animationRef.current = null
            }
            
            if (sourceRef.current) {
                sourceRef.current.disconnect()
                sourceRef.current = null
            }
            
            barsRef.current.forEach(bar => {
                if (bar) {
                    bar.style.height = '4px'
                    bar.style.opacity = '0.2'
                }
            })
        }
        
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
        }
    }, [isRecording, stream, isPaused])

    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(console.error)
            }
        }
    }, [])

    return (
        <div className="flex items-center justify-center gap-[3px] h-24 w-full px-8 gpu-accelerated">
            {bars.map((_, i) => (
                <div
                    key={i}
                    ref={el => { barsRef.current[i] = el }}
                    className="w-[3px] h-[4px] opacity-20 rounded-full bg-gradient-to-t from-teal-500 to-blue-400 transition-[height,opacity] duration-75 ease-out"
                />
            ))}
        </div>
    )
}

export function AudioRecorder({ templateId, templateName }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [errorDetails, setErrorDetails] = useState<string | null>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const router = useRouter()

    // Cleanup global - APENAS no unmount total do componente
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
            if (timerRef.current) clearInterval(timerRef.current)
            audioChunksRef.current = []
            setErrorDetails(null)
            setIsPaused(false)
            setRecordingTime(0)
            
            const newStream = await navigator.mediaDevices.getUserMedia({ audio: true })
            setStream(newStream)
            
            const mediaRecorder = new MediaRecorder(newStream)
            mediaRecorderRef.current = mediaRecorder

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = handleRecordingStop

            mediaRecorder.start(1000)
            setIsRecording(true)

            // Timer isolado de mudanças de estado de stream
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev >= 1799) {
                        stopRecording()
                        toast.info('Limite de tempo atingido. Processando áudio...')
                        return 1800
                    }
                    return prev + 1
                })
            }, 1000)

            toast.success('Gravação iniciada')
        } catch (error) {
            console.error('Error accessing microphone:', error)
            setErrorDetails('Não foi possível acessar o microfone. Verifique as permissões.')
            toast.error('Erro ao acessar o microfone')
        }
    }

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause()
            setIsPaused(true)
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume()
            setIsPaused(false)
            
            if (timerRef.current) clearInterval(timerRef.current)
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1)
            }, 1000)
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            setIsProcessing(true)
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setIsPaused(false)
            
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }

    const handleRecordingStop = async () => {
        // Coleta tracks e para o hardware DEPOIS de fechar o MediaRecorder
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop()
            })
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        // Verificação de segurança: Áudio não pode ser vazio
        if (audioBlob.size < 100) {
            console.error("Audio blob too small:", audioBlob.size)
            toast.error("Erro: O áudio gravado parece estar vazio.")
            setIsProcessing(false)
            return
        }

        await processAudio(audioBlob)
        setStream(null)
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
                const errorData = await response.json().catch(() => ({}))
                // Tenta pegar 'message' (novo formato) ou 'error' (formato antigo)
                const errorMessage = errorData.message || errorData.error || 'Falha ao processar o áudio com a IA'
                throw new Error(errorMessage)
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

    const resetRecorder = () => {
        if (timerRef.current) clearInterval(timerRef.current)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
        }
        
        setRecordingTime(0)
        setErrorDetails(null)
        setIsRecording(false)
        setIsPaused(false)
        setIsProcessing(false)
        setStream(null)
        audioChunksRef.current = []
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="w-full flex flex-col items-center justify-start min-h-[80vh] pt-16 pb-40 px-4 animate-fade-in-up">
            <Card className="w-full max-w-lg overflow-hidden border-none bg-transparent shadow-none">
                <CardContent className="flex flex-col items-center gap-10 py-6">
                    <div className="text-center space-y-4">
                        <motion.h1 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-4xl md:text-5xl font-black text-foreground tracking-tighter"
                        >
                            {isProcessing ? 'Finalizando...' : 'Ouvindo Consulta'}
                        </motion.h1>
                        <p className="text-muted-foreground font-medium text-sm md:text-base px-8">
                            A tecnologia IA está processando sua voz e transformando em um prontuário clínico de alto nível.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
                            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                            <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">{templateName}</span>
                        </div>
                    </div>

                    {isProcessing ? (
                        <div className="flex flex-col items-center gap-8 w-full py-12">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-4 border-teal-500/10 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-teal-500 to-blue-500 opacity-20 animate-pulse" />
                                    <Loader2 className="w-16 h-16 animate-spin text-teal-500" />
                                </div>
                            </div>
                            <div className="space-y-2 text-center text-balance">
                                <p className="text-xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">Estruturando dados clínicos...</p>
                                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Aguarde alguns segundos</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center gap-12">
                            <div className="w-full h-32 flex flex-col items-center justify-center relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent rounded-3xl -z-10" />
                                <WaveVisualizer stream={stream} isRecording={isRecording} isPaused={isPaused} />
                                <div className="mt-4 text-3xl font-mono font-black text-foreground tabular-nums tracking-tight">
                                    {formatTime(recordingTime)}
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-8 w-full">
                                {!isRecording ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={startRecording}
                                            className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 p-1 shadow-2xl shadow-teal-500/30 group"
                                        >
                                            <div className="w-full h-full rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/20 transition-all group-hover:bg-background/20">
                                                <Mic className="w-12 h-12 text-white" />
                                            </div>
                                        </motion.button>
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] opacity-50">Toque para Gravar</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-10 w-full animate-in fade-in zoom-in duration-500">
                                        <div className="flex items-center gap-4">
                                            {isPaused ? (
                                                <Button
                                                    onClick={resumeRecording}
                                                    size="lg"
                                                    className="h-16 w-16 rounded-2xl bg-teal-500 hover:bg-teal-600 text-white shadow-xl shadow-teal-500/20"
                                                >
                                                    <Play className="w-8 h-8 fill-current translate-x-0.5" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={pauseRecording}
                                                    variant="outline"
                                                    size="lg"
                                                    className="h-16 w-16 rounded-2xl border-teal-500/20 bg-background/50 hover:bg-teal-500/10 text-teal-600"
                                                >
                                                    <Pause className="w-8 h-8 fill-current" />
                                                </Button>
                                            )}
                                            
                                            <Button
                                                onClick={stopRecording}
                                                size="lg"
                                                className="h-16 px-10 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold flex items-center gap-3 shadow-2xl shadow-teal-500/20 transition-all hover:scale-105"
                                            >
                                                <CheckCircle2 className="w-6 h-6" />
                                                <span>Finalizar Consulta</span>
                                            </Button>
                                        </div>

                                        <button 
                                            onClick={resetRecorder}
                                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-bold opacity-60 hover:opacity-100"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            <span>Cancelar e Voltar</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {errorDetails && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex items-center gap-3 max-w-sm"
                        >
                            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                            <p className="text-xs font-bold text-destructive">{errorDetails}</p>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
