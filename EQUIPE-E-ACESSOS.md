# Contas e acessos da equipe

Esta revisao foi preparada em **feature/equipe-e-acessos** e incorporada a **main** para publicacao. Configure SESSION_SECRET na Vercel antes de enviar a atualizacao. Confira a conclusao da implantacao no painel da hospedagem antes de usar as novas funcoes no site publico.

## Perfis

| Recurso | Administrador | Autor |
| --- | --- | --- |
| Criar contas, mudar perfil e desativar contas | Sim | Nao |
| Redefinir a senha de outra pessoa | Sim | Nao |
| Alterar sua propria senha e perfil | Sim | Sim |
| Criar rascunhos | Sim | Sim |
| Editar ou excluir rascunhos de outra pessoa | Sim | Nao |
| Editar ou excluir seus rascunhos | Sim | Sim |
| Publicar, destacar e alterar materias publicadas | Sim | Nao |
| Gerenciar categorias e consultar indicadores gerais | Sim | Nao |
| Enviar imagens | Sim | Sim |
| Consultar a biblioteca de imagens | Todos os arquivos | Apenas seus envios |
| Excluir imagens | Sim | Nao |

A exclusao de imagens fica com o administrador para evitar que um arquivo usado por uma materia publicada desapareca sem revisao. A conta desativada perde acesso ao painel. Desativar preserva suas materias e autoria. Nao ha exclusao definitiva de usuarios.

Nesta previa, a gestao de contas fica em **modo de revisao**: criar contas, redefinir/trocar senhas e alterar perfis ficam bloqueados no servidor. Ela compartilha o banco com o site antigo; gravar um hash agora interromperia o login nessa versao antiga. A gestao sera liberada automaticamente na Vercel/Production ao publicar a nova versao. Para testar gravacoes em um banco separado, configure ALLOW_LOCAL_ACCOUNT_CHANGES=true somente na copia de teste.

## Uso do painel

- **Equipe**: criar contas com nome, email, senha inicial e perfil; mudar perfil; desativar/reativar; redefinir a senha de outra conta.
- **Meu perfil / Alterar senha**: a propria pessoa informa a senha atual e escolhe uma nova, com pelo menos 12 caracteres. As outras sessoes da conta deixam de ser aceitas.
- As senhas existentes nunca sao mostradas. Novas senhas e redefinicoes sao gravadas com scrypt, com sal aleatorio. Senhas iniciais devem ser compartilhadas privadamente pela equipe; o sistema nao envia emails.
- O proprio acesso administrativo nao pode ser removido nessa tela. O servidor tambem protege a existencia de um administrador ativo em alteracoes concorrentes.
- Autores podem enviar rascunhos para o administrador revisar na lista de posts. Nao foi adicionado um fluxo de notificacao por email.

## Protecoes implementadas

Sessoes assinadas com HMAC, expiracao de 24 horas e nova validacao da conta no banco em cada requisicao protegida. Alterar senha, perfil ou desativar a conta invalida sessoes anteriores. Cookies usam HttpOnly, SameSite=Lax e Secure em producao. Nao existe mais segredo padrao publico de sessao.

Limites persistentes de tentativas por email e endereco de origem, em janelas de 15 minutos. Credenciais incorretas recebem a mesma mensagem para contas existentes e inexistentes. O controle de origem usa o Host real da requisicao, pois o Next.js normaliza 127.0.0.1 para localhost na previa; requisicoes de outros sites continuam bloqueadas.

Permissoes e propriedade das materias sao verificadas nas rotas do servidor e refletidas no painel. Conteudo do editor e filtrado para remover scripts, atributos executaveis e iframes de dominios nao permitidos; formatacao e videos do YouTube sao preservados. Uploads aceitam imagens JPG, PNG, WebP, GIF e AVIF de ate 4 MB.

## Situacao do banco e das senhas existentes

O script `scripts/008-account-security.sql` adiciona somente a tabela de controle de tentativas e seu indice. Ele foi aplicado ao banco configurado. Nenhuma senha, perfil ou materia existente foi alterada pelo assistente.

Senhas legadas continuam funcionando durante a transicao. Na primeira entrada bem-sucedida **depois de publicar a nova versao na Vercel/Production**, a senha legada recebe hash sem mudar o valor que a pessoa digita. Na previa local, essa migracao automatica fica suspensa para nao interromper o login da versao antiga que ainda esta no ar. Contas que nao entrarem ainda terao o armazenamento legado ate a migracao; a troca/redefinicao de senha sempre grava o novo hash.

## Antes de publicar

1. Na Vercel, abra as variaveis do projeto e configure **SESSION_SECRET** para **Production**, com um segredo aleatorio de pelo menos 32 caracteres. Pode usar o valor privado ja preparado no `.env.local` desta copia. Nao coloque esse valor em arquivos rastreados ou no chat.
2. A conexao DATABASE_URL precisa apontar para o banco que recebeu o script 008. Se a hospedagem usar outro banco, execute o script nele antes da publicacao.
3. Publique esta versao somente depois dessa configuracao. Os usuarios terao que entrar novamente, pois o mecanismo de sessao foi corrigido.
4. Entre na versao publicada, confira Equipe e revise quem deve permanecer administrador. As contas existentes foram preservadas com seus perfis atuais.

Nao foi implementada recuperacao de senha por email ou MFA nesta etapa. Outra conta administradora pode redefinir uma senha esquecida. Se o unico administrador perder a senha, sera necessaria recuperacao assistida; nao ha um endpoint publico que contorne essa protecao.

## Validacao

- Testes de hash, senha incorreta, migracao da senha antiga, adulteracao/expiracao da sessao, permissao editorial, origem e filtragem HTML.
- Rotas reais testadas com PostgreSQL isolado (PGlite): acesso negado a autores, restricao de propriedade, publicacao bloqueada, criacao com hash, email duplicado, conta desativada, protecao do administrador e bloqueio de tentativas.
- Compilacao de producao e verificacao de tipos aprovadas. Login local conferido no navegador com as credenciais preenchidas pelo proprietario, sem ler ou alterar sua senha.
- Nenhuma conta real foi criada, desativada ou teve senha redefinida durante os testes.

Referencias: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html e https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
