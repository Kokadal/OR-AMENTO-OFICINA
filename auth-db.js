const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Simples "banco de dados" em JSON
const DB_FILE = path.join(__dirname, "data.json");
const USERS_FILE = path.join(__dirname, "users.json");

// Usuário padrão
const DEFAULT_USERS = [
  {
    id: "1",
    username: "roberto",
    passwordHash: crypto.createHash("sha256").update("senha321@@").digest("hex"),
    createdAt: new Date().toISOString()
  }
];

function ensureUsersFile() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2));
  }
}

function ensureDataFile() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2));
  }
}

function getUsers() {
  ensureUsersFile();
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch {
    return DEFAULT_USERS;
  }
}

function getUserData(userId) {
  ensureDataFile();
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    return data[userId] || null;
  } catch {
    return null;
  }
}

function saveUserData(userId, data) {
  ensureDataFile();
  try {
    const allData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    allData[userId] = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(allData, null, 2));
    return true;
  } catch (error) {
    console.error("Erro ao salvar dados:", error);
    return false;
  }
}

function authenticateUser(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  
  if (!user) return null;
  
  const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
  if (passwordHash === user.passwordHash) {
    return { id: user.id, username: user.username };
  }
  
  return null;
}

module.exports = {
  getUsers,
  getUserData,
  saveUserData,
  authenticateUser,
  ensureDataFile,
  ensureUsersFile
};
