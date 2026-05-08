import type { AppType } from "@worker/index";
import { hc } from "hono/client";

const client = hc<AppType>("/");
export const api = client.api;
