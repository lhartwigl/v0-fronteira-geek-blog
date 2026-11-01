# Desenvolvimento do Fronteira Geek no computador

Abra esta pasta no VS Code:

`C:\Users\Luan.beltrame\Documents\Codex\2026-11-01\ok\outputs\fronteira-geek-github`

Esta copia esta conectada ao repositorio `lhartwigl/v0-fronteira-geek-blog`.

## Alterar e conferir

1. Abra **Terminal > Novo Terminal** no VS Code.
2. Execute `npm run dev`.
3. Abra o endereco exibido no terminal. A previa de desenvolvimento desta revisao esta em http://127.0.0.1:3001 e o painel em http://127.0.0.1:3001/admin/login. A porta 3000 estava ocupada por uma compilacao antiga.
4. Salve os arquivos que alterar: o navegador de desenvolvimento recebe as atualizacoes automaticamente.

O ChatGPT deste chat pode editar os mesmos arquivos. Basta descrever a pagina e a mudanca desejada. Em outro chat, selecione esta pasta como projeto ou informe seu caminho.

As dependencias ja estao instaladas. O arquivo `.env.local` contem as configuracoes privadas e esta excluido do Git. A conexao do banco foi validada. Se usar o painel local para alterar posts, essas alteracoes afetam o banco configurado; com a conexao atual, e o mesmo conteudo do site. Mudancas de layout salvas em arquivos so aparecem no site depois do envio ao GitHub e da publicacao da Vercel.

## Enviar ao site

1. Confira as mudancas no computador.
2. Execute `npm run build` e verifique o resultado.
3. No Controle do Codigo-Fonte do VS Code, revise os arquivos e use **Commit** para registrar a alteracao.
4. Use **Push/Enviar** ou **Sync Changes/Sincronizar Alteracoes**. Entre na conta GitHub pelo navegador se solicitado.
5. Acompanhe a nova versao no painel **Deployments** da Vercel. O projeto existente publica a partir de `main`.

O acesso publico permite baixar o projeto, mas enviar exige login e permissao de escrita. O envio a partir deste chat ainda nao foi autenticado. Nenhuma alteracao foi enviada ao GitHub ou ao site durante esta preparacao.

## Automacao reservada para depois

O trabalho de automacao esta salvo na ramificacao local **feature/automacao-editorial**. Ela inclui o botao com pesquisa de fontes, os agendamentos de 09h e 18h e o documento AUTOMACAO.md. A automacao permanece desativada e nao foi publicada.

A ramificacao **main** fica dedicada ao sistema atual e as mudancas estruturais. Nao e necessario configurar a API da OpenAI para editar o layout, escrever e publicar manualmente pelo painel.

Quando retomarmos a automacao, incorporaremos as mudancas estruturais feitas nesse intervalo e concluiremos as configuracoes pendentes antes da ativacao. Nao e preciso trocar de ramificacao agora.
