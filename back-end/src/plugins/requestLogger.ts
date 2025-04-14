import fp from 'fastify-plugin'

const requestLogger = fp(async (fastify) => {
  if (process.env.LOGGER_ENABLED === 'true') {
    fastify.addHook('onResponse', async (request, reply) => {
      console.log(`[${request.method}] ${request.url}`, request.body ?? {}, reply.statusCode)
    })
  }
})

export default requestLogger
