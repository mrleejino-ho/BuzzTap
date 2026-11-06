import test from "node:test"
import assert from "node:assert/strict"
import { createProductId, catalogCategories } from "./catalog.js"

test("product IDs are globally unique UUID-based catalog IDs", () => {
  const first = createProductId()
  const second = createProductId()
  assert.match(first, /^PROD-[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/)
  assert.notEqual(first, second)
})

test("category suggestions trim, deduplicate and sort previous categories", () => {
  assert.deepEqual(catalogCategories([{ category: " Drinks " }, { category: "drinks" }, { category: "Gaming" }, { category: null }]), ["Drinks", "Gaming"])
})
