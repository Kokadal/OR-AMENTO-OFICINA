# Correção câmera/manual/API Placas

Corrigido:
- Botão Manual agora funciona e abre tela de digitar placa.
- Botão Capturar não tenta mais simular leitura falsa; ele direciona para digitação da placa.
- Consulta real por placa usando API Placas.
- Token API Placas editável em Configurações > Alterar dados oficina.
- Fallback manual se API falhar.
- Cache do service worker atualizado para v7.

Importante:
A API Placas consulta uma PLACA digitada. Ela não faz OCR da imagem da câmera.
Para leitura automática pela câmera, o próximo passo é integrar OCR, como Tesseract.js, ou uma API de reconhecimento de placa por imagem.
