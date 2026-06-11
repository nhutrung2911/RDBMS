import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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

// Register Global Error Handler
app.use(errorHandler);

// Bootstrap Server & DB Connection
async function startServer() {
  // Connect database (falls back to mock if SQL Server is not running)
  await connectDatabase();

  app.listen(port, () => {
    console.log(`======================================================================`);
    console.log(`Backend server is running on http://localhost:${port}`);
    console.log(`======================================================================`);
  });
}

startServer();
