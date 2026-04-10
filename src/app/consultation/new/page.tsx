import { AudioRecorderClient } from '@/components/audio-recorder-client'
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
        <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full pt-8">
            <div className="flex-1 flex flex-col justify-start pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 gpu-accelerated">
                <AudioRecorderClient templateId={templateId} templateName={templateName} />
            </div>
        </div>
    )
}
