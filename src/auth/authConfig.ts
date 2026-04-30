import type { UserManagerSettings } from 'oidc-client-ts'
import { WebStorageStateStore, InMemoryWebStorage } from 'oidc-client-ts'

export const authConfig: UserManagerSettings = {
  authority: 'https://joinerytech.hu/auth/realms/spaceos',
  client_id: 'portal-app',
  redirect_uri: 'https://joinerytech.hu/callback',
  post_logout_redirect_uri: 'https://joinerytech.hu/',
  response_type: 'code',
  scope: 'openid profile email',
  // XSS védelem — state in memory, nem sessionStorage
  stateStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
  // userStore marad default (sessionStorage) — túléli a redirectet
}
