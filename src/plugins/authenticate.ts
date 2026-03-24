import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function authenticatePlugin(app: FastifyInstance) {
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const payload = request.user as { tokenType?: string };
      if (payload.tokenType !== 'access') {
        return reply.status(401).send({ message: 'Unauthorized' });
      }
    } catch (error) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }
  });
}
