import { join } from 'path';
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions";
import next from "next";

// Set the region to match your project (likely us-central1)
setGlobalOptions({ region: "us-central1" });

const app = next({
    dev: false,
    conf: { distDir: join(__dirname, '../.next') }
});
const handle = app.getRequestHandler();

export const nextjsServer = onRequest(
    { memory: "1GiB", timeoutSeconds: 300 },
    (req, res) => {
        return app.prepare().then(() => handle(req, res));
    }
);
