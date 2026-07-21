# Versão completa - AMMAR

Incluído nesta versão única:
- API Placas funcionando via placa digitada
- Scanner OCR pela câmera usando Tesseract.js
- Fallback manual quando OCR não lê
- Valores inteligentes no orçamento:
  - "alinhamento 50" = R$ 50,00
  - "2 pivôs 10" = qtd 2 x R$ 10,00 = R$ 20,00
  - "desconto 10%" ou "desconto 50"
- Correção do travamento ao finalizar orçamento
- Botão excluir orçamento
- Logo AMMAR no PDF/O.S
- Modelo de PDF mais profissional com logo, tabelas, total e link de aceite
- Cache atualizado para v10

Arquivos para substituir no GitHub:
- index.html
- styles.css
- script.js
- service-worker.js
- manifest.webmanifest
- logooficina.jpg

Observação:
O OCR gratuito depende de iluminação, enquadramento e qualidade da câmera.
Para produção profissional, futuramente pode ser integrado OCR especializado por imagem.
