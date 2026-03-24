"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.goldRateRoutes = goldRateRoutes;
const goldRate_controller_1 = require("../controllers/goldRate.controller");
async function goldRateRoutes(app) {
    app.get('/today', { preHandler: [app.authenticate] }, goldRate_controller_1.getTodayGoldRateController);
    app.put('/today', { preHandler: [app.authenticate] }, goldRate_controller_1.setTodayGoldRateController);
}
