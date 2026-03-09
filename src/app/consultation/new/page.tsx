import { AudioRecorder } from '@/components/audio-recorder'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewConsultationPage(props: { searchParams: Promise<{ templateId?: string }> }) {
    const searchParams = await props.searchParams;
    const templateId = searchParams?.templateId;

    if (!templateId) {
        redirect('/dashboard');
    }

    let templateName = 'Prontuário Inteligente (IA)';

    if (templateId !== 'system-default') {
        const supabase = await createClient()
        const { data: template, error } = await supabase
            .from('consultation_templates')
            .select('name, id')
            .eq('id', templateId)
            .single();

        if (error || !template) {
            redirect('/dashboard');
        }
        templateName = template.name;
    }

    return (
        <div className="flex flex-col flex-1 max-w-2xl mx-auto w-full pt-4 space-y-6">
            <div>
                <Link href="/dashboard" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 mb-6 -ml-4 text-muted-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                </Link>
            </div>

            <div className="flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <AudioRecorder templateId={templateId} templateName={templateName} />
            </div>
        </div>
    )
}
