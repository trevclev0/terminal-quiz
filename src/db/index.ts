import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";

const DB_FILE_NAME = process.env.DB_FILE_NAME;
if (!DB_FILE_NAME) throw new Error("Cannot read database file");

const db = drizzle(DB_FILE_NAME);

export default db;
