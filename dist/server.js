"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
async function start() {
    const app = await (0, app_1.buildApp)();
    await (0, db_1.connectDatabase)();
    await app.listen({
        host: '0.0.0.0',
        port: env_1.env.PORT
    });
    app.log.info(`Server running on port ${env_1.env.PORT}`);
}
start().catch((error) => {
    console.error(error);
    process.exit(1);
});
