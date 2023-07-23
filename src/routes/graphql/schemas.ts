import { Type } from '@fastify/type-provider-typebox';
import { GraphQLFloat, GraphQLInt, GraphQLObjectType, GraphQLString, GraphQLList, GraphQLSchema, GraphQLBoolean, GraphQLEnumType } from 'graphql';
import { PrismaClient, Profile, User } from '@prisma/client';
import { UUIDType } from './types/uuid.js'


export const gqlResponseSchema = Type.Partial(
  Type.Object({
    data: Type.Any(),
    errors: Type.Any(),
  }),
);

export const createGqlResponseSchema = {
  body: Type.Object(
    {
      query: Type.String(),
      variables: Type.Optional(Type.Record(Type.String(), Type.Any())),
    },
    {
      additionalProperties: false,
    },
  ),
};


const memberTypeId = new GraphQLEnumType({
  name: 'MemberTypeId',
  values: {
    basic: {
        value: 'basic',
    },
    business: {
        value: 'business',
    }
  }
})

const memberType = new GraphQLObjectType({
	name: 'MemberType',
	fields: () => ({
    id: { type: memberTypeId },
    discount: { type: GraphQLFloat },
    postsLimitPerMonth: { type: GraphQLInt }

  })
})

const post = new GraphQLObjectType({
	name: 'Post',
	fields: () => ({
    id: { type: UUIDType },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    authorId: { type: GraphQLString }
  })
})


const UserType = new GraphQLObjectType({
	name: 'User',
	fields: () => ({
    id: { type: UUIDType },
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
    profile: {
      type: profile,
      async resolve( parent: User, args, context : { prisma: PrismaClient }) {
        const { prisma } = context;
        const profile = await prisma.profile.findUnique({
          where: {
            userId: parent.id,
          },
        });
        return profile;
      }
    },
    posts: {
      type: new GraphQLList(post),
      async resolve( parent: User, args, context : { prisma: PrismaClient }) {
        const { prisma } = context;
        const posts = await prisma.post.findMany({
          where: {
            authorId: parent.id,
          },
        });
        return posts;
      }
    },
    subscribedToUser: {
      type: new GraphQLList(UserType),
      async resolve( parent: User, args, context : { prisma: PrismaClient }) {
        const { prisma } = context;
        const subscribers = await prisma.user.findMany({
          where: {
            userSubscribedTo: {
              some: {
                authorId: parent.id,
              },
            },
          },
        });
        return subscribers;
      }
    },
    userSubscribedTo: {
      type: new GraphQLList(UserType),
      async resolve( parent: User, args, context : { prisma: PrismaClient }) {
        const { prisma } = context;
        const subscribedTo = await prisma.user.findMany({
          where: {
            subscribedToUser: {
              some: {
                subscriberId: parent.id,
              },
            },
          },
        });
        return subscribedTo;
      }
    }
  })
})


const profile = new GraphQLObjectType({
	name: 'Profile',
	fields: () => ({
    id: { type: UUIDType },
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    userId: { type: GraphQLString },
    memberTypeId: { type: GraphQLString },
    memberType: {
    type: memberType,
      async resolve( parent: Profile, args, context : { prisma: PrismaClient }) {
        const { prisma } = context;
        const memberType = await prisma.memberType.findUnique({
          where: {
            id: parent.memberTypeId,
          },
        });
        return memberType;
      }
    }
  })
})


export const RootQuery = new GraphQLObjectType({
	name: 'RootQueryType',
	fields: {
		memberType: {
      type: memberType,
      args: { id: { type: memberTypeId } },
			async resolve(parent, args: { id: string }, context : { prisma: PrismaClient } ) {
        const { prisma } = context;
        const memberType = await prisma.memberType.findUnique({
          where: {
            id: args.id,
          },
        });
        return memberType;
			}
    },
		memberTypes: {
      type: new GraphQLList(memberType),
			async resolve(parent, args, context : { prisma: PrismaClient } ) {
        const { prisma } = context;
        const mTypes = await prisma.memberType.findMany();
				return mTypes;
			}
    },
		posts: {
      type: new GraphQLList(post),
			async resolve(parent, args, context : { prisma: PrismaClient } ) {
        const { prisma } = context;
        const posts = await prisma.post.findMany();
				return posts.length > 0 ? posts : null;
			}
    },
   post: {
      type: post,
      args: { id: { type: UUIDType } },
			async resolve(parent, args: { id: string }, context : { prisma: PrismaClient } ) {
        const { prisma } = context;
        const post = await prisma.post.findUnique({
          where: {
            id: args.id,
          },
        });
        return post;
			}
    },
		users: {
      type: new GraphQLList(UserType),
			async resolve(parent, args, context : { prisma: PrismaClient } ) {
        const { prisma } = context;
        const users = await prisma.user.findMany();
				return users;
			}
    },
    user: {
      type: UserType,
      args: { id: { type: UUIDType } },
			async resolve(parent, args: { id: string }, context : { prisma: PrismaClient } ) {
        const { prisma } = context;
        const user = await prisma.user.findUnique({
          where: {
            id: args.id,
          },
        });
        return user;
			}
    },
    profiles: {
      type: new GraphQLList(profile),
			async resolve(parent, args, context : { prisma: PrismaClient } ) {
        const { prisma } = context;
        const profiles = await prisma.profile.findMany();
				return profiles;
			}
    },
    profile: {
      type: profile,
      args: { id: { type: UUIDType } },
			async resolve(parent, args: { id: string }, context : { prisma: PrismaClient } ) {
        const { prisma } = context;
        const profile = await prisma.profile.findUnique({
          where: {
            id: args.id,
          },
        });
        return profile;
			}
    },
	}
})

export const Schema = new GraphQLSchema({
	query: RootQuery,
//	mutation: Mutations
})
