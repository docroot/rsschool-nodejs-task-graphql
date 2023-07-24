import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema, Schema } from './schemas.js';
import { GraphQLArgs, graphql, validate, parse } from 'graphql';
import depthLimit from 'graphql-depth-limit'

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
      const gqlErrs = validate( Schema, parse( req.body.query ), [depthLimit(5)], { maxErrors: 1 } );
      if ( gqlErrs.length > 0 ) {
         return { errors: gqlErrs };
      }
      const gqlArgs:GraphQLArgs = {schema: Schema, source: req.body.query, contextValue: { prisma: prisma } };
      if ( req.body.variables) {
        // console.log(req.body.variables);
        gqlArgs.variableValues = req.body.variables;
      }
      try {
        const result = await graphql(gqlArgs);
        // if ( result.errors?.length ) {
        //   console.log(result.errors);
        // }
        return result;
      } catch (error) {
        // console.log(error);
        return { errors: [error] };
      }
    },
  });
};

export default plugin;
