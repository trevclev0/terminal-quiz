import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const DB_FILE_NAME = process.env.DB_FILE_NAME;
if (!DB_FILE_NAME) throw new Error("Cannot read database file");

const client = createClient({ url: DB_FILE_NAME });
const db = drizzle(client);

export default db;
