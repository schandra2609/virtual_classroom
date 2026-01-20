import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: `.env.${process.env.NODE_ENV || "development"}` });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DIRECT_URL"),
  },
});