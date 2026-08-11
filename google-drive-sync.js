// Google Drive Sync Module
// Autorização via Google Identity Services e arquivos via Drive REST API.

const DRIVE_ROOT_FOLDER_NAME = "AMMAR OFICINA";
const DRIVE_BUDGETS_FOLDER_NAME = "Orçamentos";
const BACKUP_FILE_NAME = "orcamentos-backup.json";
const CLIENT_ID = "914494869974-smoi7oqevn02iv8d8lldk3oamlvpakae.apps.googleusercontent.com";
const API_KEY = "AIzaSyCww4EvI6uEBbtNhAOhOM9xOziOG1Llgw4";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const DRIVE_API_URL = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3";

let gDriveAccessToken = null;
let gDriveTokenClient = null;
let gDriveTokenExpiresAt = 0;
let gDriveRootFolderId = localStorage.getItem("gDrive_rootFolderId");
let gDriveFolderId = localStorage.getItem("gDrive_folderId");

function initGoogleDrive() {
  if (!window.google?.accounts?.oauth2) {
    updateSyncButton(false);
    return false;
  }

  if (!gDriveTokenClient) {
    gDriveTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => {},
      error_callback: () => {},
    });
  }

  updateSyncButton(hasValidGoogleDriveToken());
  return true;
}

function hasValidGoogleDriveToken() {
  return Boolean(gDriveAccessToken && Date.now() < gDriveTokenExpiresAt - 30_000);
}

function requestGoogleDriveToken(prompt = "consent") {
  return new Promise((resolve, reject) => {
    if (!initGoogleDrive()) {
      reject(new Error("A biblioteca do Google ainda não carregou. Atualize a página e tente novamente."));
      return;
    }

    gDriveTokenClient.callback = (response) => {
      if (response?.error || !response?.access_token) {
        reject(new Error(response?.error_description || response?.error || "O Google não retornou um token de acesso."));
        return;
      }

      gDriveAccessToken = response.access_token;
      gDriveTokenExpiresAt = Date.now() + (Number(response.expires_in || 3600) * 1000);
      resolve(gDriveAccessToken);
    };

    gDriveTokenClient.error_callback = (error) => {
      reject(new Error(error?.message || error?.type || "A janela de autorização do Google foi fechada."));
    };

    gDriveTokenClient.requestAccessToken({ prompt });
  });
}

async function loginGoogleDrive() {
  try {
    showNotification("🔐 Conectando ao Google Drive...");
    await requestGoogleDriveToken("consent");
    const folderId = await ensureSyncFolder();
    updateSyncButton(true);
    showNotification("✅ Google Drive conectado e pasta da oficina criada!");
    return folderId;
  } catch (error) {
    console.error("Erro ao conectar Google Drive:", error);
    clearGoogleDriveSession(false);
    showNotification(`❌ ${error.message || "Erro ao conectar Google Drive"}`);
    return null;
  }
}

function logoutGoogleDrive() {
  const token = gDriveAccessToken;
  clearGoogleDriveSession(true);

  if (token && window.google?.accounts?.oauth2) {
    google.accounts.oauth2.revoke(token, () => {});
  }

  showNotification("✅ Google Drive desconectado");
}

function clearGoogleDriveSession(clearFolders) {
  gDriveAccessToken = null;
  gDriveTokenExpiresAt = 0;

  if (clearFolders) {
    gDriveRootFolderId = null;
    gDriveFolderId = null;
    localStorage.removeItem("gDrive_rootFolderId");
    localStorage.removeItem("gDrive_folderId");
  }

  // Remove tokens gravados pela implementação antiga.
  localStorage.removeItem("gDrive_accessToken");
  updateSyncButton(false);
}

async function driveFetch(path, options = {}) {
  if (!hasValidGoogleDriveToken()) {
    throw new Error("A conexão com o Google expirou. Toque em Conectar Google Drive novamente.");
  }

  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${path}${separator}key=${encodeURIComponent(API_KEY)}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${gDriveAccessToken}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    if (response.status === 401) clearGoogleDriveSession(false);
    throw new Error(details?.error?.message || `Erro do Google Drive (${response.status}).`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function escapeDriveQuery(value) {
  return String(value || "").replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

async function findDriveFolder(name, parentId = "") {
  const parentQuery = parentId ? ` and '${escapeDriveQuery(parentId)}' in parents` : "";
  const query = `name='${escapeDriveQuery(name)}' and mimeType='application/vnd.google-apps.folder'${parentQuery} and trashed=false`;
  const params = new URLSearchParams({
    q: query,
    spaces: "drive",
    fields: "files(id,name)",
    pageSize: "1",
  });
  const result = await driveFetch(`${DRIVE_API_URL}/files?${params}`);
  return result.files?.[0]?.id || null;
}

async function createDriveFolder(name, parentId = "") {
  const metadata = {
    name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) metadata.parents = [parentId];

  const result = await driveFetch(`${DRIVE_API_URL}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  });
  return result.id;
}

async function ensureSyncFolder() {
  if (gDriveFolderId) return gDriveFolderId;

  if (!gDriveRootFolderId) {
    gDriveRootFolderId = await findDriveFolder(DRIVE_ROOT_FOLDER_NAME);
    if (!gDriveRootFolderId) {
      gDriveRootFolderId = await createDriveFolder(DRIVE_ROOT_FOLDER_NAME);
    }
    localStorage.setItem("gDrive_rootFolderId", gDriveRootFolderId);
  }

  gDriveFolderId = await findDriveFolder(DRIVE_BUDGETS_FOLDER_NAME, gDriveRootFolderId);
  if (!gDriveFolderId) {
    gDriveFolderId = await createDriveFolder(DRIVE_BUDGETS_FOLDER_NAME, gDriveRootFolderId);
  }
  localStorage.setItem("gDrive_folderId", gDriveFolderId);
  return gDriveFolderId;
}

async function findDriveFile(name, parentId) {
  const query = `name='${escapeDriveQuery(name)}' and '${escapeDriveQuery(parentId)}' in parents and trashed=false`;
  const params = new URLSearchParams({
    q: query,
    spaces: "drive",
    fields: "files(id,name)",
    pageSize: "1",
  });
  const result = await driveFetch(`${DRIVE_API_URL}/files?${params}`);
  return result.files?.[0]?.id || null;
}

async function uploadJsonFile(name, parentId, data, existingFileId = null) {
  const boundary = `codex_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const metadata = { name, mimeType: "application/json" };
  if (!existingFileId) metadata.parents = [parentId];

  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(data),
    `--${boundary}--`,
  ].join("\r\n");

  const method = existingFileId ? "PATCH" : "POST";
  const filePath = existingFileId ? `/files/${encodeURIComponent(existingFileId)}` : "/files";
  return driveFetch(`${DRIVE_UPLOAD_URL}${filePath}?uploadType=multipart&fields=id`, {
    method,
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
}

async function uploadBackupToDrive() {
  if (!hasValidGoogleDriveToken()) {
    showNotification("❌ Conecte novamente ao Google Drive");
    return;
  }

  try {
    showNotification("📤 Enviando backup...");
    const folderId = await ensureSyncFolder();
    const backupData = {
      version: 2,
      timestamp: new Date().toISOString(),
      orcamentos: localStorage.getItem("oficina_orcamentos_v3"),
      placas: localStorage.getItem("oficina_placas_salvas_v1"),
      rascunho: localStorage.getItem("oficina_rascunho_atual_v1"),
      dadosOficina: localStorage.getItem("oficina_dados_v1"),
    };
    const fileId = await findDriveFile(BACKUP_FILE_NAME, folderId);
    await uploadJsonFile(BACKUP_FILE_NAME, folderId, backupData, fileId);
    showNotification("✅ Backup enviado com sucesso!");
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    showNotification(`❌ ${error.message || "Erro ao enviar backup"}`);
  }
}

async function downloadBackupFromDrive() {
  if (!hasValidGoogleDriveToken()) {
    showNotification("❌ Conecte novamente ao Google Drive");
    return;
  }

  try {
    showNotification("📥 Baixando backup...");
    const folderId = await ensureSyncFolder();
    const fileId = await findDriveFile(BACKUP_FILE_NAME, folderId);
    if (!fileId) {
      showNotification("⚠️ Nenhum backup encontrado na nuvem");
      return;
    }

    const backupData = await driveFetch(`${DRIVE_API_URL}/files/${encodeURIComponent(fileId)}?alt=media`);
    if (backupData.orcamentos) localStorage.setItem("oficina_orcamentos_v3", backupData.orcamentos);
    if (backupData.placas) localStorage.setItem("oficina_placas_salvas_v1", backupData.placas);
    if (backupData.rascunho) localStorage.setItem("oficina_rascunho_atual_v1", backupData.rascunho);
    if (backupData.dadosOficina) localStorage.setItem("oficina_dados_v1", backupData.dadosOficina);
    showNotification("✅ Backup restaurado! Atualizando página...");
    setTimeout(() => window.location.reload(), 1500);
  } catch (error) {
    console.error("Erro ao fazer download:", error);
    showNotification(`❌ ${error.message || "Erro ao baixar backup"}`);
  }
}

function updateSyncButton(isConnected) {
  const syncButton = document.getElementById("syncGoogleDriveButton");
  const uploadButton = document.getElementById("uploadBackupButton");
  const downloadButton = document.getElementById("downloadBackupButton");
  const logoutButton = document.getElementById("logoutGoogleDriveButton");
  if (!syncButton) return;

  syncButton.textContent = isConnected ? "☁️ Sincronizar com Google Drive" : "🔓 Conectar Google Drive";
  syncButton.classList.toggle("connected", isConnected);
  if (uploadButton) uploadButton.hidden = !isConnected;
  if (downloadButton) downloadButton.hidden = !isConnected;
  if (logoutButton) logoutButton.hidden = !isConnected;
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  notification.style.cssText = "position:fixed;top:20px;right:20px;max-width:min(380px,calc(100vw - 40px));background:#16191c;color:white;padding:12px 20px;border:1px solid #303740;border-radius:8px;z-index:10000;box-shadow:0 12px 28px rgba(0,0,0,.35)";
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 4200);
}

setInterval(() => {
  if (hasValidGoogleDriveToken()) uploadBackupToDrive().catch(console.error);
}, 5 * 60 * 1000);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGoogleDrive, { once: true });
} else {
  initGoogleDrive();
}
