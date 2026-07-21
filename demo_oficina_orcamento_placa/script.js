let etapa = 0;
let orcamentoAtual = {};
let ultimoOrcamentoGerado = null;
let streamCamera = null;

const oficina = {
  nome: "Oficina Mecânica Exemplo",
  telefone: "(11) 99999-9999",
  endereco: "Rua Exemplo, 123 - São Paulo/SP"
};

/*
  DEMO:
  Essa base local simula o retorno de uma consulta por placa.
  Depois você pode trocar a função consultarDadosVeiculo() por uma API autorizada.
*/
const baseVeiculosDemo = {
  "ABC1D23": { placa: "ABC1D23", modelo: "Honda Civic", ano: "2020", cor: "Prata" },
  "BRA2E19": { placa: "BRA2E19", modelo: "Toyota Corolla", ano: "2021", cor: "Branco" },
  "MOT3A45": { placa: "MOT3A45", modelo: "Honda CG 160", ano: "2022", cor: "Vermelha" },
  "XYZ1234": { placa: "XYZ1234", modelo: "Volkswagen Gol", ano: "2018", cor: "Preto" }
};

let orcamentos = JSON.parse(localStorage.getItem("orcamentosOficina")) || [];

const etapas = [
  {
    titulo: "Nome do cliente",
    ajuda: "Digite o nome do cliente.",
    campo: "nome",
    tipo: "text",
    obrigatorio: true,
    placeholder: "Ex: João Silva"
  },
  {
    titulo: "Telefone",
    ajuda: "Digite o telefone do cliente.",
    campo: "telefone",
    tipo: "tel",
    obrigatorio: true,
    placeholder: "Ex: (11) 99999-9999"
  },
  {
    titulo: "Email",
    ajuda: "Email não é obrigatório. Pode deixar em branco.",
    campo: "email",
    tipo: "email",
    obrigatorio: false,
    placeholder: "Ex: cliente@email.com"
  },
  {
    titulo: "Diga o orçamento e valor",
    ajuda: "Digite um item por linha. Exemplo: alinhamento - 30 reais",
    campo: "textoOrcamento",
    tipo: "textarea",
    obrigatorio: true,
    placeholder: "alinhamento e balanceamento - 30 reais\ntroca de 2 pneus dianteiros - 60 reais\nmao de obra - 130\naplica desconto de 10%"
  }
];

function salvar() {
  localStorage.setItem("orcamentosOficina", JSON.stringify(orcamentos));
}

function mostrarTela(id) {
  document.querySelectorAll(".tela").forEach(tela => tela.classList.remove("ativa"));
  document.getElementById(id).classList.add("ativa");

  if (id !== "telaPlaca") {
    pararCamera();
  }
}

function abrirMenu() {
  document.getElementById("menuLateral").classList.add("ativo");
}

function fecharMenu() {
  document.getElementById("menuLateral").classList.remove("ativo");
}

function focarBusca() {
  document.getElementById("busca").focus();
}

function renderizarLista() {
  const lista = document.getElementById("listaOrcamentos");
  const busca = document.getElementById("busca").value.toLowerCase().trim();

  const filtrados = orcamentos.filter(o => {
    const texto = `${o.numero} ${o.nome} ${o.veiculo?.placa || ""}`.toLowerCase();
    return texto.includes(busca);
  });

  if (filtrados.length === 0) {
    lista.innerHTML = `<p class="vazio">Nenhum orçamento encontrado.</p>`;
    return;
  }

  lista.innerHTML = filtrados.map(o => `
    <div class="item-orcamento" onclick="abrirOrcamento(${o.numero})">
      <strong>O.S #${o.numero} - ${o.nome}</strong>
      <span>${o.veiculo?.placa || "Sem placa"} • Total: R$ ${formatarMoeda(o.totalFinal)} • ${o.data}</span>
    </div>
  `).join("");
}

async function abrirLeituraPlaca() {
  orcamentoAtual = {};
  document.getElementById("areaManual").classList.add("escondido");
  setStatusPlaca("Abrindo câmera...");
  mostrarTela("telaPlaca");

  try {
    streamCamera = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    document.getElementById("camera").srcObject = streamCamera;
    setStatusPlaca("Câmera aberta. Aponte para a placa e clique em capturar.");
  } catch (erro) {
    setStatusPlaca("Não foi possível abrir a câmera. Use a opção Manual.");
    abrirManualPlaca();
  }
}

function pararCamera() {
  if (streamCamera) {
    streamCamera.getTracks().forEach(track => track.stop());
    streamCamera = null;
  }
}

function abrirManualPlaca() {
  document.getElementById("areaManual").classList.remove("escondido");
  setTimeout(() => document.getElementById("placaManual").focus(), 100);
}

function capturarPlaca() {
  /*
    Aqui entraria o OCR real.
    Em uma versão final, dá para integrar:
    - OCR no navegador, como Tesseract.js
    - API externa de leitura de placa por imagem
    - Serviço nativo no app mobile

    Para esta DEMO offline, após capturar a imagem, liberamos o campo manual.
  */
  const video = document.getElementById("camera");
  const canvas = document.getElementById("fotoPlaca");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 360;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  setStatusPlaca("Imagem capturada. Nesta DEMO, digite a placa no campo Manual para consultar.");
  abrirManualPlaca();
}

function confirmarPlacaManual() {
  const placa = limparPlaca(document.getElementById("placaManual").value);

  if (!validarPlaca(placa)) {
    alert("Digite uma placa válida. Ex: ABC1D23 ou ABC1234");
    return;
  }

  buscarDadosPelaPlaca(placa);
}

async function buscarDadosPelaPlaca(placa) {
  setStatusPlaca("Buscando dados do veículo...");

  const dados = await consultarDadosVeiculo(placa);

  document.getElementById("veiculoPlaca").value = dados.placa || placa;
  document.getElementById("veiculoModelo").value = dados.modelo || "";
  document.getElementById("veiculoAno").value = dados.ano || "";
  document.getElementById("veiculoCor").value = dados.cor || "";

  mostrarTela("telaVeiculo");
}

async function consultarDadosVeiculo(placa) {
  /*
    TROCAR DEPOIS POR API REAL/AUTORIZADA:

    Exemplo estrutural:
    const resposta = await fetch(`https://sua-api.com/placa/${placa}`, {
      headers: { Authorization: "Bearer SEU_TOKEN" }
    });
    return await resposta.json();

    Para esta DEMO funcionar offline, usamos baseVeiculosDemo.
  */

  await new Promise(resolve => setTimeout(resolve, 500));

  return baseVeiculosDemo[placa] || {
    placa,
    modelo: "",
    ano: "",
    cor: ""
  };
}

function confirmarVeiculo() {
  const veiculo = {
    placa: limparPlaca(document.getElementById("veiculoPlaca").value),
    modelo: document.getElementById("veiculoModelo").value.trim(),
    ano: document.getElementById("veiculoAno").value.trim(),
    cor: document.getElementById("veiculoCor").value.trim()
  };

  if (!validarPlaca(veiculo.placa)) {
    alert("Informe uma placa válida.");
    return;
  }

  orcamentoAtual.veiculo = veiculo;
  iniciarDadosCliente();
}

function iniciarDadosCliente() {
  etapa = 0;
  mostrarTela("telaCriar");
  renderizarEtapa();
}

function renderizarEtapa() {
  const e = etapas[etapa];
  document.getElementById("tituloEtapa").innerText = e.titulo;
  document.getElementById("textoAjuda").innerText = e.ajuda;
  document.getElementById("btnProximo").innerText = etapa === etapas.length - 1 ? "Enviar" : "Próximo";

  const valor = orcamentoAtual[e.campo] || "";

  if (e.tipo === "textarea") {
    document.getElementById("conteudoEtapa").innerHTML = `
      <textarea id="campoAtual" class="campo" placeholder="${e.placeholder}">${valor}</textarea>
    `;
  } else {
    document.getElementById("conteudoEtapa").innerHTML = `
      <input id="campoAtual" class="campo" type="${e.tipo}" placeholder="${e.placeholder}" value="${valor}">
    `;
  }

  setTimeout(() => document.getElementById("campoAtual").focus(), 100);
}

function proximaEtapa() {
  const e = etapas[etapa];
  const campo = document.getElementById("campoAtual");
  const valor = campo.value.trim();

  if (e.obrigatorio && !valor) {
    alert("Preencha este campo para continuar.");
    campo.focus();
    return;
  }

  orcamentoAtual[e.campo] = valor;

  if (etapa < etapas.length - 1) {
    etapa++;
    renderizarEtapa();
  } else {
    gerarOrcamento();
  }
}

function voltarEtapa() {
  if (etapa > 0) {
    etapa--;
    renderizarEtapa();
  } else {
    mostrarTela("telaVeiculo");
  }
}

function gerarOrcamento() {
  const resultado = interpretarTextoOrcamento(orcamentoAtual.textoOrcamento);
  const numero = orcamentos.length > 0 ? Math.max(...orcamentos.map(o => o.numero)) + 1 : 1;

  ultimoOrcamentoGerado = {
    numero,
    nome: orcamentoAtual.nome,
    telefone: orcamentoAtual.telefone,
    email: orcamentoAtual.email || "",
    veiculo: orcamentoAtual.veiculo,
    itens: resultado.itens,
    descontoPercentual: resultado.descontoPercentual,
    subtotal: resultado.subtotal,
    totalFinal: resultado.totalFinal,
    data: new Date().toLocaleDateString("pt-BR")
  };

  orcamentos.push(ultimoOrcamentoGerado);
  salvar();
  mostrarResultado(ultimoOrcamentoGerado);
}

function interpretarTextoOrcamento(texto) {
  const linhas = texto.split("\n").map(l => l.trim()).filter(Boolean);
  const itens = [];
  let descontoPercentual = 0;

  linhas.forEach(linha => {
    const linhaLower = linha.toLowerCase();

    if (linhaLower.includes("desconto")) {
      const descontoEncontrado = linha.match(/(\d+(?:[,.]\d+)?)\s*%/);
      if (descontoEncontrado) {
        descontoPercentual = parseFloat(descontoEncontrado[1].replace(",", "."));
      }
      return;
    }

    const valorEncontrado = linha.match(/(\d+(?:[,.]\d+)?)(\s*reais|\s*real|$)/i);

    if (valorEncontrado) {
      const valor = parseFloat(valorEncontrado[1].replace(",", "."));
      const descricao = linha
        .replace(valorEncontrado[0], "")
        .replace(/[-–—]/g, "")
        .trim();

      itens.push({
        descricao: descricao || "Item do orçamento",
        valor
      });
    }
  });

  const subtotal = itens.reduce((soma, item) => soma + item.valor, 0);
  const totalFinal = subtotal - (subtotal * descontoPercentual / 100);

  return { itens, descontoPercentual, subtotal, totalFinal };
}

function mostrarResultado(orcamento) {
  ultimoOrcamentoGerado = orcamento;
  mostrarTela("telaResultado");

  document.getElementById("previewOrcamento").innerText = montarTextoOrcamento(orcamento);
}

function montarTextoOrcamento(o) {
  const linhasItens = o.itens.map(item => {
    return `${item.descricao.toUpperCase()} --- R$ ${formatarMoeda(item.valor)}`;
  }).join("\n");

  return `${oficina.nome}
Telefone: ${oficina.telefone}
Endereço: ${oficina.endereco}

ORÇAMENTO / O.S #${o.numero}
Data: ${o.data}

Cliente: ${o.nome}
Telefone: ${o.telefone}
Email: ${o.email || "Não informado"}

VEÍCULO
Placa: ${o.veiculo?.placa || "Não informado"}
Modelo: ${o.veiculo?.modelo || "Não informado"}
Ano: ${o.veiculo?.ano || "Não informado"}
Cor: ${o.veiculo?.cor || "Não informado"}

ITEM --- VALOR
${linhasItens}

Subtotal: R$ ${formatarMoeda(o.subtotal)}
Desconto: ${o.descontoPercentual}%
VALOR FINAL: R$ ${formatarMoeda(o.totalFinal)}`;
}

function baixarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const o = ultimoOrcamentoGerado;

  doc.setFontSize(18);
  doc.text(oficina.nome, 14, 18);

  doc.setFontSize(11);
  doc.text(`Telefone: ${oficina.telefone}`, 14, 26);
  doc.text(`Endereço: ${oficina.endereco}`, 14, 33);

  doc.setFontSize(15);
  doc.text(`ORÇAMENTO / O.S #${o.numero}`, 14, 48);

  doc.setFontSize(11);
  doc.text(`Data: ${o.data}`, 14, 56);
  doc.text(`Cliente: ${o.nome}`, 14, 64);
  doc.text(`Telefone: ${o.telefone}`, 14, 72);
  doc.text(`Email: ${o.email || "Não informado"}`, 14, 80);

  doc.setFontSize(13);
  doc.text("VEÍCULO", 14, 94);
  doc.setFontSize(11);
  doc.text(`Placa: ${o.veiculo?.placa || "Não informado"}`, 14, 103);
  doc.text(`Modelo: ${o.veiculo?.modelo || "Não informado"}`, 14, 111);
  doc.text(`Ano: ${o.veiculo?.ano || "Não informado"}`, 14, 119);
  doc.text(`Cor: ${o.veiculo?.cor || "Não informado"}`, 14, 127);

  doc.setFontSize(13);
  doc.text("ITEM", 14, 145);
  doc.text("VALOR", 160, 145);

  let y = 155;
  o.itens.forEach(item => {
    doc.setFontSize(11);
    doc.text(item.descricao.toUpperCase(), 14, y);
    doc.text(`R$ ${formatarMoeda(item.valor)}`, 160, y);
    y += 9;
  });

  y += 8;
  doc.text(`Subtotal: R$ ${formatarMoeda(o.subtotal)}`, 14, y);
  y += 8;
  doc.text(`Desconto: ${o.descontoPercentual}%`, 14, y);
  y += 10;

  doc.setFontSize(15);
  doc.text(`VALOR FINAL: R$ ${formatarMoeda(o.totalFinal)}`, 14, y);

  doc.save(`orcamento_OS_${o.numero}_${o.nome}.pdf`);
}

function compartilharWhatsApp() {
  const texto = encodeURIComponent(montarTextoOrcamento(ultimoOrcamentoGerado));
  window.open(`https://wa.me/?text=${texto}`, "_blank");
}

function compartilharEmail() {
  const assunto = encodeURIComponent(`Orçamento O.S #${ultimoOrcamentoGerado.numero}`);
  const corpo = encodeURIComponent(montarTextoOrcamento(ultimoOrcamentoGerado));
  window.location.href = `mailto:${ultimoOrcamentoGerado.email || ""}?subject=${assunto}&body=${corpo}`;
}

function abrirOrcamento(numero) {
  const encontrado = orcamentos.find(o => o.numero === numero);
  if (encontrado) {
    mostrarResultado(encontrado);
  }
}

function voltarLista() {
  pararCamera();
  mostrarTela("telaLista");
  renderizarLista();
}

function limparPlaca(placa) {
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function validarPlaca(placa) {
  const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  const antiga = /^[A-Z]{3}[0-9]{4}$/;
  return mercosul.test(placa) || antiga.test(placa);
}

function formatarMoeda(valor) {
  return Number(valor).toFixed(2).replace(".", ",");
}

function setStatusPlaca(texto) {
  const status = document.getElementById("statusPlaca");
  status.innerText = texto;
  status.classList.add("ativo");
}

renderizarLista();
