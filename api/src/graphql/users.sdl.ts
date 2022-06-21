export const schema = gql`
  type User {
    id: Int!
    name: String
    gitlabtoken: String!
    avatarUrl: String!
    email: String!
    phone: String!
    insertedAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    users: [User!]! @requireAuth
    user(id: Int!): User @requireAuth
  }

  input CreateUserInput {
    name: String
    gitlabtoken: String!
    avatarUrl: String!
    email: String!
    phone: String!
    insertedAt: DateTime!
  }

  input UpdateUserInput {
    name: String
    gitlabtoken: String
    avatarUrl: String
    email: String
    phone: String
    insertedAt: DateTime
  }

  type Mutation {
    createUser(input: CreateUserInput!): User! @requireAuth
    updateUser(id: Int!, input: UpdateUserInput!): User! @requireAuth
    deleteUser(id: Int!): User! @requireAuth
  }
`
