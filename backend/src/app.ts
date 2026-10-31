import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { connectDatabase } from "./config/database";
import ticketRouter from "./routes/ticket.routes";
import reportRouter from "./routes/report.routes";
import { errorHandler } from "./middlewares/errorHandler";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Setup Middlewares
app.use(cors());
app.use(express.json());

// Hello/Ping Route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Cinema RDBMS Backend is healthy!" });
});

// Register Routers
app.use("/api/tickets", ticketRouter);
app.use("/api/reports", reportRouter);

// Serve Frontend Static Build (Single Service Monolith)
const candidateDistPaths = [
  path.resolve(__dirname, "../../project/dist"),
  path.resolve(process.cwd(), "project/dist"),
  path.resolve(process.cwd(), "../project/dist"),
  path.resolve(__dirname, "../project/dist"),
];

const clientDistPath = candidateDistPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  console.log(`[Static] Serving frontend from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // Catch-all route to serve index.html for Single Page Application (SPA)
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "NotFound", message: "API endpoint không tồn tại." });
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
} else {
  console.log(`[Static] Frontend dist folder not found. Running in API-only mode.`);
}

// Register Global Error Handler
app.use(errorHandler);

// Bootstrap Server & DB Connection
async function startServer() {
  const server = app.listen(port, () => {
    console.log(`======================================================================`);
    console.log(`CineStar Fullstack App is running on http://localhost:${port}`);
    console.log(`API Health: http://localhost:${port}/api/health`);
    console.log(`======================================================================`);
  });

  // Connect database (falls back to mock if SQL Server is not running)
  connectDatabase().catch((err) => {
    console.error("Initial database connection error:", err);
  });
}

startServer();
