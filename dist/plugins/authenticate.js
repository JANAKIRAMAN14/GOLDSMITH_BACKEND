"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticatePlugin = authenticatePlugin;
async function authenticatePlugin(app) {
    app.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
            const payload = request.user;
            if (payload.tokenType !== 'access') {
                return reply.status(401).send({ message: 'Unauthorized' });
            }
        }
        catch (error) {
            return reply.status(401).send({ message: 'Unauthorized' });
        }
    });
}
