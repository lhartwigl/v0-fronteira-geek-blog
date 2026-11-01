# Revisao de responsividade

## Ajustes

- Destaque da pagina inicial com largura limitada ao conteiner e altura que acompanha o titulo no celular. Antes, a pagina tinha 762 px de largura em uma tela de 360 px, cortando texto e imagem.
- Cabecalho publico com alvos de toque maiores, menu com rolagem interna em telas baixas e indicacao acessivel de aberto/fechado.
- Painel administrativo com cabecalho proprio no celular, menu lateral em dialogo com controle de foco e fechamento por Escape, e margens menores.
- Listagem de posts sem exigir rolagem lateral no celular, com titulo em varias linhas, status/categoria visiveis e acoes acessiveis ao toque.
- Perfil com controles da foto que se reorganizam em telas estreitas; formularios, indicadores e paginacao com quebra de linha.
- Editor com controles maiores no celular, campos de link/video que se reorganizam, botoes de salvamento empilhados e galeria adequada a altura disponivel.
- Acoes da biblioteca de imagens visiveis em dispositivos sem hover.
- Conteudo das materias com quebra de links/textos longos, imagens e videos limitados a coluna e rolagem interna para tabelas e codigo.
- Campos de texto em 16 px no celular para evitar a ampliacao automatica ao receber foco em navegadores moveis.

## Verificacao

Simulacao de larguras no navegador, sem testar em aparelhos fisicos:

| Largura | Paginas verificadas |
| --- | --- |
| 320 px | Inicio, categoria Anime, busca, painel, posts, novo post, categorias, midia e perfil |
| 390 px | Inicio, posts, novo post, perfil e materia |
| 768 px | Inicio e enquadramento do destaque |
| 1280 px | Inicio, posts, novo post, perfil e materia |

As paginas medidas permaneceram dentro da largura visivel, sem rolagem horizontal da pagina. A lista de posts foi conferida novamente com as tres linhas carregadas. A galeria de imagens e o campo de video foram abertos a 320 px. Menus foram abertos/fechados e o Escape foi conferido. Nenhum formulario de conteudo foi salvo ou publicado durante a revisao.

`npm run build`: aprovado. Verificacao TypeScript com `tsc --noEmit --incremental false`: aprovada. `git diff --check`: aprovado.

## Previa

Use http://127.0.0.1:3001 para ver os arquivos atuais em desenvolvimento. A porta 3000 estava servindo uma compilacao antiga. A revisao ainda nao foi enviada ao GitHub nem ao site publico.

A automacao continua preservada separadamente na ramificacao local feature/automacao-editorial, sem ativacao.
