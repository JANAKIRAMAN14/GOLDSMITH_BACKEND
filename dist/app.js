"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const routes_1 = require("./routes");
const jwt_1 = require("./plugins/jwt");
const authenticate_1 = require("./plugins/authenticate");
const env_1 = require("./config/env");
async function buildApp() {
    const app = (0, fastify_1.default)({
        logger: {
            level: env_1.env.NODE_ENV === 'production' ? 'info' : 'debug',
            redact: {
                paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
                remove: true
            }
        }
    });
    await app.register(helmet_1.default, {
        contentSecurityPolicy: false
    });
    await app.register(cookie_1.default, {
        secret: env_1.env.JWT_SECRET,
        hook: 'onRequest'
    });
    await app.register(rate_limit_1.default, {
        max: 120,
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({
            message: 'Too many requests, please try again later.'
        })
    });
    await app.register(cors_1.default, {
        origin: (origin, callback) => {
            if (!origin) {
                callback(null, true);
                return;
            }
            if (env_1.env.FRONTEND_ORIGINS.includes(origin)) {
                callback(null, true);
                return;
            }
            callback(new Error('Origin not allowed by CORS'), false);
        },
        credentials: true
    });
    await app.register(multipart_1.default, {
        limits: {
            fileSize: 5 * 1024 * 1024,
            files: 1
        }
    });
    await (0, jwt_1.jwtPlugin)(app);
    await (0, authenticate_1.authenticatePlugin)(app);
    await (0, routes_1.registerRoutes)(app);
    app.setErrorHandler((error, request, reply) => {
        const err = error;
        request.log.error(err);
        if (env_1.env.NODE_ENV === 'production') {
            reply.status(err.statusCode || 500).send({
                message: err.statusCode && err.statusCode < 500 ? err.message : 'Internal server error'
            });
            return;
        }
        reply.status(err.statusCode || 500).send({
            message: err.message,
            stack: err.stack
        });
    });
    return app;
}
