import { MongoClient, type Db, type Collection, type Document } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "PRISM";

if (!uri) {
  throw new Error("MONGODB_URI is not set. Add it to .env.local.");
}

declare global {
  // eslint-disable-next-line no-var
  var __prismMongo: { client: MongoClient; promise: Promise<MongoClient> } | undefined;
}

function getClient(): Promise<MongoClient> {
  if (!global.__prismMongo) {
    const client = new MongoClient(uri!, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 8000,
    });
    global.__prismMongo = { client, promise: client.connect() };
  }
  return global.__prismMongo.promise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(dbName);
}

export async function getCollection<T extends Document = Document>(
  name: string,
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

export const COLLECTIONS = {
  branches: "branches",
  employees: "employees",
  customers: "customers",
  accounts: "accounts",
  transactions: "transactions",
  activity_logs: "activity_logs",
  dependents: "dependents",
  alerts: "alerts",
  alert_audit: "alert_audit",
  disclosures: "disclosures",
} as const;
