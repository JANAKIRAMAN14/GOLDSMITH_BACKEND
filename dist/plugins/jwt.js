"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtPlugin = jwtPlugin;
const jwt_1 = __importDefault(require("@fastify/jwt"));
const env_1 = require("../config/env");
async function jwtPlugin(app) {
    await app.register(jwt_1.default, {
        secret: env_1.env.JWT_SECRET
    });
}
