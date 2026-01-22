// import express from "express";
// import cors from "cors";
// import calculatorRoutes from "./src/routes/calculator.routes.js";
// import toolsRoutes from "./src/routes/tools.routes.js";

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.use("/api/calculators", calculatorRoutes);
// app.use("/api/tools", toolsRoutes);

// app.get("/", (req, res) => {
//   res.send("E-Commerce Tools Backend Running 🚀");
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () =>
//   console.log(`Server running on port ${PORT}`)
// );



import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import calculatorRoutes from "./src/routes/calculator.routes.js";
import toolsRoutes from "./src/routes/tools.routes.js";

const app = express();

/* ---------- dirname fix for ES module ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------- middleware ---------- */
app.use(cors());
app.use(express.json());

/* 🔥 VERY IMPORTANT (PDF access) */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---------- routes ---------- */
app.use("/api/calculators", calculatorRoutes);
app.use("/api/tools", toolsRoutes);

/* ---------- test route ---------- */
app.get("/", (req, res) => {
  res.send("E-Commerce Tools Backend Running 🚀");
});

/* ---------- server ---------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
