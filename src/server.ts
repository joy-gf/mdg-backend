import "dotenv/config";
import "reflect-metadata";

import { AppDataSource } from "./config/datasource";
import app from "./app";

console.log("DATABASE_URL:", process.env.DATABASE_URL);

AppDataSource.initialize()
  .then(() => {
    console.log("📦 Database connected");

    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
  });
