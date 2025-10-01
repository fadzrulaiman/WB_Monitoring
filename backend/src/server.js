import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import app from "./app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (backend/.env takes precedence if present)
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config();

const buildDir = path.join(__dirname, "..", "..", "frontend", "build");

app.use(express.static(buildDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(buildDir, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
