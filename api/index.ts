import { Hono } from "hono";
import { cors } from "hono/cors";
import apiRouter from "./routes/api.js";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

app.use("/*", cors({
  origin: "http://localhost:5173",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));

app.route("/v1", apiRouter);

export const config = {
  runtime: "edge",
};

export default handle(app);
