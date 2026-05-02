import fs from "fs";
import path from "path";

console.log("🚀 SCRIPT MUSEO AVVIATO");

const BASE = "./public/images";

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
const PDF_EXT = [".pdf"];
const AUDIO_EXT = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"];

function getType(file) {
  const ext = path.extname(file).toLowerCase();

  if (IMAGE_EXT.includes(ext)) return "image";
  if (PDF_EXT.includes(ext)) return "pdf";
  if (AUDIO_EXT.includes(ext)) return "audio";

  return null;
}

// ✅ FUNZIONE RICORSIVA CORRETTA
function scan(dir, relativePath = "") {
  const result = {};

  const items = fs
    .readdirSync(dir)
    .filter((i) => !i.startsWith("."))
    .sort((a, b) => a.localeCompare(b, "it", { numeric: true }));

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      console.log("📂 directory:", item);

      result[item] = scan(fullPath, `${relativePath}/${item}`);
      continue;
    }

    const type = getType(item);
    if (!type) continue;

    if (!result.files) result.files = [];

    result.files.push({
      type,
      src: `/images${relativePath}/${item}`.replace(
        "/images/images",
        "/images"
      ),
    });

    console.log("📄 file:", item);
  }

  return result;
}

if (!fs.existsSync(BASE)) {
  console.log("❌ CARTELLA MANCANTE:", BASE);
  process.exit(1);
}

const data = scan(BASE);

fs.writeFileSync(
  "./src/data/gallery.json",
  JSON.stringify(data, null, 2)
);

console.log("✔ JSON MUSEO GENERATO");