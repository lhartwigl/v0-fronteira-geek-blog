# Automação editorial do Fronteira Geek

## Comportamento preparado

- Escrita manual e publicação pelo painel continuam disponíveis.
- O botão **Gerar com IA** pesquisa o tema, gera o texto em português e preenche o editor. Ele não salva nem publica sozinho. As fontes ficam visíveis no artigo.
- Dois agendamentos geram e publicam uma matéria por execução, às 09h e 18h de Brasília, alternando entre todas as categorias existentes.
- O computador pode ficar desligado: os agendamentos rodam na hospedagem, após a publicação desta versão e ativação.
- O painel ganhou a página **Automação**, com situação, horários, autor e histórico das execuções.

A meta é duas matérias diárias. Indisponibilidade da API, falta de crédito, ausência de notícia verificável ou falha do banco podem impedir uma publicação. Nessas situações a execução é registrada, sem inventar uma notícia para preencher o horário. O disparo do plano Hobby da Vercel pode ocorrer dentro da hora programada; não há garantia do minuto exato. Não foi acrescentado um serviço externo para garantir horário ou recuperar falhas automaticamente.

## Chave usada

Esta implementação usa a API da OpenAI diretamente. Crie uma chave em https://platform.openai.com/api-keys e coloque-a em **OPENAI_API_KEY**, tanto na configuração local quanto no ambiente de produção da Vercel. O acesso ao modelo e à busca depende das permissões e dos créditos da conta da API.

**AI_GATEWAY_API_KEY não é utilizada por esta implementação.** Não coloque uma chave OpenAI nessa variável. A chave da API não conecta este chat ao painel: é o próprio servidor do blog que pesquisa, gera e publica.

O modelo configurável padrão é `gpt-4.1-mini`, utilizado com a Responses API e a ferramenta `web_search`. Cada geração faz uma chamada de pesquisa e outra de redação. Não foi criado um contrato de custo fixo nem uma garantia de veracidade: é necessário revisar o conteúdo e acompanhar o consumo real.

Referências: https://developers.openai.com/api/docs/quickstart e https://developers.openai.com/api/docs/guides/tools-web-search

## Configuração necessária

1. Configure **DATABASE_URL** com a conexão existente. Para testes de escrita, use uma cópia do banco.
2. Mantenha **SESSION_SECRET** já configurado, com pelo menos 32 caracteres. A integração preserva as sessões e permissões atuais de administrador e autor.
3. Configure **OPENAI_API_KEY** com a chave real da OpenAI e mantenha **OPENAI_EDITORIAL_MODEL=gpt-4.1-mini**, ou outro modelo compatível com busca e saída estruturada.
4. Mantenha **BLOB_READ_WRITE_TOKEN** para uploads manuais de imagens. A automação não gera imagens nem copia imagens de fontes; as novas matérias usam a apresentação sem imagem já existente no site.
5. Execute **scripts/007-create-editorial-runs.sql** primeiro em um banco de teste e, após validação, no banco do site. Esse script adiciona o histórico e os controles contra duplicação; não modifica as matérias existentes. Ele ainda NÃO foi aplicado ao banco do site.
6. Defina **AUTOMATION_AUTHOR_ID** como o ID do usuário ADMIN que deve assinar as matérias automáticas. Consulte os autores no seu banco com `SELECT id, name FROM users WHERE role = 'ADMIN' ORDER BY id;`. Nenhum autor foi escolhido sem sua definição.
7. Configure **CRON_SECRET** com outro segredo aleatório de pelo menos 32 caracteres, diferente de SESSION_SECRET. A Vercel envia esse segredo para autenticar cada disparo.
8. Mantenha **AUTOMATION_ENABLED=false** enquanto testa. Na produção, use **NEXT_PUBLIC_SITE_URL=https://www.fronteirageek.com**.

A página Automação é exclusiva de administradores. Administradores e autores podem preencher seus editores com o botão Gerar com IA; gerar um texto não concede ao autor permissão de publicação. O endpoint verifica sessão, origem e limite temporário de dez gerações a cada quinze minutos por usuário e endereço. Publicações automáticas só são permitidas no ambiente de produção da Vercel, mesmo que a chave de ativação seja definida por engano na prévia local.

Os valores privados vão em `.env.local` e nas configurações da Vercel, nunca no `.env.example`, no GitHub ou no chat. A página Automação informa se ainda há configuração pendente; ela não exibe as chaves.

## Publicar e ativar

Após conferir uma geração real no painel e validar o banco de teste, envie a versão ao GitHub e acompanhe a compilação na Vercel. Os dois agendamentos estão declarados em `vercel.json`, às 12h e 21h UTC (09h e 18h em America/Sao_Paulo).

Só depois de conferir o autor, o histórico e as configurações na produção, altere **AUTOMATION_ENABLED=true** e faça uma nova implantação para o servidor receber a configuração. Para pausar, use `false` e implante novamente. Salvar arquivos no VS Code não publica o site e não ativa o agendamento.

Referências: https://vercel.com/docs/cron-jobs/manage-cron-jobs e https://vercel.com/docs/cron-jobs/usage-and-pricing

## Falhas e duplicação

Cada data/horário recebe um registro único no banco. Um disparo repetido após publicação não gera um novo texto. A mesma URL principal e o mesmo título normalizado não podem ser publicados novamente pela automação. A pesquisa também recebe os últimos títulos para reduzir repetições com títulos diferentes; isso não garante detectar todas as notícias equivalentes.

Falhas transitórias aceitam até três tentativas por data/horário. Uma execução interrompida pode ser retomada após dez minutos, ainda dentro da hora de publicação. Isso só acontece se houver outro disparo: não foi configurado um segundo serviço que repita automaticamente as chamadas. Notícias sem base suficiente ficam como ignoradas naquele horário. O painel mostra as últimas vinte execuções.

## Verificação realizada

- Compilação de produção concluída com sucesso e leitura do banco durante o sitemap.
- Dezenove testes locais aprovados de segurança, horários, rotação, autenticação, saída HTML, fontes, recusa de notícias e falhas de API, com respostas simuladas e sem consumo de IA real.
- Testes do código SQL em PostgreSQL local de teste (PGlite): publicação atômica, repetição sem geração extra, mesma fonte rejeitada sem deixar post órfão, nova tentativa após falha, retomada após interrupção, limite de tentativas, perda de bloqueio e desativação do autor durante geração.
- A integração usa a configuração atual do projeto, com verificação de tipos habilitada na compilação.
- Nenhuma chamada de geração real foi feita porque OPENAI_API_KEY ainda está vazia. Nenhuma migração de banco, publicação no GitHub ou ativação na produção foi realizada.

Execute `npm test` com Node.js 24 para repetir os testes de unidade. `npm run build` verifica a compilação e precisa de acesso de leitura ao banco.
