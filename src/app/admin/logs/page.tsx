'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type LogEntry = {
    id: string
    timestamp: string
    type: 'ERROR' | 'INFO' | 'WARN' | 'UNKNOWN'
    message: string
    details: any
    source: string
}

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchLogs = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/logs')
            if (!res.ok) throw new Error('Falha ao carregar os logs')
            const data = await res.json()
            setLogs(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
        // Auto-refresh every 5 seconds
        const interval = setInterval(fetchLogs, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Terminal className="text-emerald-500" /> Painel de Diagnóstico em Tempo Real
                        </h1>
                        <p className="text-slate-400 mt-2">Visão geral de todos os incidentes Críticos (Ex: ES256, Middlewares, Edge Runtime)</p>
                    </div>
                    <Button 
                        onClick={fetchLogs} 
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar Logs
                    </Button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg flex items-center gap-3">
                        <AlertCircle /> Erro ao carregar os logs: {error}
                    </div>
                )}

                <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="flex justify-between items-center text-slate-100">
                            <span className="flex items-center gap-2">Histórico Interceptado ({logs.length})</span>
                            {logs.length === 0 && !loading && (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full text-emerald-400 border border-emerald-400 flex items-center">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Sistema Estável
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="h-[70vh] overflow-y-auto rounded-b-xl custom-scrollbar">
                            {logs.length === 0 && !loading ? (
                                <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                                    <Terminal className="w-12 h-12 mb-4 opacity-20" />
                                    Nenhum log gravado no sistema.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800/50">
                                    {logs.map((log) => (
                                        <div key={log.id} className="p-6 hover:bg-slate-800/20 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span 
                                                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                                            log.type === 'ERROR' ? 'bg-red-500 text-white' :
                                                            log.type === 'WARN' ? 'bg-amber-500 text-white' :
                                                            'bg-emerald-500 text-white'
                                                        }`}
                                                    >
                                                        {log.type}
                                                    </span>
                                                    <span className="text-xs text-slate-400 border border-slate-700 bg-slate-900 rounded-full px-2.5 py-0.5">
                                                        📍 {log.source}
                                                    </span>
                                                    <span className="text-sm font-mono text-slate-500">
                                                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <h3 className="text-xl font-semibold text-slate-200 mb-2 font-mono">
                                                {log.message}
                                            </h3>
                                            
                                            {log.details && (
                                                <div className="mt-4 bg-slate-950 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-slate-800">
                                                    <pre className="text-rose-400/90 whitespace-pre-wrap">
                                                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
