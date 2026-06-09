import "dotenv/config";
import "reflect-metadata";

import { AppDataSource } from "./config/datasource";
import app from "./app";
import { scheduleBackups } from "./services/backup.service";
import { scheduleReminders } from "./services/pushSubscription.service";

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  const sentimentUrl = process.env.SENTIMENT_SERVICE_URL;
  if (sentimentUrl) {
    console.log(`🧠 Sentiment service URL: ${sentimentUrl}`);
  } else {
    console.warn("⚠️  SENTIMENT_SERVICE_URL no está configurado — el análisis de sentimientos NO funcionará en producción (fallback: http://localhost:8000)");
  }
});

// conexión DB separada
AppDataSource.initialize()
  .then(() => {
    console.log("📦 Database connected");
    scheduleBackups();
    scheduleReminders();
    scheduleReminders();
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
  });