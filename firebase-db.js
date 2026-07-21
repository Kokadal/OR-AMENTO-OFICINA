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

function initFirebase() {
  // Inicializar Firebase
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  auth = firebase.auth();

  // Configurar o banco em modo offline quando offline
  db.goOffline();
  db.goOnline();

  // Auto-sincronizar dados quando conexão for restaurada
  if (navigator.onLine) {
    syncAllDataToFirebase();
  }

  window.addEventListener("online", syncAllDataToFirebase);
}

function authenticateFirebaseUser(username, passwordHash) {
  return new Promise((resolve, reject) => {
    // Criar email fictício baseado no username
    const email = `${username}@oficina-app.local`;
    
    // Tentar criar usuário (se não existir)
    auth.createUserWithCustomToken(null).catch(() => {
      // Alternativa: usar autenticação anônima com identificador
      auth.signInAnonymously().then((result) => {
        // Salvar username no perfil
        result.user.updateProfile({ displayName: username }).then(() => {
          resolve(result.user.uid);
        }).catch(reject);
      }).catch(reject);
    });
  });
}

function saveUserDataToFirebase(userId, data) {
  if (!db || !userId) return Promise.resolve();

  return db.ref(`users/${userId}`).set({
    orcamentos: data.orcamentos,
    placas: data.placas,
    rascunho: data.rascunho,
    dadosOficina: data.dadosOficina,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  }).catch(error => {
    console.error("Erro ao salvar no Firebase:", error);
    throw error;
  });
}

function loadUserDataFromFirebase(userId) {
  if (!db || !userId) return Promise.resolve(null);

  return db.ref(`users/${userId}`).once("value").then((snapshot) => {
    return snapshot.val();
  }).catch(error => {
    console.error("Erro ao carregar do Firebase:", error);
    return null;
  });
}

function syncAllDataToFirebase() {
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

function listenForRemoteChanges(userId, callback) {
  if (!db || !userId) return;

  db.ref(`users/${userId}`).on("value", (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
}

function stopListening(userId) {
  if (!db || !userId) return;
  db.ref(`users/${userId}`).off("value");
}

// Carregar Firebase SDK
(function() {
  const script = document.createElement("script");
  script.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
  script.onload = function() {
    const script2 = document.createElement("script");
    script2.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
    script2.onload = function() {
      const script3 = document.createElement("script");
      script3.src = "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
      script3.onload = function() {
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
