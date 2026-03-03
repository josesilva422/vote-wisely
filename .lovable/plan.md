

## Site de Votação Online

### Visão Geral
Um site de votação com galeria de imagens, painel admin para gerenciar imagens, e painel de resultados — tudo com Lovable Cloud (Supabase).

---

### 1. Página de Votação (Pública)
- Campo obrigatório de **nome completo** no topo
- **Galeria de imagens** em grade responsiva (2 colunas no celular, 3-4 no desktop)
- Cada card mostra: imagem, título/número, botão "Votar"
- Ao selecionar uma imagem, ela fica destacada visualmente
- Botão "Confirmar Voto" envia o voto
- Após votar: mensagem de sucesso e bloqueio de novos votos (sessão via localStorage)
- Proteção básica contra spam (rate limiting no frontend)

### 2. Banco de Dados (Lovable Cloud)
- Tabela **images**: id, título, URL da imagem, ordem
- Tabela **votes**: id, nome do votante, image_id, data/hora, session_id
- RLS: inserção pública para votos, leitura restrita ao admin

### 3. Envio de E-mail Automático
- **Edge Function** disparada a cada voto
- Envia e-mail para conectaveigajardim@gmail.com com: nome, imagem votada, data/hora
- Assunto: "Novo voto recebido no site"

### 4. Painel Admin (protegido por login)
- **Login simples** com e-mail/senha para o admin
- **Gerenciar imagens**: adicionar, remover, reordenar imagens da galeria
- **Painel de resultados**: contagem de votos por imagem (gráfico de barras), lista de votantes com data/hora

### 5. Design
- Layout moderno com Tailwind CSS e shadcn/ui
- Totalmente responsivo
- Cores e tipografia limpas, botões com destaque visual
- Feedback visual claro (loading, sucesso, erro)

