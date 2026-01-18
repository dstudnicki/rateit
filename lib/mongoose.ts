import mongoose from "mongoose";

declare global {
    var _mongooseConnection:
        | {
              conn: typeof mongoose | null;
              promise: Promise<typeof mongoose> | null;
          }
        | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

// Check if we're in build phase (during npm build, not runtime)
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-export";

if (!MONGODB_URI && !isBuildPhase) {
    // eslint-disable-next-line quotes
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

let cached = global._mongooseConnection;

if (!cached) {
    cached = global._mongooseConnection = { conn: null, promise: null };
}

async function dbConnect() {
    // During build phase ONLY (not runtime), return mock connection
    if (isBuildPhase) {
        console.warn("⚠️ MongoDB connection skipped during build phase - returning mock connection");
        // Return a mock mongoose instance that won't actually connect
        return {
            connection: {
                getClient: () => ({
                    db: () => ({
                        collection: () => ({
                            findOne: async () => null,
                            find: () => ({
                                toArray: async () => [],
                            }),
                        }),
                    }),
                }),
            },
        } as any;
    }

    if (cached?.conn) return cached.conn;

    if (!cached?.promise) {
        cached!.promise = mongoose
            .connect(MONGODB_URI!, {
                dbName: process.env.MONGODB_DB_NAME,
                maxPoolSize: 10,
            })
            .then((mongooseInstance) => {
                console.log("Database connected");
                return mongooseInstance;
            })
            .catch((err) => {
                console.error("Database failed to connect", err);
                throw err;
            });
    }

    cached!.conn = await cached!.promise;
    return cached!.conn;
}

export async function getClient() {
    const conn = await dbConnect();
    return conn.connection.getClient().db(process.env.MONGODB_DB_NAME);
}
