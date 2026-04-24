import type { Metadata } from 'next'
import Link from 'next/link'
import { LEGAL_VERSION } from '@/lib/legal'

export const metadata: Metadata = {
    title: 'Termos de Uso · ProntuVet',
    robots: { index: true, follow: true },
}

export default function TermosPage() {
    return (
        <main className="max-w-3xl mx-auto px-4 py-12 text-slate-800">
            <Link href="/" className="text-sm text-teal-600 hover:underline">← Voltar</Link>
            <h1 className="text-3xl font-black tracking-tight mt-4 mb-2">Termos de Uso</h1>
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-8">Versão {LEGAL_VERSION}</p>

            <section className="space-y-6 text-[15px] leading-relaxed">
                <div>
                    <h2 className="text-xl font-bold mb-2">1. Objeto</h2>
                    <p>O ProntuVet é uma plataforma SaaS voltada a veterinários que utiliza inteligência artificial para transcrever áudio de consultas e gerar prontuários clínicos estruturados. Estes Termos regem o uso da plataforma por profissionais contratantes ("Veterinário" ou "Usuário").</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">2. Cadastro</h2>
                    <p>O Usuário declara ser veterinário regularmente inscrito em conselho profissional ou estudante da área, ser maior de idade, fornecer dados verdadeiros (nome, CPF, e-mail) e responsabilizar-se pela guarda das credenciais de acesso. O CPF é único por conta.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">3. Planos e pagamento</h2>
                    <p>O ProntuVet disponibiliza os planos <strong>Free</strong>, <strong>Essential</strong>, <strong>Platinum</strong> e <strong>Clínica</strong>. O plano Free é gratuito, limitado a 20 consultas/mês. Os planos pagos são cobrados mensalmente via Asaas (processador de pagamento parceiro). Ao assinar um plano pago, o Usuário autoriza a cobrança recorrente até o cancelamento.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">4. Cancelamento e reembolso</h2>
                    <p>O Usuário pode cancelar a assinatura a qualquer momento em <em>Perfil → Assinatura</em>. O cancelamento interrompe a próxima cobrança e reduz o plano para Free ao fim do ciclo vigente. Em caso de arrependimento em até 7 dias da primeira cobrança (Art. 49 CDC), o reembolso é integral.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">5. Limites e uso aceitável</h2>
                    <p>Cada plano tem limites mensais, diários e horários de consultas. O Usuário concorda em não (a) tentar burlar os limites, (b) compartilhar a conta com terceiros, (c) extrair dados em massa via scraping, (d) usar a plataforma para fins fora da medicina veterinária.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">6. Natureza do serviço e isenção clínica</h2>
                    <p>O ProntuVet é uma ferramenta de apoio à documentação clínica. A IA pode cometer erros de transcrição ou interpretação. <strong>A responsabilidade pela decisão clínica e pela revisão do prontuário é integralmente do Veterinário.</strong> O ProntuVet não substitui o julgamento profissional nem a validação humana do conteúdo gerado.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">7. Dados de tutores e pacientes</h2>
                    <p>7.1. O Veterinário é o <strong>Controlador</strong> dos dados pessoais dos tutores e dos dados clínicos dos animais inseridos na plataforma, nos termos do Art. 5º, VI da LGPD.</p>
                    <p>7.2. O ProntuVet atua exclusivamente como <strong>Operador</strong> (Art. 5º, VII da LGPD), processando os dados sob a finalidade determinada pelo Veterinário, sem uso próprio.</p>
                    <p>7.3. É de responsabilidade do Veterinário:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>obter o consentimento ou possuir base legal adequada para coletar e tratar dados do tutor (inclusive CPF, quando aplicável);</li>
                        <li>informar ao tutor que a consulta será gravada e processada por inteligência artificial para elaboração do prontuário;</li>
                        <li>gerir solicitações de direitos dos titulares (Art. 18 LGPD) oriundas dos tutores.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">8. Propriedade e uso dos dados</h2>
                    <p>Os prontuários, transcrições, animais e tutores cadastrados pelo Veterinário permanecem de sua titularidade. O ProntuVet não usa esses dados para treinar modelos de IA próprios nem os compartilha com terceiros, salvo sub-operadores estritamente necessários à prestação do serviço (Supabase, Vercel, Google Gemini, Asaas).</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">9. ProntuLink</h2>
                    <p>O ProntuLink é um recurso (Platinum+) que gera um link público com validade de 14 dias para compartilhamento do prontuário com o tutor. O Veterinário é responsável por só gerar o link após obter o consentimento do tutor. O link pode ser revogado a qualquer momento pelo Veterinário.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">10. Rescisão</h2>
                    <p>O ProntuVet pode suspender ou encerrar contas que violem estes Termos, após notificação prévia quando cabível. Em caso de fraude, abuso ou violação grave, a suspensão pode ser imediata. Ao encerrar a conta, o Usuário pode exportar todos os seus dados em <em>Perfil → Exportar dados</em>.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">11. Alterações</h2>
                    <p>Estes Termos podem ser atualizados. Mudanças materiais serão comunicadas por e-mail e o Usuário deverá aceitar a nova versão para continuar usando o serviço.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">12. Foro</h2>
                    <p>Fica eleito o foro da comarca do Usuário para dirimir quaisquer controvérsias oriundas destes Termos.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">13. Contato</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Dúvidas gerais: <a href="mailto:contato@prontuvet.com" className="text-teal-600 underline">contato@prontuvet.com</a></li>
                        <li>Suporte técnico: <a href="mailto:suporte@prontuvet.com" className="text-teal-600 underline">suporte@prontuvet.com</a></li>
                        <li>LGPD / Encarregado (DPO): <a href="mailto:privacidade@prontuvet.com" className="text-teal-600 underline">privacidade@prontuvet.com</a></li>
                    </ul>
                </div>
            </section>
        </main>
    )
}
