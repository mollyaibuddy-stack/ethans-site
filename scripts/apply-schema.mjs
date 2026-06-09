import { getSql } from "../lib/db.mjs";
import { createPrivateStore } from "../lib/private-store.mjs";

const store = createPrivateStore(getSql());

await store.ensureSchema();
console.log("Private database schema is ready.");
