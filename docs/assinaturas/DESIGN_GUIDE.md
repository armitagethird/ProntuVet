# ProntuVet Design Guide & System Identity

Este guia documenta o DNA visual e os padrões de interface do ProntuVet, garantindo consistência, sofisticação e uma experiência premium para o médico veterinário.

---

## 1. Identidade Visual (Logo & Branding)

### O Logo ProntuVet
A marca é focada em clareza clínica e modernidade tecnológica.
- **Tipografia**: Pesos pesados (`font-black`) com espaçamento negativo (`tracking-tighter`).
- **Cores do Logo**: 
  - `Prontu`: Gradiente de `Teal-400` para `Emerald-600`.
  - `Vet`: Cor de texto padrão (`foreground`), destacando a área veterinária.
- **Assinatura AI**: Um ponto pulsante (`animate-pulse`) em `Teal-500` posicionado após o "Vet", simbolizando a escuta ativa e a inteligência em tempo real.

---

## 2. Paleta de Cores & Atmosfera

### Cores Core
- **Teal (Primária)**: `#14b8a6` (`teal-500`). Representa calma, esterilidade e precisão cirúrgica.
- **Blue (Secundária)**: `#3b82f6` (`blue-500`). Representa tecnologia, confiança e dados médicos.
- **Emerald (Acento)**: `#10b981` (`emerald-500`). Usada para indicar sucesso, saúde e vitalidade.

### Estética Glassmorphism
O ProntuVet utiliza uma estética "vidro":
- **Blur**: `backdrop-blur-xl` ou `backdrop-blur-3xl`.
- **Transparência**: `bg-background/60` ou `bg-card/40`.
- **Bordas**: Bordas ultra-finas com opacidade reduzida (`border-border/40`).

---

## 3. Tipografia e Hierarquia

- **Títulos**: Usamos `tracking-tight` para manter o visual compacto e profissional.
- **Informação Auxiliar**: Etiquetas em maiúsculas (`uppercase`), negrito (`font-bold`) e com espaçamento entre letras aumentado (`tracking-[0.2em]`) para distinção categórica.
- **Foco de Leitura**: Fontes em tons suaves de cinza (`text-muted-foreground`) para não cansar a vista durante longos prontuários.

---

## 4. Componentes e Formas

- **Raio de Curvatura (Radius)**:
  - **Cards**: `rounded-[2rem]` ou `rounded-3xl` para um visual suave e orgânico.
  - **Botões/Inputs**: `rounded-2xl` para manter a consistência com os cards.
- **Sombras**: Sombras suaves e profundas (`shadow-xl`) com opacidades muito baixas para simular profundidade real.

---

## 5. Padrões de Navegação (UX)

### Centro de Comando
- Em vez de abas tradicionais, o ProntuVet usa um **Centro de Comando**.
- Um único botão de ação abre um painel inferior (`Sheet`) com cards interativos.
- Isso mantém a tela do prontuário limpa, focada apenas no conteúdo médico.

### Trilha Clínica (Timeline)
- Exibição de eventos médicos em ordem cronológica reversa.
- Uso de ícones circulares e linhas sutis para conectar a biografia do paciente.

### Botão de Ajuda
- Posicionado no **Canto Inferior Direito** (`bottom-28`), flutuando acima da barra de navegação para evitar obstrução de conteúdo principal.

---

## 6. Micro-interações e Animações

- **Transições**: Uso de `animate-fade-in-up` para entrada de cards.
- **Hover**: Efeitos de escala sutil (`hover:scale-[1.02]`) e intensificação de brilho em bordas.
- **Feedbacks**: Uso de toasts (`sonner`) em `Teal` para sucessos clínicos.

---

> [!TIP]
> **Regra de Ouro**: Se o layout parecer simples demais, use transparência com blur. Se estiver poluído, use o Centro de Comando para esconder ações secundárias.
