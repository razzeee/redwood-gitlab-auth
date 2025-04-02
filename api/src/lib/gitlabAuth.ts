import {
  AuthorizationServiceConfiguration,
  LocationLike,
} from '@openid/appauth'
import { AuthorizationRequest } from '@openid/appauth/built/authorization_request'
import {
  AuthorizationNotifier,
  AuthorizationRequestHandler,
} from '@openid/appauth/built/authorization_request_handler'
import { DefaultCrypto } from '@openid/appauth/built/crypto_utils'
import { BasicQueryStringUtils } from '@openid/appauth/built/query_string_utils'
import { RedirectRequestHandler } from '@openid/appauth/built/redirect_based_handler'
import {
  TokenRequest,
  GRANT_TYPE_AUTHORIZATION_CODE,
  GRANT_TYPE_REFRESH_TOKEN,
} from '@openid/appauth/built/token_request'
import {
  TokenRequestHandler,
  BaseTokenRequestHandler,
} from '@openid/appauth/built/token_request_handler'
import { TokenResponse } from '@openid/appauth/built/token_response'
import { FetchRequestor } from '@openid/appauth/built/xhr'

const tokenName = 'token'

export class GitlabAuth {
  private notifier: AuthorizationNotifier
  private authorizationHandler: AuthorizationRequestHandler
  private tokenHandler: TokenRequestHandler
  private requestor = new FetchRequestor()

  private configuration: AuthorizationServiceConfiguration | undefined
  private request: AuthorizationRequest | undefined
  private code: string | undefined
  private clientId: string
  private redirectUri: string
  private redirectTo: string | undefined
  tokenResponse: TokenResponse | undefined

  constructor(
    clientId: string,
    redirectUri: string,
    authority: string | URL | undefined
  ) {
    this.clientId = clientId
    this.redirectUri = redirectUri
    this.configuration = new AuthorizationServiceConfiguration({
      authorization_endpoint: new URL('/oauth/authorize', authority).toString(),
      token_endpoint: new URL('/oauth/token', authority).toString(),
      revocation_endpoint: new URL('/oauth/revoke', authority).toString(),
      userinfo_endpoint: new URL('/oauth/userinfo', authority).toString(),
    })

    this.notifier = new AuthorizationNotifier()

    this.authorizationHandler = new RedirectRequestHandler(
      undefined,
      new NoHashQueryStringUtils(),
      undefined,
      undefined
    )
    this.tokenHandler = new BaseTokenRequestHandler(this.requestor)
    // // set notifier to deliver responses
    this.authorizationHandler.setAuthorizationNotifier(this.notifier)
    // set a listener to listen for authorization responses
    this.notifier.setAuthorizationListener((request, response, _error) => {
      if (response) {
        this.request = request
        this.code = response.code
      }
    })
  }

  makeAuthorizationRequest() {
    if (!this.configuration) {
      console.log('Unknown service configuration')
      return
    }

    const params = new URL(location.href).searchParams

    const state = {
      state: new DefaultCrypto().generateRandom(10),
      redirectTo: params.get('redirectTo'),
    }

    // create a request
    this.request = new AuthorizationRequest({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'read_user',
      response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
      state: JSON.stringify(state),
      extras: { prompt: 'consent', access_type: 'offline' },
    })

    this.authorizationHandler.performAuthorizationRequest(
      this.configuration,
      this.request
    )
  }

  async completeAuthorizationRequestIfPossible(): Promise<void> {
    if (!this.configuration) {
      console.log('Unknown service configuration')
      return Promise.resolve()
    }

    await this.authorizationHandler.completeAuthorizationRequestIfPossible()

    let request: TokenRequest | null = null
    if (this.code) {
      let extras: { [key: string]: string } | undefined = undefined
      if (this.request && this.request.internal) {
        extras = {}
        extras['code_verifier'] = this.request.internal['code_verifier']
      }
      // use the code to make the token request.
      request = new TokenRequest({
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
        code: this.code,
        refresh_token: undefined,
        extras: extras,
      })
    } else if (this.tokenResponse) {
      // use the token response to make a request for an access token
      request = new TokenRequest({
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        grant_type: GRANT_TYPE_REFRESH_TOKEN,
        code: undefined,
        refresh_token: this.tokenResponse.refreshToken,
        extras: undefined,
      })
    }

    if (request) {
      this.tokenHandler
        .performTokenRequest(this.configuration, request)
        .then((response) => {
          if (this.tokenResponse) {
            // copy over new fields
            this.tokenResponse.accessToken = response.accessToken
            this.tokenResponse.issuedAt = response.issuedAt
            this.tokenResponse.expiresIn = response.expiresIn
            this.tokenResponse.tokenType = response.tokenType
            this.tokenResponse.scope = response.scope
            this.tokenResponse.refreshToken = response.refreshToken
          } else {
            this.tokenResponse = response
          }

          // unset code, so we can do refresh token exchanges subsequently
          this.code = undefined
          localStorage.setItem(
            tokenName,
            JSON.stringify(this.tokenResponse.toJson())
          )

          if (this.request?.state) {
            const params = JSON.parse(this.request.state)
            this.redirectTo = params.redirectTo
          }

          window.location.href =
            this.redirectTo && this.redirectTo.startsWith('/')
              ? this.redirectUri + this.redirectTo
              : this.redirectUri
        })
        .catch((error) => {
          console.log(`Something bad happened ${error}`, error)
          this.signOut()

          if (error.message == '401') {
            window.location.href = '/unknown-user'
          }
        })
    }
  }

  signOut() {
    // forget all cached token state
    this.tokenResponse = undefined
    localStorage.removeItem(tokenName)
  }

  async getToken(): Promise<string | undefined> {
    try {
      const token = localStorage.getItem(tokenName)
      if (token) {
        const parsedJson = JSON.parse(token)

        this.tokenResponse = new TokenResponse({
          access_token: parsedJson.access_token,
          refresh_token: parsedJson.refresh_token,
          issued_at: parsedJson.issued_at,
          expires_in: parsedJson.expires_in,
          token_type: parsedJson.token_type,
          scope: parsedJson.scope,
        })

        if (
          this.tokenResponse.refreshToken &&
          this.tokenResponse.issuedAt &&
          this.tokenResponse.expiresIn &&
          new Date().getTime() >
            (this.tokenResponse.issuedAt + this.tokenResponse.expiresIn) * 1000
        ) {
          const redirectCandidate = new URL(location.href).pathname
          if (redirectCandidate.startsWith('/')) {
            this.redirectTo = redirectCandidate
          }

          await this.completeAuthorizationRequestIfPossible()
        }

        if (parsedJson && parsedJson.access_token) {
          return parsedJson.access_token
        }
      }
    } catch (e: unknown) {
      this.signOut()
      console.log('ERROR', e)
    }
  }

  async getUserMetadata() {
    const token = await this.getToken()
    if (!token) {
      return null
    }

    return token
  }
}

/**
 * @class NoHashQueryStringUtils
 *
 * `NoHashQueryStringUtils` extends AppAuth.js' default query string parser
 * (designed for Angular) to never assume `#`s are used for internal routing.
 *
 * This works around a bug where React URLs feature no hash, and so the parser
 * never detects the query string and OAuth parameters.
 */
class NoHashQueryStringUtils extends BasicQueryStringUtils {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parse(input: LocationLike, useHash: boolean) {
    return super.parse(input, false)
  }
}
