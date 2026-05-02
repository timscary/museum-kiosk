import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;

// 📁 paths
const IMAGES_PATH = path.join(process.cwd(), "public", "images");
const DIST_PATH = path.join(process.cwd(), "dist");

console.log("📁 IMAGES_PATH =", IMAGES_PATH);
console.log("📦 DIST_PATH =", DIST_PATH);

// 📡 immagini/static media
app.use("/images", express.static(IMAGES_PATH));

// 🔥 debug
app.get("/debug", (req, res) => {
  res.json({
    cwd: process.cwd(),
    imagesPath: IMAGES_PATH,
    imagesExists: fs.existsSync(IMAGES_PATH),
    distPath: DIST_PATH,
    distExists: fs.existsSync(DIST_PATH),
    files: fs.existsSync(IMAGES_PATH) ? fs.readdirSync(IMAGES_PATH) : [],
  });
});

// 📦 estensioni
const imageExt = [".jpg", ".jpeg", ".png", ".webp"];
const audioExt = [".mp3", ".wav", ".ogg"];
const pdfExt = [".pdf"];

// 🧠 lettura ricorsiva
function readDir(dir, baseUrl = "/images") {
  const result = {};
  const items = fs.readdirSync(dir);

  for (const item of items) {
    if (item.startsWith(".")) continue;

    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      result[item] = readDir(full, `${baseUrl}/${encodeURIComponent(item)}`);
    } else {
      const ext = path.extname(item).toLowerCase();

      let type = null;

      if (imageExt.includes(ext)) type = "image";
      else if (audioExt.includes(ext)) type = "audio";
      else if (pdfExt.includes(ext)) type = "pdf";

      if (!type) continue;

      if (!result.files) result.files = [];

      result.files.push({
        type,
        src: `${baseUrl}/${encodeURIComponent(item)}`,
      });
    }
  }

  return result;
}

// 📡 API gallery
app.get("/api/gallery", (req, res) => {
  try {
    const data = readDir(IMAGES_PATH);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

// 🌐 frontend React/Vite
app.use(express.static(DIST_PATH));

// fallback React
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(DIST_PATH, "index.html"));
});

// 🚀 start
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server attivo su porta ${PORT}`);
});