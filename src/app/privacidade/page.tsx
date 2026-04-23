import type { Metadata } from 'next'
import Link from 'next/link'
import { LEGAL_VERSION } from '@/lib/legal'

export const metadata: Metadata = {
    title: 'Política de Privacidade · ProntuVet',
    robots: { index: true, follow: true },
}

export default function PrivacidadePage() {
    return (
        <main className="max-w-3xl mx-auto px-4 py-12 text-slate-800">
            <Link href="/" className="text-sm text-teal-600 hover:underline">← Voltar</Link>
            <h1 className="text-3xl font-black tracking-tight mt-4 mb-2">Política de Privacidade</h1>
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-8">Versão {LEGAL_VERSION}</p>

            <section className="space-y-6 text-[15px] leading-relaxed">
                <div>
                    <h2 className="text-xl font-bold mb-2">1. Quem somos</h2>
                    <p>O ProntuVet (a "Plataforma") é operado por seus responsáveis no Brasil. Esta Política descreve como coletamos, usamos, armazenamos e compartilhamos dados pessoais, em conformidade com a Lei 13.709/2018 (LGPD).</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">2. Dados coletados e base legal</h2>
                    <table className="w-full border border-slate-200 text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left p-2 border-b border-slate-200">Dado</th>
                                <th className="text-left p-2 border-b border-slate-200">Titular</th>
                                <th className="text-left p-2 border-b border-slate-200">Base legal (LGPD)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td className="p-2 border-t border-slate-100">Nome, e-mail, CPF, endereço, telefone</td><td className="p-2">Veterinário</td><td className="p-2">Execução de contrato (Art. 7º, V)</td></tr>
                            <tr><td className="p-2 border-t border-slate-100">Especialização, data de nascimento</td><td className="p-2">Veterinário</td><td className="p-2">Consentimento (Art. 7º, I)</td></tr>
                            <tr><td className="p-2 border-t border-slate-100">Áudio da consulta</td><td className="p-2">Vet + tutor + animal</td><td className="p-2">Execução de contrato (vet é controlador dos dados do tutor)</td></tr>
                            <tr><td className="p-2 border-t border-slate-100">Transcrição e prontuário estruturado</td><td className="p-2">Paciente/Tutor (via vet)</td><td className="p-2">Execução de contrato</td></tr>
                            <tr><td className="p-2 border-t border-slate-100">Nome do tutor, nome/espécie do animal</td><td className="p-2">Tutor</td><td className="p-2">Execução de contrato</td></tr>
                            <tr><td className="p-2 border-t border-slate-100">IP de origem, uso/consumo</td><td className="p-2">Veterinário</td><td className="p-2">Legítimo interesse (Art. 7º, IX) – segurança e anti-fraude</td></tr>
                            <tr><td className="p-2 border-t border-slate-100">Anexos clínicos (imagens, exames)</td><td className="p-2">Paciente</td><td className="p-2">Execução de contrato</td></tr>
                        </tbody>
                    </table>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">3. Áudio e IA</h2>
                    <p>O áudio é enviado diretamente para processamento (Google Gemini) e <strong>não é armazenado</strong> em nossos servidores. Apenas a transcrição e o prontuário estruturado são persistidos, vinculados ao Veterinário.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">4. Com quem compartilhamos</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li><strong>Supabase</strong> — banco de dados e autenticação, região São Paulo.</li>
                        <li><strong>Vercel</strong> — hospedagem da aplicação.</li>
                        <li><strong>Google Gemini</strong> — processamento do áudio em IA (transcrição e estruturação).</li>
                        <li><strong>Asaas</strong> — processamento de pagamentos recorrentes.</li>
                    </ul>
                    <p className="mt-2">Esses operadores têm acesso estritamente ao mínimo necessário para prestar o serviço e estão vinculados a contratos que vedam uso próprio dos dados.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">5. Retenção</h2>
                    <p>Prontuários e dados cadastrais são mantidos enquanto a conta estiver ativa. Após exclusão da conta, os dados são removidos integralmente em até 30 dias, salvo obrigações legais de retenção (p.ex., dados fiscais/financeiros).</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">6. Direitos do titular (Art. 18 LGPD)</h2>
                    <p>O Usuário pode, a qualquer momento:</p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>confirmar a existência de tratamento;</li>
                        <li>acessar e exportar seus dados — <em>Perfil → Exportar dados</em>;</li>
                        <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
                        <li>solicitar anonimização, bloqueio ou eliminação;</li>
                        <li>revogar o consentimento;</li>
                        <li>excluir a conta completamente — <em>Perfil → Excluir conta</em>.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">7. Segurança</h2>
                    <p>Aplicamos controles técnicos e organizacionais: RLS (Row Level Security) no banco, TLS em todas as comunicações, tokens de acesso com expiração, ProntuLink com TTL de 14 dias e revogação manual, rate limiting por usuário, isolamento de chaves de API em variáveis server-side.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">8. Cookies</h2>
                    <p>Usamos cookies estritamente necessários para manter a sessão de autenticação (Supabase Auth). Não usamos cookies de rastreamento ou publicidade.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">9. Encarregado (DPO)</h2>
                    <p>Para solicitações de exercício de direitos ou dúvidas de privacidade, escreva para <a href="mailto:prontuvet.social@gmail.com" className="text-teal-600 underline">prontuvet.social@gmail.com</a>.</p>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">10. Alterações</h2>
                    <p>Esta Política pode ser atualizada. Mudanças materiais serão notificadas por e-mail e no aplicativo.</p>
                </div>
            </section>
        </main>
    )
}
