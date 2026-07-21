const http = require("node:http");
const url = require("url");
const querystring = require("querystring");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const { authenticateUser, getUserData, saveUserData } = require("./auth-db");

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";
const root = __dirname;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
};

function resolveRequestPath(url) {
  const parsedUrl = new URL(url, `http://${host}:${port}`);
  const requestedPath = parsedUrl.pathname === "/" ? "/index.html" : parsedUrl.pathname;
  const filePath = path.normalize(path.join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    return null;
  }

  return filePath;
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function getBodyAsJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 1e6) {
        request.connection.destroy();
        reject(new Error("Payload muito grande"));
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

const server = http.createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  // API Routes
  if (request.url.startsWith("/api/login") && request.method === "POST") {
    try {
      const body = await getBodyAsJson(request);
      const user = authenticateUser(body.username, body.password);
      
      if (user) {
        const userData = getUserData(user.id);
        sendJson(response, 200, { success: true, user, data: userData });
      } else {
        sendJson(response, 401, { success: false, message: "Usuário ou senha inválido" });
      }
    } catch (error) {
      sendJson(response, 400, { success: false, message: error.message });
    }
    return;
  }

  if (request.url.startsWith("/api/save") && request.method === "POST") {
    try {
      const body = await getBodyAsJson(request);
      const { userId, data } = body;
      
      if (!userId) {
        sendJson(response, 400, { success: false, message: "userId obrigatório" });
        return;
      }
      
      const success = saveUserData(userId, data);
      sendJson(response, success ? 200 : 500, { success });
    } catch (error) {
      sendJson(response, 400, { success: false, message: error.message });
    }
    return;
  }

  if (request.url.startsWith("/api/data") && request.method === "POST") {
    try {
      const body = await getBodyAsJson(request);
      const { userId } = body;
      
      if (!userId) {
        sendJson(response, 400, { success: false, message: "userId obrigatório" });
        return;
      }
      
      const data = getUserData(userId);
      sendJson(response, 200, { success: true, data });
    } catch (error) {
      sendJson(response, 400, { success: false, message: error.message });
    }
    return;
  }

  // Static files
  const filePath = resolveRequestPath(request.url);

  if (!filePath) {
    response.writeHead(403);
    response.end("Acesso negado");
    return;
  }

  try {
    const body = await readFile(filePath);
    const contentType = contentTypes[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Arquivo nao encontrado");
  }
});

server.listen(port, host, () => {
  console.log(`Servidor iniciado em http://localhost:${port}`);
});
