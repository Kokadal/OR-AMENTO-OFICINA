# Demo Oficina Fácil com leitura de placa

Esta versão altera o começo do fluxo:

1. Ao clicar no botão "+"
2. O app abre a câmera
3. O usuário pode capturar a placa
4. Caso não leia, existe botão "Manual"
5. A placa busca dados básicos simulados:
   - placa
   - modelo
   - ano
   - cor
6. Depois segue para cliente, telefone, email e orçamento
7. Gera PDF e compartilha WhatsApp/email

## Como testar

1. Extraia o ZIP.
2. Abra a pasta no VS Code.
3. Abra o `index.html`.
4. Para a câmera funcionar melhor, use Live Server no VS Code.
5. Placas de teste:
   - ABC1D23
   - BRA2E19
   - MOT3A45
   - XYZ1234

## Importante

A câmera funciona em navegador, mas alguns navegadores exigem HTTPS ou localhost.
Por isso, o ideal é abrir pelo Live Server do VS Code.

A leitura automática OCR da placa ainda está simulada.
Nesta DEMO, ao capturar, o app libera o campo manual.
Para virar app real, o próximo passo é integrar OCR ou uma API de leitura de placa.

## Sobre FIPE / placa

A FIPE oficial não oferece API pública oficial nem download da base completa.
Para consultar placa real e trazer modelo/ano/cor, geralmente é preciso usar API autorizada/paga ou serviço governamental autorizado.
O código já tem a função `consultarDadosVeiculo(placa)` preparada para trocar pela API real.
