// Configuração Firebase Realtime Database

const firebaseConfig = {
  apiKey: "AIzaSyCLCLvcX_9N4ucz4A7qvImidvE_e74Bzms",
  authDomain: "oficina-roberto.firebaseapp.com",
  projectId: "oficina-roberto",
  storageBucket: "oficina-roberto.firebasestorage.app",
  messagingSenderId: "960654976967",
  appId: "1:960654976967:web:871008198346196010dbe2",
  databaseURL: "https://oficina-roberto.firebaseio.com"
};

let db = null;
let auth = null;
let firebaseReady = false;

// A autenticação não deve ficar bloqueada se o Firebase estiver indisponível.
// A promise sempre resolve: true quando pronto, false quando a inicialização falha.
const firebaseReadyPromise = new Promise((resolve) => {
  window.firebaseReadyResolve = resolve;
});

function finishFirebaseInit(isReady) {
  firebaseReady = isReady;
  window.firebaseReadyResolve(isReady);
}

// Variável global para currentUser (compartilhada com auth.js)
if (typeof currentUser === "undefined") {
  window.currentUser = null;
}

function initFirebase() {
  try {
    console.log("🔄 Inicializando Firebase...");
    // Inicializar Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.database();
    auth = firebase.auth();
    console.log("✅ Firebase inicializado com sucesso");
    console.log("Database URL:", firebaseConfig.databaseURL);
    finishFirebaseInit(true);
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase:", error);
    finishFirebaseInit(false);
  }
}

function saveUserDataToFirebase(userId, data) {
  if (!db || !userId) {
    console.warn("⚠️ Não posso salvar: Firebase ou userId não definidos");
    return Promise.resolve();
  }

  console.log("💾 Salvando dados do usuário", userId, "no Firebase");
  return db.ref(`users/${userId}`).set({
    orcamentos: data.orcamentos,
    placas: data.placas,
    rascunho: data.rascunho,
    dadosOficina: data.dadosOficina,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  }).then(() => {
    console.log("✅ Dados salvos com sucesso no Firebase");
  }).catch(error => {
    console.error("❌ Erro ao salvar no Firebase:", error);
    throw error;
  });
}

function loadUserDataFromFirebase(userId) {
  if (!db || !userId) {
    console.warn("⚠️ Não posso carregar: Firebase ou userId não definidos");
    return Promise.resolve(null);
  }

  console.log("📥 Carregando dados do usuário", userId, "do Firebase");
  return db.ref(`users/${userId}`).once("value").then((snapshot) => {
    const data = snapshot.val();
    console.log("✅ Dados carregados do Firebase:", data);
    return data;
  }).catch(error => {
    console.error("❌ Erro ao carregar do Firebase:", error);
    return null;
  });
}

function syncAllDataToFirebase() {
  if (!window.currentUser || !db) {
    console.warn("⚠️ Não posso sincronizar: usuário não logado ou Firebase não pronto");
    return Promise.resolve();
  }

  const data = {
    orcamentos: localStorage.getItem("oficina_orcamentos_v3"),
    placas: localStorage.getItem("oficina_placas_salvas_v1"),
    rascunho: localStorage.getItem("oficina_rascunho_atual_v1"),
    dadosOficina: localStorage.getItem("oficina_dados_v1")
  };

  console.log("📤 Sincronizando para Firebase...", data);
  return saveUserDataToFirebase(window.currentUser.id, data).catch(error => {
    console.error("❌ Erro ao sincronizar:", error);
  });
}

function listenForRemoteChanges(userId, callback) {
  if (!db || !userId) {
    console.warn("⚠️ Não posso escutar mudanças: Firebase ou userId não definidos");
    return;
  }

  console.log("👂 Escutando mudanças remotas para usuário", userId);
  db.ref(`users/${userId}`).on("value", (snapshot) => {
    const data = snapshot.val();
    if (data) {
      console.log("🔄 Mudanças remotas detectadas:", data);
      callback(data);
    }
  }, (error) => {
    console.error("❌ Erro ao escutar mudanças:", error);
  });
}

function stopListening(userId) {
  if (!db || !userId) {
    console.warn("⚠️ Não posso parar escuta: Firebase ou userId não definidos");
    return;
  }

  console.log("🛑 Parando escuta para usuário", userId);
  db.ref(`users/${userId}`).off("value");
}

// Carregar Firebase SDK
(function() {
  console.log("📦 Carregando Firebase SDK...");
  
  const script = document.createElement("script");
  script.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";
  script.onerror = function() {
    console.error("❌ Erro ao carregar firebase-app.js");
    finishFirebaseInit(false);
  };
  script.onload = function() {
    console.log("✅ Carregado firebase-app.js");
    const script2 = document.createElement("script");
    script2.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js";
    script2.onerror = function() {
      console.error("❌ Erro ao carregar firebase-database.js");
      finishFirebaseInit(false);
    };
    script2.onload = function() {
      console.log("✅ Carregado firebase-database.js");
      const script3 = document.createElement("script");
      script3.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js";
      script3.onerror = function() {
        console.error("❌ Erro ao carregar firebase-auth.js");
        finishFirebaseInit(false);
      };
      script3.onload = function() {
        console.log("✅ Carregado firebase-auth.js");
        // Firebase está pronto
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", initFirebase);
        } else {
          initFirebase();
        }
      };
      document.head.appendChild(script3);
    };
    document.head.appendChild(script2);
  };
  document.head.appendChild(script);
})();
