export function useAuth() {
  return {
    user: { name: 'Kovács Péter', initials: 'KP', role: 'admin' as const },
    isAuthenticated: true,
  }
}
