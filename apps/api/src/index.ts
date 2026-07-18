import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 4000;
const webOrigin = process.env.WEB_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: webOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
