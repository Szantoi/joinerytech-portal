import type { UserManagerSettings } from 'oidc-client-ts'
import { WebStorageStateStore, InMemoryWebStorage } from 'oidc-client-ts'

// Node-környezetben (kontraktus-kapuk, tooling) nincs window — a csomag
// barrel-importja nem hasalhat el rajta; a fallback ott sosem kap forgalmat.
const base = typeof window === 'undefined' ? 'http://localhost' : window.location.origin

export const authConfig: UserManagerSettings = {
  authority: 'https://joinerytech.hu/auth/realms/spaceos',
  client_id: 'portal-app',
  redirect_uri: `${base}/callback`,
  post_logout_redirect_uri: `${base}/`,
  response_type: 'code',
  scope: 'openid profile email',
  // stateStore: sessionStorage — túléli a Keycloak redirectet (PKCE state+nonce)
  stateStore: new WebStorageStateStore({
    store: typeof sessionStorage === 'undefined' ? new InMemoryWebStorage() : sessionStorage,
  }),
  // userStore: sessionStorage (default) — token tárolás
}
