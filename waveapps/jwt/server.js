import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import jwt from "jsonwebtoken";

const app = new Hono();

// Helper function to send messages to parent process
function sendWaveAppMessage(message) {
    if (process.send) {
        process.send(message);
    } else {
        console.log(`#waveapp${JSON.stringify(message)}`);
    }
}

app.use("/*", cors());
app.use("/static/*", serveStatic({ root: "./dist" }));

// State management
let appData = null;
let appConfig = {};

// Waveapp spec handlers
app.get("/api/config", (c) => {
    return c.json(appConfig);
});

app.put("/api/config", async (c) => {
    try {
        const newConfig = await c.req.json();
        appConfig = { ...appConfig, ...newConfig };
        return c.json(appConfig);
    } catch (error) {
        return c.json({ error: "Invalid config format" }, 400);
    }
});

app.get("/api/data", (c) => {
    return c.json(appData || {});
});

app.get("/api/describe", serveStatic({ path: "./describe.json" }));

// JWT decode endpoint
app.post("/api/decode", async (c) => {
    try {
        const { token } = await c.req.json();

        if (!token) {
            const errorData = { error: "Token is required" };
            appData = errorData;
            return c.json(errorData, 400);
        }

        // Try to verify to get detailed parsing errors from the library
        try {
            jwt.verify(token, "dummy-secret", { ignoreExpiration: true, ignoreNotBefore: true });
        } catch (verifyError) {
            // If it's a signature error, that's expected - continue to decode
            if (verifyError.name === "JsonWebTokenError" && verifyError.message === "invalid signature") {
                // Token is structurally valid, just can't verify signature
            } else {
                // This is a real parsing/format error from the library
                const errorData = { error: verifyError.message };
                appData = errorData;
                return c.json(errorData, 400);
            }
        }

        // Decode JWT since we know it's structurally valid
        const decoded = jwt.decode(token, { complete: true });

        const result = {
            header: decoded.header,
            payload: decoded.payload,
            signature: decoded.signature,
        };

        // Store the decoded data
        appData = result;

        return c.json(result);
    } catch (error) {
        const errorData = { error: error.message || "Failed to decode JWT token" };
        appData = errorData;
        return c.json(errorData, 400);
    }
});

// Serve static files from dist directory (built by Vite)
app.use("/*", serveStatic({ root: "./dist" }));

const server = serve({
    fetch: app.fetch,
    port: 3000, // Fixed port to match Vite proxy config
});

server.on("listening", () => {
    const port = server.address().port;
    console.log(`JWT Decoder server running on port ${port}`);

    sendWaveAppMessage({
        type: "listening",
        port: port,
    });
});
