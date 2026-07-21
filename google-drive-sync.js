// Google Drive Sync Module
// Sincroniza dados do localStorage com Google Drive

const DRIVE_FOLDER_NAME = "AMMAR-OFICINA-BACKUP";
const BACKUP_FILE_NAME = "orcamentos-backup.json";
let gDriveAccessToken = localStorage.getItem("gDrive_accessToken");
let gDriveFolderId = localStorage.getItem("gDrive_folderId");

// ID do aplicativo OAuth (você precisa criar em console.cloud.google.com)
const CLIENT_ID = "SEU_CLIENT_ID_AQUI.apps.googleusercontent.com";
const API_KEY = "SUA_API_KEY_AQUI";
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive.file";

function initGoogleDrive() {
  gapi.load("client:auth2", async () => {
    try {
      await gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      });

      const authInstance = gapi.auth2.getAuthInstance();
      if (authInstance.isSignedIn.get()) {
        gDriveAccessToken = authInstance.currentUser.get().getAuthResponse().id_token;
        localStorage.setItem("gDrive_accessToken", gDriveAccessToken);
        updateSyncButton(true);
      }
    } catch (error) {
      console.error("Erro ao inicializar Google Drive:", error);
    }
  });
}

async function loginGoogleDrive() {
  try {
    const authInstance = gapi.auth2.getAuthInstance();
    await authInstance.signIn();
    gDriveAccessToken = authInstance.currentUser.get().getAuthResponse().id_token;
    localStorage.setItem("gDrive_accessToken", gDriveAccessToken);
    updateSyncButton(true);
    showNotification("✅ Conectado ao Google Drive!");
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    showNotification("❌ Erro ao conectar Google Drive");
  }
}

async function logoutGoogleDrive() {
  try {
    const authInstance = gapi.auth2.getAuthInstance();
    await authInstance.signOut();
    localStorage.removeItem("gDrive_accessToken");
    localStorage.removeItem("gDrive_folderId");
    gDriveAccessToken = null;
    gDriveFolderId = null;
    updateSyncButton(false);
    showNotification("✅ Desconectado do Google Drive");
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
  }
}

async function ensureSyncFolder() {
  if (gDriveFolderId) {
    return gDriveFolderId;
  }

  try {
    const response = await gapi.client.drive.files.list({
      q: `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      spaces: "drive",
      fields: "files(id, name)",
      pageSize: 1
    });

    if (response.result.files.length > 0) {
      gDriveFolderId = response.result.files[0].id;
      localStorage.setItem("gDrive_folderId", gDriveFolderId);
      return gDriveFolderId;
    }

    // Criar pasta se não existir
    const createResponse = await gapi.client.drive.files.create({
      resource: {
        name: DRIVE_FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder"
      },
      fields: "id"
    });

    gDriveFolderId = createResponse.result.id;
    localStorage.setItem("gDrive_folderId", gDriveFolderId);
    return gDriveFolderId;
  } catch (error) {
    console.error("Erro ao garantir pasta:", error);
    throw error;
  }
}

async function uploadBackupToDrive() {
  if (!gDriveAccessToken) {
    showNotification("❌ Faça login no Google Drive primeiro");
    return;
  }

  try {
    showNotification("📤 Enviando backup...");
    const folderId = await ensureSyncFolder();

    const backupData = {
      timestamp: new Date().toISOString(),
      orcamentos: localStorage.getItem("oficina_orcamentos_v3"),
      placas: localStorage.getItem("oficina_placas_salvas_v1"),
      rascunho: localStorage.getItem("oficina_rascunho_atual_v1"),
      dadosOficina: localStorage.getItem("oficina_dados_v1")
    };

    // Procurar arquivo existente
    const searchResponse = await gapi.client.drive.files.list({
      q: `name='${BACKUP_FILE_NAME}' and parents='${folderId}' and trashed=false`,
      spaces: "drive",
      fields: "files(id)",
      pageSize: 1
    });

    const fileId = searchResponse.result.files[0]?.id;

    if (fileId) {
      // Atualizar arquivo existente
      await gapi.client.drive.files.update({
        fileId: fileId,
        resource: { name: BACKUP_FILE_NAME },
        media: { mimeType: "application/json", body: JSON.stringify(backupData) }
      });
    } else {
      // Criar novo arquivo
      await gapi.client.drive.files.create({
        resource: {
          name: BACKUP_FILE_NAME,
          parents: [folderId],
          mimeType: "application/json"
        },
        media: { mimeType: "application/json", body: JSON.stringify(backupData) }
      });
    }

    showNotification("✅ Backup enviado com sucesso!");
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    showNotification("❌ Erro ao enviar backup");
  }
}

async function downloadBackupFromDrive() {
  if (!gDriveAccessToken) {
    showNotification("❌ Faça login no Google Drive primeiro");
    return;
  }

  try {
    showNotification("📥 Baixando backup...");
    const folderId = await ensureSyncFolder();

    const searchResponse = await gapi.client.drive.files.list({
      q: `name='${BACKUP_FILE_NAME}' and parents='${folderId}' and trashed=false`,
      spaces: "drive",
      fields: "files(id)",
      pageSize: 1
    });

    if (searchResponse.result.files.length === 0) {
      showNotification("⚠️ Nenhum backup encontrado na nuvem");
      return;
    }

    const fileId = searchResponse.result.files[0].id;
    const fileResponse = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: "media"
    });

    const backupData = fileResponse.result;

    // Restaurar dados
    if (backupData.orcamentos) localStorage.setItem("oficina_orcamentos_v3", backupData.orcamentos);
    if (backupData.placas) localStorage.setItem("oficina_placas_salvas_v1", backupData.placas);
    if (backupData.rascunho) localStorage.setItem("oficina_rascunho_atual_v1", backupData.rascunho);
    if (backupData.dadosOficina) localStorage.setItem("oficina_dados_v1", backupData.dadosOficina);

    showNotification("✅ Backup restaurado! Atualizando página...");
    setTimeout(() => window.location.reload(), 1500);
  } catch (error) {
    console.error("Erro ao fazer download:", error);
    showNotification("❌ Erro ao baixar backup");
  }
}

function updateSyncButton(isConnected) {
  const syncButton = document.getElementById("syncGoogleDriveButton");
  if (!syncButton) return;

  if (isConnected) {
    syncButton.textContent = "☁️ Sincronizar com Google Drive";
    syncButton.classList.add("connected");
  } else {
    syncButton.textContent = "🔓 Conectar Google Drive";
    syncButton.classList.remove("connected");
  }
}

function showNotification(message) {
  // Usa sistema de notificação existente ou cria um simples
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Auto-sincronizar a cada 5 minutos (se conectado)
setInterval(() => {
  if (gDriveAccessToken) {
    uploadBackupToDrive().catch(console.error);
  }
}, 5 * 60 * 1000);

// Sincronizar ao sair da página
window.addEventListener("beforeunload", () => {
  if (gDriveAccessToken) {
    navigator.sendBeacon("about:blank"); // Apenas para compatibilidade
    uploadBackupToDrive().catch(console.error);
  }
});
