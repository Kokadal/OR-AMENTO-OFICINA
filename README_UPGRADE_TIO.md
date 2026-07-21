# Upgrade - Orçamento Mecânico

Esta versão adiciona os pedidos novos:

- Data da O.S aparece na timeline, detalhes e PDF
- Status da O.S: pendente, aprovado, reprovado
- Editar orçamento depois de criado
- Adicionar fotos e arquivos depois que a O.S foi criada
- Link de aceite no WhatsApp/PDF:
  - aprovar orçamento
  - reprovar orçamento
- Ao abrir o link de aceite, o app tenta mudar o status da O.S na timeline

## Arquivos principais

Substitua no projeto:

- `index.html`
- `script.js`
- `styles.css`

## Atenção importante sobre link de aceite

Como este app ainda usa apenas `localStorage`, o link de aceite só consegue alterar o status quando a O.S existe no mesmo navegador/aparelho.

Para funcionar 100% com cliente abrindo no próprio celular, o próximo passo é ligar em Firebase/Supabase/backend.

## Como testar

1. Substitua os arquivos no repo.
2. Rode localmente.
3. Crie uma O.S.
4. Abra o detalhe.
5. Clique em "Gerar PDF".
6. Veja os links de aprovar/reprovar.
7. Teste também pelo WhatsApp.
