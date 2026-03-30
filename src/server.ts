import "dotenv/config";
import "reflect-metadata";

import { AppDataSource } from "./config/datasource";
import app from "./app";
import { scheduleBackups } from "./services/backup.service";

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

// conexión DB separada
AppDataSource.initialize()
  .then(() => {
    console.log("📦 Database connected");
    scheduleBackups();
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
  });