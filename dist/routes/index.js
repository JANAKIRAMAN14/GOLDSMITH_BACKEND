"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const auth_routes_1 = require("./auth.routes");
const goldRate_routes_1 = require("./goldRate.routes");
const record_routes_1 = require("./record.routes");
async function registerRoutes(app) {
    app.get('/health', async () => ({ ok: true }));
    await app.register(auth_routes_1.authRoutes, { prefix: '/api/auth' });
    await app.register(goldRate_routes_1.goldRateRoutes, { prefix: '/api/gold-rate' });
    await app.register(record_routes_1.recordRoutes, { prefix: '/api/records' });
}
