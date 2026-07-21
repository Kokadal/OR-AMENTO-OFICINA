// Autenticação e sincronização com Firebase

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
      syncDataFromFirebase(); // Sincronizar ao entrar
      listenForRemoteChanges(currentUser.id, (remoteData) => {
        // Atualizar dados locais quando houver mudanças remotas
        if (remoteData.orcamentos) localStorage.setItem("oficina_orcamentos_v3", remoteData.orcamentos);
        if (remoteData.placas) localStorage.setItem("oficina_placas_salvas_v1", remoteData.placas);
        if (remoteData.rascunho) localStorage.setItem("oficina_rascunho_atual_v1", remoteData.rascunho);
        if (remoteData.dadosOficina) localStorage.setItem("oficina_dados_v1", remoteData.dadosOficina);
        // Recarregar a interface
        if (window.renderHome) renderHome();
      });
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

    // Validação simples (no futuro, usar Firebase Auth)
    if (username === "roberto" && password === "senha321@@") {
      // Criar ID de usuário determinístico
      const userId = btoa("roberto"); // Converter para base64 para ID consistente
      
      currentUser = { id: userId, username: "roberto" };
      localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));

      // Carregar dados do Firebase
      syncDataFromFirebase();
      
      // Escutar mudanças remotas
      listenForRemoteChanges(userId, (remoteData) => {
        if (remoteData.orcamentos) localStorage.setItem("oficina_orcamentos_v3", remoteData.orcamentos);
        if (remoteData.placas) localStorage.setItem("oficina_placas_salvas_v1", remoteData.placas);
        if (remoteData.rascunho) localStorage.setItem("oficina_rascunho_atual_v1", remoteData.rascunho);
        if (remoteData.dadosOficina) localStorage.setItem("oficina_dados_v1", remoteData.dadosOficina);
        if (window.renderHome) renderHome();
      });

      showApp();
    } else {
      loginError.style.display = "block";
      loginError.textContent = "Usuário ou senha inválido";
    }
  });
}

function showApp() {
  document.getElementById("loginView").style.display = "none";
  document.getElementById("appView").style.display = "block";
}

function syncDataToFirebase() {
  if (!currentUser || !db) return;

  const data = {
    orcamentos: localStorage.getItem("oficina_orcamentos_v3"),
    placas: localStorage.getItem("oficina_placas_salvas_v1"),
    rascunho: localStorage.getItem("oficina_rascunho_atual_v1"),
    dadosOficina: localStorage.getItem("oficina_dados_v1")
  };

  saveUserDataToFirebase(currentUser.id, data).catch(error => {
    console.error("Erro ao sincronizar:", error);
  });
}

function syncDataFromFirebase() {
  if (!currentUser || !db) return;

  loadUserDataFromFirebase(currentUser.id).then((data) => {
    if (data) {
      if (data.orcamentos) localStorage.setItem("oficina_orcamentos_v3", data.orcamentos);
      if (data.placas) localStorage.setItem("oficina_placas_salvas_v1", data.placas);
      if (data.rascunho) localStorage.setItem("oficina_rascunho_atual_v1", data.rascunho);
      if (data.dadosOficina) localStorage.setItem("oficina_dados_v1", data.dadosOficina);
    }
  });
}

function logout() {
  stopListening(currentUser?.id);
  currentUser = null;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem("oficina_orcamentos_v3");
  localStorage.removeItem("oficina_placas_salvas_v1");
  localStorage.removeItem("oficina_rascunho_atual_v1");
  localStorage.removeItem("oficina_dados_v1");
  location.reload();
}

// Interceptar salvamentos para sincronizar com Firebase
const originalSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function(key, value) {
  originalSetItem.call(this, key, value);

  const syncKeys = ["oficina_orcamentos_v3", "oficina_placas_salvas_v1", "oficina_rascunho_atual_v1", "oficina_dados_v1"];
  if (syncKeys.includes(key) && currentUser) {
    // Pequeno delay para evitar sincronizações muito frequentes
    setTimeout(() => syncDataToFirebase(), 500);
  }
};

// Auto-sincronizar periodicamente
setInterval(() => {
  if (currentUser) {
    syncDataToFirebase();
  }
}, SYNC_INTERVAL);

// Sincronizar ao sair da página
window.addEventListener("beforeunload", () => {
  if (currentUser) {
    syncDataToFirebase();
  }
});

// Inicializar autenticação quando o DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuth);
} else {
  initAuth();
}
