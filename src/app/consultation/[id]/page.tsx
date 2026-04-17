import { createClient } from '@/lib/supabase/server'
import { ConsultationResult } from '@/components/consultation-result'
import { notFound } from 'next/navigation'

export default async function ConsultationDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient()

    // Fetch consultation with animal details included
    const { data, error } = await supabase
        .from('consultations')
        .select(`
            *,
            animals (
                name,
                species
            )
        `)
        .eq('id', params.id)
        .single()

    if (error || !data) {
        notFound()
    }

    let parsedStructuredContent = data.structured_content;
    if (typeof parsedStructuredContent === 'string') {
        try {
            parsedStructuredContent = JSON.parse(parsedStructuredContent);
        } catch (e) {
            // Fallback for when content is plain text instead of stringified JSON
            parsedStructuredContent = { "Conteúdo Clínico": parsedStructuredContent };
        }
    }

    // Convert empty/JSON formatted object properly
    const safeData = {
        ...data,
        structured_content: parsedStructuredContent
    }

    return (
        <div className="flex-1 w-full max-w-4xl mx-auto pt-4 pb-12">
            <ConsultationResult data={safeData} />
        </div>
    )
}
