/**
 * Copia os arquivos estáticos servidos na raiz para public/,
 * para o deploy na Vercel (outputDirectory: public).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const out = path.join(root, "public");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

function copy(rel) {
  const src = path.join(root, rel);
  if (!fs.existsSync(src)) return;
  const dest = path.join(out, rel);
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.cpSync(src, dest, { recursive: true });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copy("index.html");
copy("assets");

const mp4 = "Cinematic_slow_motion_202604151851.mp4";
if (fs.existsSync(path.join(root, mp4))) {
  copy(mp4);
}

console.log("Arquivos estáticos copiados para public/");
