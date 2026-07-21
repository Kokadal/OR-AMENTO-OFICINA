// Autenticação e sincronização com servidor

let currentUser = null;
const AUTH_KEY = "auth_user_data";
const SYNC_INTERVAL = 5 * 60 * 1000; // Sincronizar a cada 5 minutos

function initAuth() {
  const loginView = document.getElementById("loginView");
  const appView = document.getElementById("appView");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");

  // Verificar se está logado
  const savedAuth = localStorage.getItem(AUTH_KEY);
  if (savedAuth) {
    try {
      currentUser = JSON.parse(savedAuth);
      showApp();
      syncDataFromServer(); // Sincronizar ao entrar
      return;
    } catch (error) {
      console.error("Erro ao restaurar autenticação:", error);
    }
  }

  // Mostrar tela de login
  loginView.style.display = "flex";
  appView.style.display = "none";

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    loginError.style.display = "none";
    loginError.textContent = "";

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (result.success) {
        currentUser = result.user;
        localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));

        // Restaurar dados do servidor
        if (result.data) {
          if (result.data.orcamentos) localStorage.setItem("oficina_orcamentos_v3", result.data.orcamentos);
          if (result.data.placas) localStorage.setItem("oficina_placas_salvas_v1", result.data.placas);
          if (result.data.rascunho) localStorage.setItem("oficina_rascunho_atual_v1", result.data.rascunho);
          if (result.data.dadosOficina) localStorage.setItem("oficina_dados_v1", result.data.dadosOficina);
        }

        showApp();
        syncDataFromServer();
      } else {
        loginError.style.display = "block";
        loginError.textContent = result.message || "Erro na autenticação";
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      loginError.style.display = "block";
      loginError.textContent = "Erro ao conectar com o servidor";
    }
  });
}

function showApp() {
  document.getElementById("loginView").style.display = "none";
  document.getElementById("appView").style.display = "block";
}

function syncDataToServer() {
  if (!currentUser) return;

  const data = {
    orcamentos: localStorage.getItem("oficina_orcamentos_v3"),
    placas: localStorage.getItem("oficina_placas_salvas_v1"),
    rascunho: localStorage.getItem("oficina_rascunho_atual_v1"),
    dadosOficina: localStorage.getItem("oficina_dados_v1")
  };

  fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: currentUser.id, data })
  }).catch(error => console.error("Erro ao sincronizar:", error));
}

function syncDataFromServer() {
  if (!currentUser) return;

  fetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: currentUser.id })
  })
    .then(response => response.json())
    .then(result => {
      if (result.success && result.data) {
        if (result.data.orcamentos) localStorage.setItem("oficina_orcamentos_v3", result.data.orcamentos);
        if (result.data.placas) localStorage.setItem("oficina_placas_salvas_v1", result.data.placas);
        if (result.data.rascunho) localStorage.setItem("oficina_rascunho_atual_v1", result.data.rascunho);
        if (result.data.dadosOficina) localStorage.setItem("oficina_dados_v1", result.data.dadosOficina);
      }
    })
    .catch(error => console.error("Erro ao sincronizar dados:", error));
}

function logout() {
  currentUser = null;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem("oficina_orcamentos_v3");
  localStorage.removeItem("oficina_placas_salvas_v1");
  localStorage.removeItem("oficina_rascunho_atual_v1");
  localStorage.removeItem("oficina_dados_v1");
  location.reload();
}

// Interceptar salvamentos para sincronizar com servidor
const originalSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function(key, value) {
  originalSetItem.call(this, key, value);

  const syncKeys = ["oficina_orcamentos_v3", "oficina_placas_salvas_v1", "oficina_rascunho_atual_v1", "oficina_dados_v1"];
  if (syncKeys.includes(key) && currentUser) {
    syncDataToServer();
  }
};

// Auto-sincronizar periodicamente
setInterval(() => {
  if (currentUser) {
    syncDataFromServer();
  }
}, SYNC_INTERVAL);

// Sincronizar ao sair da página
window.addEventListener("beforeunload", () => {
  if (currentUser) {
    syncDataToServer();
  }
});

// Inicializar autenticação quando o DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuth);
} else {
  initAuth();
}
