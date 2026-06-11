import { Request, Response, NextFunction } from "express";
import { sql } from "../config/database";

export interface ConcurrencyRequest extends Request {
  isolationLevel?: sql.IIsolationLevel;
  isolationLevelName?: string;
  useLockFix?: boolean;
  latencyMs?: number;
}

export function concurrencyMiddleware(req: ConcurrencyRequest, res: Response, next: NextFunction) {
  // 1. Read isolation level from header or query param
  const isolationHeader = (req.headers["x-isolation-level"] || req.query.isolationLevel || "READ_COMMITTED") as string;
  const upperIsolation = isolationHeader.toUpperCase().replace("-", "_").replace(" ", "_");

  let isolationLevel: sql.IIsolationLevel = sql.ISOLATION_LEVEL.READ_COMMITTED;
  let isolationName = "READ COMMITTED";

  switch (upperIsolation) {
    case "READ_UNCOMMITTED":
      isolationLevel = sql.ISOLATION_LEVEL.READ_UNCOMMITTED;
      isolationName = "READ UNCOMMITTED";
      break;
    case "READ_COMMITTED":
      isolationLevel = sql.ISOLATION_LEVEL.READ_COMMITTED;
      isolationName = "READ COMMITTED";
      break;
    case "REPEATABLE_READ":
      isolationLevel = sql.ISOLATION_LEVEL.REPEATABLE_READ;
      isolationName = "REPEATABLE READ";
      break;
    case "SERIALIZABLE":
      isolationLevel = sql.ISOLATION_LEVEL.SERIALIZABLE;
      isolationName = "SERIALIZABLE";
      break;
    default:
      isolationLevel = sql.ISOLATION_LEVEL.READ_COMMITTED;
      isolationName = "READ COMMITTED";
  }

  req.isolationLevel = isolationLevel;
  req.isolationLevelName = isolationName;

  // 2. Read lock fix from query or body
  const lockFixHeader = req.headers["x-use-lock-fix"] || req.query.useLockFix || req.body?.useLockFix;
  req.useLockFix = lockFixHeader === "true" || lockFixHeader === true;

  // 3. Read latency (delay)
  const latencyHeader = req.headers["x-latency-ms"] || req.query.latencyMs || req.body?.latencyMs;
  req.latencyMs = latencyHeader ? Number(latencyHeader) : 0;

  next();
}
