import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema, Schema } from './schemas.js';
import { GraphQLArgs, graphql } from 'graphql';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {

  const { prisma } = fastify;

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      // console.log(req.url);
      // console.log(req.method);
      // console.log(req.body.query);
      const gqlArgs:GraphQLArgs = {schema: Schema, source: req.body.query, contextValue: { prisma: prisma } };
      if ( req.body.variables) {
        // console.log(req.body.variables);
        gqlArgs.variableValues = req.body.variables;
      }
      try {
        const result = await graphql(gqlArgs);
        return result;
      } catch (error) {
          console.log(error);        
          return {};
        }
    },
  });
};

export default plugin;
