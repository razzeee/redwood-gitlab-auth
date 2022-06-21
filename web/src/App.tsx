import { AuthProvider } from '@redwoodjs/auth'

import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './scaffold.css'
import './index.css'

import { GitlabAuth } from 'api/src/lib/gitlabAuth'
import { gitlab } from 'api/src/lib/gitlab'

const App = () => {
  const clientId = process.env.GITLAB_CLIENT_ID
  const redirectUri = process.env.GITLAB_REDIRECT_URI
  const authority = process.env.GITLAB_AUTHORITY

  const gitlabAuth = new GitlabAuth(clientId, redirectUri, authority)

  return (
    <FatalErrorBoundary page={FatalErrorPage}>
      <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
        <AuthProvider type="custom" client={gitlab(gitlabAuth)}>
          <RedwoodApolloProvider>
            <Routes />
          </RedwoodApolloProvider>
        </AuthProvider>
      </RedwoodProvider>
    </FatalErrorBoundary>
  )
}

export default App
