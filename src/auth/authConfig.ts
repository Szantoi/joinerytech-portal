import type { UserManagerSettings } from 'oidc-client-ts'
import { WebStorageStateStore } from 'oidc-client-ts'

const base = window.location.origin

export const authConfig: UserManagerSettings = {
  authority: 'https://joinerytech.hu/auth/realms/spaceos',
  client_id: 'portal-app',
  redirect_uri: `${base}/callback`,
  post_logout_redirect_uri: `${base}/`,
  response_type: 'code',
  scope: 'openid profile email',
  // stateStore: sessionStorage — túléli a Keycloak redirectet (PKCE state+nonce)
  stateStore: new WebStorageStateStore({ store: sessionStorage }),
  // userStore: sessionStorage (default) — token tárolás
}
