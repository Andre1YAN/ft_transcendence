import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as channelController from '../controllers/channelController';

// 定义请求参数类型
interface ChannelParams {
  channelId: string;
}

export default async function channelRoutes(fastify: FastifyInstance) {
  // 添加认证函数
  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ message: "认证失败" });
    }
  };

  // 频道管理
  fastify.post('/create', { 
    preValidation: authenticate 
  }, channelController.createChannel);
  
  fastify.get('/search', { 
    preValidation: authenticate 
  }, channelController.searchChannels);
  
  fastify.post('/join', { 
    preValidation: authenticate 
  }, channelController.joinChannel);
  
  fastify.get('/my-channels', { 
    preValidation: authenticate 
  }, channelController.getUserChannels);
  
  // 管理员功能
  fastify.post('/kick', { 
    preValidation: authenticate 
  }, channelController.kickUser);
  
  fastify.post('/mute', { 
    preValidation: authenticate 
  }, channelController.muteUser);
  
  fastify.post('/unmute', { 
    preValidation: authenticate 
  }, channelController.unmuteUser);
  
  fastify.post('/set-password', { 
    preValidation: authenticate 
  }, channelController.setChannelPassword);
  
  fastify.post('/set-admin', { 
    preValidation: authenticate 
  }, channelController.setAdmin);
  
  fastify.post('/remove-admin', { 
    preValidation: authenticate 
  }, channelController.removeAdmin);
  
  fastify.get<{Params: ChannelParams}>('/:channelId/messages', { 
    preValidation: authenticate 
  }, channelController.getChannelMessages);
  
  fastify.delete<{Params: ChannelParams}>('/:channelId/leave', { 
    preValidation: authenticate 
  }, channelController.leaveChannel);
}