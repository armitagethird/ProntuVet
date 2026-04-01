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

    // Convert empty/JSON formatted object properly
    const safeData = {
        ...data,
        structured_content: typeof data.structured_content === 'string'
            ? JSON.parse(data.structured_content)
            : data.structured_content
    }

    return (
        <div className="flex-1 w-full max-w-4xl mx-auto pt-4 pb-12">
            <ConsultationResult data={safeData} />
        </div>
    )
}
