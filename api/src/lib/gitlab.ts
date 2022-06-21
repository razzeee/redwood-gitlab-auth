import { GitlabAuth } from './gitlabAuth'

export const gitlab = (client: GitlabAuth) => {
  return {
    type: 'custom',
    client,
    restoreAuthState: async () => {
      if (
        window?.location?.search?.includes('code=') &&
        window?.location?.search?.includes('state=')
      ) {
        await client.completeAuthorizationRequestIfPossible()
      }
    },
    login: async () => {
      client.makeAuthorizationRequest()
    },

    logout: async () => client.signOut(),

    getToken: async () => client.getToken(),

    getUserMetadata: async () => client.getToken(),
  }
}
