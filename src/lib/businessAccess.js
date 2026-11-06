// Business membership roles control both navigation and direct route access.
export const ROLE_PATHS = {
  OWNER: ["/system-logs", "/", "/transactions", "/customers", "/products-services", "/settings", "/settings/coming-soon", "/content", "/staff-purchase"],
  MANAGER: ["/system-logs", "/", "/transactions", "/customers", "/products-services", "/settings/coming-soon", "/content", "/staff-purchase"],
  CASHIER: ["/transactions", "/customers", "/staff-purchase"],
  STAFF: ["/", "/staff-purchase", "/products-services", "/content"],
}

export const canAccessPage = (role, path) => (ROLE_PATHS[role] || []).includes(path)
