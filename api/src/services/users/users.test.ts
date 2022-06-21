import { users, user, createUser, updateUser, deleteUser } from './users'
import type { StandardScenario } from './users.scenarios'

// Generated boilerplate tests do not account for all circumstances
// and can fail without adjustments, e.g. Float and DateTime types.
//           Please refer to the RedwoodJS Testing Docs:
//       https://redwoodjs.com/docs/testing#testing-services
// https://redwoodjs.com/docs/testing#jest-expect-type-considerations

describe('users', () => {
  scenario('returns all users', async (scenario: StandardScenario) => {
    const result = await users()

    expect(result.length).toEqual(Object.keys(scenario.user).length)
  })

  scenario('returns a single user', async (scenario: StandardScenario) => {
    const result = await user({ id: scenario.user.one.id })

    expect(result).toEqual(scenario.user.one)
  })

  scenario('creates a user', async () => {
    const result = await createUser({
      input: {
        gitlabtoken: 'String2398349',
        avatarUrl: 'String',
        email: 'String3607906',
        phone: 'String',
        updatedAt: '2022-06-16T09:13:51Z',
      },
    })

    expect(result.gitlabtoken).toEqual('String2398349')
    expect(result.avatarUrl).toEqual('String')
    expect(result.email).toEqual('String3607906')
    expect(result.phone).toEqual('String')
    expect(result.updatedAt).toEqual('2022-06-16T09:13:51Z')
  })

  scenario('updates a user', async (scenario: StandardScenario) => {
    const original = await user({ id: scenario.user.one.id })
    const result = await updateUser({
      id: original.id,
      input: { gitlabtoken: 'String57102002' },
    })

    expect(result.gitlabtoken).toEqual('String57102002')
  })

  scenario('deletes a user', async (scenario: StandardScenario) => {
    const original = await deleteUser({ id: scenario.user.one.id })
    const result = await user({ id: original.id })

    expect(result).toEqual(null)
  })
})
