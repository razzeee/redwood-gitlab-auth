import { AuthorizationServiceConfiguration } from '@openid/appauth'
import { AuthorizationRequest } from '@openid/appauth/built/authorization_request'
import {
  AuthorizationNotifier,
  AuthorizationRequestHandler,
} from '@openid/appauth/built/authorization_request_handler'
import { RedirectRequestHandler } from '@openid/appauth/built/redirect_based_handler'
import { FetchRequestor } from '@openid/appauth/built/xhr'
import {
  TokenRequestHandler,
  BaseTokenRequestHandler,
} from '@openid/appauth/built/token_request_handler'
import { TokenResponse } from '@openid/appauth/built/token_response'
import { BasicQueryStringUtils } from '@openid/appauth/built/query_string_utils'
import { LocalStorageBackend } from '@openid/appauth/built/storage'
import { DefaultCrypto } from '@openid/appauth/built/crypto_utils'

import {
  TokenRequest,
  GRANT_TYPE_AUTHORIZATION_CODE,
} from '@openid/appauth/built/token_request'

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
  tokenResponse: TokenResponse | undefined

  constructor(clientId, redirectUri, authority) {
    this.clientId = clientId
    this.redirectUri = redirectUri
    this.configuration = new AuthorizationServiceConfiguration({
      authorization_endpoint: `${authority}/oauth/authorize`,
      token_endpoint: `${authority}/oauth/token`,
      revocation_endpoint: `${authority}/oauth/revoke`,
      userinfo_endpoint: `${authority}/oauth/userinfo`,
    })

    this.notifier = new AuthorizationNotifier()

    this.authorizationHandler = new RedirectRequestHandler(
      new LocalStorageBackend(),
      new NoHashQueryStringUtils(),
      window.location,
      new DefaultCrypto()
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

    // create a request
    this.request = new AuthorizationRequest({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'read_user',
      response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
      state: undefined,
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
          } else {
            this.tokenResponse = response
          }

          // unset code, so we can do refresh token exchanges subsequently
          this.code = undefined
          localStorage.setItem(tokenName, JSON.stringify(this.tokenResponse))

          window.location.href = this.redirectUri
        })
        .catch((error) => {
          console.log(`Something bad happened ${error}`)
        })
    }
  }

  signOut() {
    // forget all cached token state
    this.tokenResponse = undefined
    localStorage.removeItem(tokenName)
  }

  getToken(): Promise<string> {
    try {
      if (localStorage.getItem(tokenName)) {
        const parsedJson = JSON.parse(localStorage.getItem(tokenName))
        if (parsedJson && parsedJson.accessToken) {
          return parsedJson.accessToken
        }
      }
    } catch (e: any) {
      this.signOut()
      console.log('ERROR', e)
    }
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
  parse(input, useHash) {
    return super.parse(input, false)
  }
}
