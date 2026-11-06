// Business membership roles control both navigation and direct route access.
export const ROLE_PATHS = {
  OWNER: ["/", "/staff-purchase", "/products-services", "/transactions", "/customers", "/reports", "/content", "/system-logs", "/settings", "/settings/coming-soon"],
  MANAGER: ["/", "/staff-purchase", "/products-services", "/transactions", "/customers", "/reports", "/content", "/settings/coming-soon"],
  CASHIER: ["/staff-purchase", "/transactions", "/customers"],
  STAFF: ["/staff-purchase", "/products-services"],
}

export const canAccessPage = (role, path) => (ROLE_PATHS[role] || []).includes(path)

export const rolesForPage = (path) =>
  Object.entries(ROLE_PATHS)
    .filter(([, paths]) => paths.includes(path))
    .map(([role]) => role)
