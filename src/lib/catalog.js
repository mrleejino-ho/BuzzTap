export function createProductId() {
  return `PROD-${globalThis.crypto.randomUUID().toUpperCase()}`
}

export function catalogCategories(products) {
  const categories = new Map()
  for (const product of products) {
    const category = product.category?.trim()
    if (category && !categories.has(category.toLowerCase())) {
      categories.set(category.toLowerCase(), category)
    }
  }
  return [...categories.values()].sort((a, b) => a.localeCompare(b))
}
