import { db } from "../src/lib/db/client";
import { seedIfEmpty } from "../src/lib/db/seed-data";

seedIfEmpty(db);
console.log("Seed complete.");
