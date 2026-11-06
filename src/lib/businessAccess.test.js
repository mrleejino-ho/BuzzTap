import assert from "node:assert/strict"
import { test } from "node:test"
import { canAccessPage, rolesForPage, ROLE_PATHS } from "./businessAccess.js"

test("STAFF can access only operational purchase and catalog pages", () => {
  const requested = ["/staff-purchase", "/products-services"]
  assert.deepEqual(ROLE_PATHS.STAFF, requested)
  for (const path of requested) assert.equal(canAccessPage("STAFF", path), true)
  for (const path of ["/", "/transactions", "/customers", "/content", "/workstations", "/wallet", "/reports", "/settings", "/rebates", "/system-logs"])
    assert.equal(canAccessPage("STAFF", path), false)
})

test("page access uses one role map and deferred pages stay unavailable", () => {
  assert.equal(canAccessPage("UNKNOWN", "/"), false)
  assert.equal(canAccessPage(undefined, "/content"), false)
  assert.equal(canAccessPage("MANAGER", "/settings"), false)
  assert.equal(canAccessPage("OWNER", "/settings"), true)
  assert.equal(canAccessPage("MANAGER", "/reports"), true)
  assert.equal(canAccessPage("OWNER", "/system-logs"), true)
  assert.equal(canAccessPage("MANAGER", "/system-logs"), false)
  assert.deepEqual(rolesForPage("/reports"), ["OWNER", "MANAGER"])
  assert.deepEqual(rolesForPage("/settings"), ["OWNER"])
  assert.deepEqual(rolesForPage("/wallet"), [])
  assert.equal(canAccessPage("CASHIER", "/staff-purchase"), true)
  assert.equal(canAccessPage("CASHIER", "/workstations"), false)
  for (const role of Object.keys(ROLE_PATHS)) {
    for (const path of ["/wallet", "/workstations", "/rebates"]) {
      assert.equal(canAccessPage(role, path), false)
    }
  }
})
