// Autenticação e sincronização com Firebase

window.currentUser = null;
const AUTH_KEY = "auth_user_data";
const SYNC_INTERVAL = 5 * 60 * 1000; // Sincronizar a cada 5 minutos

function initAuth() {
  const loginView = document.getElementById("loginView");
  const appView = document.getElementById("appView");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");

  // Aguardar Firebase estar pronto ANTES de fazer qualquer sincronização
  Promise.resolve(firebaseReadyPromise).then(() => {
    console.log("✅ Firebase pronto! Iniciando autenticação...");
    
    // Verificar se está logado
    const savedAuth = localStorage.getItem(AUTH_KEY);
    if (savedAuth) {
      try {
        window.currentUser = JSON.parse(savedAuth);
        console.log("✅ Usuário restaurado:", window.currentUser);
        showApp();
        syncDataFromFirebase(); // Sincronizar ao entrar
        listenForRemoteChanges(window.currentUser.id, (remoteData) => {
          console.log("🔄 Atualizando dados locais com mudanças remotas...");
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
        console.error("❌ Erro ao restaurar autenticação:", error);
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

      // Validação simples
      if (username === "roberto" && password === "senha321@@") {
        console.log("✅ Login bem-sucedido para:", username);
        // Criar ID de usuário determinístico
        const userId = btoa("roberto"); // Converter para base64 para ID consistente
        
        window.currentUser = { id: userId, username: "roberto" };
        localStorage.setItem(AUTH_KEY, JSON.stringify(window.currentUser));

        // Carregar dados do Firebase
        syncDataFromFirebase().then(() => {
          // Escutar mudanças remotas
          listenForRemoteChanges(userId, (remoteData) => {
            console.log("🔄 Atualizando dados com sincronização remota...");
            if (remoteData.orcamentos) localStorage.setItem("oficina_orcamentos_v3", remoteData.orcamentos);
            if (remoteData.placas) localStorage.setItem("oficina_placas_salvas_v1", remoteData.placas);
            if (remoteData.rascunho) localStorage.setItem("oficina_rascunho_atual_v1", remoteData.rascunho);
            if (remoteData.dadosOficina) localStorage.setItem("oficina_dados_v1", remoteData.dadosOficina);
            if (window.renderHome) renderHome();
          });

          showApp();
        });
      } else {
        loginError.style.display = "block";
        loginError.textContent = "Usuário ou senha inválido";
      }
    });
  }).catch(error => {
    console.error("❌ Erro ao inicializar Firebase:", error);
    loginError.style.display = "block";
    loginError.textContent = "Erro ao conectar com servidor Firebase";
  });
}

function showApp() {
  document.getElementById("loginView").style.display = "none";
  document.getElementById("appView").style.display = "block";
}

function syncDataToFirebase() {
  if (!window.currentUser || !db) {
    console.warn("⚠️ Não posso sincronizar: usuário não logado ou Firebase não pronto");
    return;
  }

  const data = {
    orcamentos: localStorage.getItem("oficina_orcamentos_v3"),
    placas: localStorage.getItem("oficina_placas_salvas_v1"),
    rascunho: localStorage.getItem("oficina_rascunho_atual_v1"),
    dadosOficina: localStorage.getItem("oficina_dados_v1")
  };

  console.log("📤 Sincronizando dados do usuário...");
  saveUserDataToFirebase(window.currentUser.id, data).catch(error => {
    console.error("❌ Erro ao sincronizar:", error);
  });
}

function syncDataFromFirebase() {
  if (!window.currentUser || !db) {
    console.warn("⚠️ Não posso carregar: usuário não logado ou Firebase não pronto");
    return Promise.resolve();
  }

  console.log("📥 Carregando dados do Firebase...");
  return loadUserDataFromFirebase(window.currentUser.id).then((data) => {
    if (data) {
      console.log("✅ Dados carregados, atualizando localStorage...");
      if (data.orcamentos) localStorage.setItem("oficina_orcamentos_v3", data.orcamentos);
      if (data.placas) localStorage.setItem("oficina_placas_salvas_v1", data.placas);
      if (data.rascunho) localStorage.setItem("oficina_rascunho_atual_v1", data.rascunho);
      if (data.dadosOficina) localStorage.setItem("oficina_dados_v1", data.dadosOficina);
    }
  });
}

function logout() {
  stopListening(window.currentUser?.id);
  window.currentUser = null;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem("oficina_orcamentos_v3");
  localStorage.removeItem("oficina_placas_salvas_v1");
  localStorage.removeItem("oficina_rascunho_atual_v1");
  localStorage.removeItem("oficina_dados_v1");
  console.log("👋 Logout realizado");
  location.reload();
}

// Interceptar salvamentos para sincronizar com Firebase
const originalSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function(key, value) {
  originalSetItem.call(this, key, value);

  const syncKeys = ["oficina_orcamentos_v3", "oficina_placas_salvas_v1", "oficina_rascunho_atual_v1", "oficina_dados_v1"];
  if (syncKeys.includes(key) && window.currentUser) {
    console.log("💾 Detectada mudança em localStorage, sincronizando...", key);
    // Pequeno delay para evitar sincronizações muito frequentes
    setTimeout(() => syncDataToFirebase(), 500);
  }
};

// Auto-sincronizar periodicamente
setInterval(() => {
  if (window.currentUser) {
    console.log("⏰ Sincronização periódica...");
    syncDataToFirebase();
  }
}, SYNC_INTERVAL);

// Sincronizar ao sair da página
window.addEventListener("beforeunload", () => {
  if (window.currentUser) {
    console.log("👋 Sincronizando antes de sair...");
    syncDataToFirebase();
  }
});

// Inicializar autenticação quando o DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuth);
} else {
  initAuth();
}
