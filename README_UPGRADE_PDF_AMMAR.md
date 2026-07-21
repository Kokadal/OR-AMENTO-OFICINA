# Upgrade - PDF AMMAR

Esta versão altera a geração da O.S/PDF para espelhar o modelo enviado da AMMAR.

Modelo aplicado:
- Cabeçalho cinza com AMMAR OFICINA MECANICA
- Endereço, telefone e e-mail
- Dados do Cliente
- Dados do Veículo
- Tabela de Serviços
- Tabela de Peças
- SOMA TOTAL em amarelo
- Link de aceite
- Fotos da O.S, caso existam

## Como o app separa serviço e peça

No campo "Diga o orçamento e valor", você pode escrever naturalmente:

alinhamento e balanceamento - 30 reais
mão de obra - 130
peça: 2 pneus dianteiros - 600 reais
peça: filtro de óleo - 40 reais

Se começar com `peça:` ele vai para Tabela de Peças.
Se começar com `serviço:` ele vai para Tabela de Serviços.
Se não informar, o app tenta classificar automaticamente.

## Arquivos para substituir

- index.html
- styles.css
- script.js
