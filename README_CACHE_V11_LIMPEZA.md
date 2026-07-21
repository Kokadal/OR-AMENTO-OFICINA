# Atualização cache v11 + limpeza de testes

Arquivos incluídos:
- service-worker.js
- limpar-cache.html
- script.js atualizado para chamar registration.update()

## Como usar depois do commit

1. Suba todos os arquivos no GitHub.
2. Acesse uma vez:

https://souzanataliadev.github.io/orcamento-mecanico/limpar-cache.html

3. Clique em "Limpar tudo agora".
4. Depois clique em "Voltar para o app".

## Daqui para frente

Sempre que fizer uma atualização, altere no `service-worker.js`:

const CACHE_NAME = "orcamento-mecanico-v11";

para:

const CACHE_NAME = "orcamento-mecanico-v12";

Depois v13, v14, etc.

Isso força o navegador a abandonar cache antigo e baixar a versão nova.
