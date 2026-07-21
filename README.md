# Orcamento Mecanico

Site simples para criar um orcamento de oficina e enviar a mensagem pronta pelo WhatsApp.

## Como abrir

Abra o arquivo `index.html` no navegador.

Para usar como app instalavel, rode com servidor local:

```bash
PATH="$PWD/.tools/node/bin:$PATH" npm start
```

Depois acesse `http://localhost:3000`.

No Android/Chrome ou desktop/Chrome, use o botao `Instalar app` quando ele aparecer. No iPhone/Safari, use compartilhar e depois `Adicionar a Tela de Inicio`.

Para validar o JavaScript:

```bash
PATH="$PWD/.tools/node/bin:$PATH" npm run check
```

Para gerar novamente os icones do app:

```bash
PATH="$PWD/.tools/node/bin:$PATH" npm run generate-icons
```

Para criar/recriar o repositorio Git local:

```bash
PATH="$PWD/.tools/node/bin:$PATH" npm run init-repo
```

## O que ja esta pronto

- Home com timeline de orcamentos salvos
- Busca por cliente, O.S ou placa
- Menu lateral simples
- Fluxo pelo botao +
- Tela de camera para leitura simulada de placa
- Entrada manual de placa antiga ou Mercosul
- Consulta mock preparada em `consultarDadosVeiculo(placa)`
- Base propria de placas: veiculo confirmado fica salvo para preencher automaticamente na proxima O.S
- Confirmacao editavel do veiculo
- Cadastro do cliente em etapas simples
- Orcamento por texto com parser de itens, valores e desconto
- Calculo automatico de subtotal, desconto e total
- Historico em localStorage
- Geracao de PDF via impressao/salvar PDF
- Compartilhamento por WhatsApp e email
- Layout responsivo para celular e computador
- PWA instalavel com icone, manifesto e cache offline basico

## Proximos passos possiveis

- Adicionar logo e dados da oficina
- Gerar PDF do orcamento
- Salvar historico de orcamentos
- Criar login para mais de um mecanico
