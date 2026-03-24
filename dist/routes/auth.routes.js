"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const auth_controller_1 = require("../controllers/auth.controller");
const strictRateLimit = {
    config: {
        rateLimit: {
            max: 5,
            timeWindow: '1 minute'
        }
    }
};
async function authRoutes(app) {
    app.post('/signup', strictRateLimit, auth_controller_1.signupController);
    app.post('/login', strictRateLimit, auth_controller_1.loginController);
    app.post('/refresh', auth_controller_1.refreshController);
    app.post('/logout', auth_controller_1.logoutController);
    app.get('/me', { preHandler: [app.authenticate] }, auth_controller_1.meController);
}
