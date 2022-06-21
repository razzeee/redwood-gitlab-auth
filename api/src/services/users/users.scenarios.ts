import type { Prisma } from '@prisma/client'

export const standard = defineScenario<Prisma.UserCreateArgs>({
  user: {
    one: {
      data: {
        gitlabtoken: 'String8630337',
        avatarUrl: 'String',
        email: 'String9445971',
        phone: 'String',
        updatedAt: '2022-06-16T09:13:51Z',
      },
    },
    two: {
      data: {
        gitlabtoken: 'String1320277',
        avatarUrl: 'String',
        email: 'String3514929',
        phone: 'String',
        updatedAt: '2022-06-16T09:13:51Z',
      },
    },
  },
})

export type StandardScenario = typeof standard
