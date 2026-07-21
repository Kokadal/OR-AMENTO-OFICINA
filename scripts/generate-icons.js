const { mkdirSync, writeFileSync } = require("node:fs");
const { deflateSync } = require("node:zlib");
const path = require("node:path");

const outputDir = path.join(__dirname, "..", "assets");

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function drawIcon(size) {
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  const teal = [17, 106, 91, 255];
  const white = [255, 255, 255, 255];
  const soft = [215, 237, 232, 255];

  function setPixel(x, y, color) {
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    pixels[offset] = color[0];
    pixels[offset + 1] = color[1];
    pixels[offset + 2] = color[2];
    pixels[offset + 3] = color[3];
  }

  function fillRect(x1, y1, x2, y2, color) {
    for (let y = y1; y < y2; y += 1) {
      for (let x = x1; x < x2; x += 1) {
        setPixel(x, y, color);
      }
    }
  }

  for (let y = 0; y < size; y += 1) {
    pixels[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x += 1) {
      setPixel(x, y, teal);
    }
  }

  const scale = size / 512;
  const cx = 178 * scale;
  const cy = 256 * scale;
  const outer = 82 * scale;
  const inner = 45 * scale;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot(x - cx, y - cy);
      if (distance <= outer && distance >= inner) {
        setPixel(x, y, white);
      }
    }
  }

  fillRect(Math.floor(292 * scale), Math.floor(168 * scale), Math.floor(336 * scale), Math.floor(344 * scale), white);
  fillRect(Math.floor(440 * scale), Math.floor(168 * scale), Math.floor(488 * scale), Math.floor(344 * scale), white);
  fillRect(Math.floor(336 * scale), Math.floor(168 * scale), Math.floor(378 * scale), Math.floor(218 * scale), white);
  fillRect(Math.floor(402 * scale), Math.floor(168 * scale), Math.floor(444 * scale), Math.floor(218 * scale), white);
  fillRect(Math.floor(378 * scale), Math.floor(218 * scale), Math.floor(402 * scale), Math.floor(314 * scale), white);
  fillRect(Math.floor(112 * scale), Math.floor(384 * scale), Math.floor(400 * scale), Math.floor(408 * scale), soft);

  return pixels;
}

function createPng(size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(drawIcon(size))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(path.join(outputDir, "icon-192.png"), createPng(192));
writeFileSync(path.join(outputDir, "icon-512.png"), createPng(512));
writeFileSync(path.join(outputDir, "apple-touch-icon.png"), createPng(180));
