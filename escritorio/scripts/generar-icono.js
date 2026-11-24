// Genera assets/icon.png (256x256): círculo azul con un reloj. Sin dependencias: PNG a mano con zlib.
// Uso: npm run icono
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const N = 256;
const buf = Buffer.alloc(N * N * 4);

// Distancia con signo a un segmento (para dibujar las agujas con bordes suaves).
function distSegmento(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

const c = N / 2;
for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    const px = x + 0.5, py = y + 0.5;
    const r = Math.hypot(px - c, py - c);
    let [R, G, B, A] = [0, 0, 0, 0];

    // Disco azul (degradado vertical) con borde suavizado.
    const cobertura = Math.max(0, Math.min(1, 124 - r + 0.5));
    if (cobertura > 0) {
      const k = y / N;
      R = Math.round(41 + (31 - 41) * k);
      G = Math.round(128 + (104 - 128) * k);
      B = Math.round(185 + (150 - 185) * k);
      A = Math.round(255 * cobertura);

      // Esfera blanca interior.
      const esfera = Math.max(0, Math.min(1, 96 - r + 0.5));
      R = Math.round(R + (255 - R) * esfera);
      G = Math.round(G + (255 - G) * esfera);
      B = Math.round(B + (255 - B) * esfera);

      // Agujas (azul oscuro) y punto central.
      const d = Math.min(
        distSegmento(px, py, c, c, c, c - 62) - 7,
        distSegmento(px, py, c, c, c + 44, c + 20) - 7,
        r - 11
      );
      const aguja = Math.max(0, Math.min(1, 0.5 - d)) * esfera;
      R = Math.round(R + (22 - R) * aguja);
      G = Math.round(G + (78 - G) * aguja);
      B = Math.round(B + (112 - B) * aguja);
    }
    const i = (y * N + x) * 4;
    buf[i] = R; buf[i + 1] = G; buf[i + 2] = B; buf[i + 3] = A;
  }
}

// --- Codificación PNG ---
const crcTabla = new Int32Array(256).map((_, n) => {
  let v = n;
  for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
  return v;
});
const crc32 = datos => {
  let v = -1;
  for (const b of datos) v = crcTabla[(v ^ b) & 0xff] ^ (v >>> 8);
  return (v ^ -1) >>> 0;
};
const trozo = (tipo, datos) => {
  const cab = Buffer.alloc(8);
  cab.writeUInt32BE(datos.length, 0);
  cab.write(tipo, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([cab.subarray(4), datos])), 0);
  return Buffer.concat([cab, datos, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8 bits, RGBA

const filas = Buffer.alloc((N * 4 + 1) * N);
for (let y = 0; y < N; y++) {
  filas[y * (N * 4 + 1)] = 0;
  buf.copy(filas, y * (N * 4 + 1) + 1, y * N * 4, (y + 1) * N * 4);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  trozo('IHDR', ihdr),
  trozo('IDAT', zlib.deflateSync(filas, { level: 9 })),
  trozo('IEND', Buffer.alloc(0))
]);

const destino = path.join(__dirname, '..', 'assets', 'icon.png');
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, png);
console.log('Icono generado en', destino);
