import { useState } from "react"
import { Grid2X2, List, Package, Plus, Search, ToggleLeft, Trash2 } from "lucide-react"
import { useBusiness } from "../businessContext"
import PaymentCustomer from "../components/PaymentCustomer"
import { createProductId } from "../lib/catalog"
import { Button, Field, Modal, PageHeader, Status, cardClass, inputClass } from "../components/BusinessUI"

function ProductsServices() {
  const { products, inventoryMovements, checkoutProduct, addProduct, updateProductStatus, deleteProduct, restockInventory, businessRole, dataLoading, dataError } = useBusiness()
  const canManage = ["OWNER", "MANAGER"].includes(businessRole)
  const canPurchase = ["OWNER", "MANAGER", "CASHIER"].includes(businessRole)
  const [query, setQuery] = useState("")
  const [viewMode, setViewMode] = useState("grid")
  const [modal, setModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState("")
  const [itemType, setItemType] = useState("PRODUCT")
  const [restockProduct, setRestockProduct] = useState(null)
  const [notice, setNotice] = useState("")
  const [checkout, setCheckout] = useState(null)
  const [purchaseCustomerType, setPurchaseCustomerType] = useState("ACCOUNT")
  const [paying, setPaying] = useState(false)
  const [catalogPaymentMethod, setCatalogPaymentMethod] = useState("CASH")
  const [paymentError, setPaymentError] = useState("")
  const [purchaseRequestId, setPurchaseRequestId] = useState(() => crypto.randomUUID())
  const [deleteItem, setDeleteItem] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const confirmDelete = async () => {
    if (deleting) return
    setDeleting(true)
    setDeleteError("")
    try {
      const result = await deleteProduct(deleteItem.id)
      if (result.success) { setNotice(`${deleteItem.name} deleted from the catalog.`); setDeleteItem(null) }
      else setDeleteError(result.error)
    } catch { setDeleteError("Item could not be deleted. Please try again.") }
    finally { setDeleting(false) }
  }
  const pay = async (event) => {
    event.preventDefault()
    if (paying) return
    const form = new FormData(event.currentTarget)
    setPaying(true)
    setPaymentError("")
    try {
      const details = {
        customerId: purchaseCustomerType === "ACCOUNT" ? form.get("customerId") : null,
        guestName: purchaseCustomerType === "LOCAL" ? String(form.get("guestName") || "").trim() : null,
        productId: checkout.id,
        quantity: Number(form.get("quantity")),
        requestId: purchaseRequestId,
      }
      const result = await checkoutProduct({ ...details, paymentMethod: "CASH", cashAmount: Number(form.get("cashAmount")) || Number(checkout.price) * Number(form.get("quantity")) })
      if (result.success) { setCheckout(null); setNotice(`Purchase completed for ${checkout.name}.`); setPurchaseCustomerType("ACCOUNT") }
      else setPaymentError(result.error)
    } catch { setPaymentError("Payment could not be completed. Retry with the same details.") }
    finally { setPaying(false) }
  }
  const visible = products.filter((item) =>
    `${item.id} ${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()),
  )
  const displayedProducts = visible.slice(0, 20)

  const add = async (event) => {
    event.preventDefault()
    if (adding || dataLoading || dataError) return
    const data = Object.fromEntries(new FormData(event.currentTarget))
    setAdding(true)
    setAddError("")
    try {
      const result = await addProduct({ ...data, id: createProductId(), category: "General", description: "", item_type: itemType, price: Number(data.price), stock: itemType === "PRODUCT" ? Number(data.stock) : 0 })
      if (result.success) { setNotice("Product added successfully."); setModal(false) }
      else setAddError(result.error || "Product save failed. Please try again.")
    } catch (error) { setAddError(error.message || "Product save failed. Please try again.") }
    finally { setAdding(false) }
  }

  const restock = async (event) => {
    event.preventDefault()
    const quantity = Number(new FormData(event.currentTarget).get("quantity"))
    const result = await restockInventory(restockProduct.id, quantity, "Manager stock replenishment")
    setNotice(result.success ? `${quantity} units added to ${restockProduct.name}.` : result.error)
    if (result.success) setRestockProduct(null)
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader title="Products & Services" description={canManage ? "Manage your catalog, prices, availability, and product stock." : "Browse your catalog, prices, availability, and product stock."} action={canManage && <Button disabled={dataLoading || !!dataError} onClick={() => { setItemType("PRODUCT"); setAddError(""); setModal(true) }}><Plus size={17} />Add Item</Button>} />
      {(notice || dataError || dataLoading) && <p role={dataError ? "alert" : "status"} className={`mb-5 rounded-xl border p-3 text-sm ${dataError ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-[#F5C400]/30 bg-[#F5C400]/10 text-[#F5C400]"}`}>{dataError ? `Database error: ${dataError}` : notice || "Loading catalog…"}</p>}
      <div className={`${cardClass} mb-6 flex items-center gap-3 p-4`}>
        <Search size={17} className="text-[#666]" />
        <input className={`${inputClass} border-0 p-0`} placeholder="Search product, category, or ID" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="ml-auto flex shrink-0 rounded-xl border border-[#292929] bg-[#0A0A0A] p-1" role="group" aria-label="Product display mode">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-label="View products as widgets"
            aria-pressed={viewMode === "grid"}
            title="Widget view"
            className={`rounded-lg p-2 transition ${viewMode === "grid" ? "bg-[#F5C400] text-black" : "text-[#888] hover:text-white"}`}
          >
            <Grid2X2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-label="View products as a list"
            aria-pressed={viewMode === "list"}
            title="List view"
            className={`rounded-lg p-2 transition ${viewMode === "list" ? "bg-[#F5C400] text-black" : "text-[#888] hover:text-white"}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>
      {visible.length > displayedProducts.length && <p className="mb-3 text-xs text-[#777]">Showing the first {displayedProducts.length} of {visible.length} matching items.</p>}
      <div className={viewMode === "grid" ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
        {displayedProducts.length ? displayedProducts.map((product) => (
          <div className={viewMode === "grid" ? cardClass : `${cardClass} flex flex-col gap-4 md:flex-row md:items-center md:gap-6`} key={product.id}>
            <div className={viewMode === "grid" ? "flex items-start justify-between" : "flex min-w-0 items-center gap-4 md:flex-1"}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F5C400]/10 text-[#F5C400]"><Package size={21} /></div>
              <div className={`min-w-0 ${viewMode === "grid" ? "mt-6" : "flex-1"}`}>
                <p className="truncate text-xs text-[#666]">{product.id} · {product.category}</p>
                <h2 className={`mt-1 truncate font-semibold text-white ${viewMode === "grid" ? "text-xl" : "text-base"}`}>{product.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-[#777]">{product.description}</p>
              </div>
              <Status>{product.status}</Status>
            </div>
            <div className={viewMode === "grid" ? "mt-2 flex items-center justify-between border-t border-[#242424] pt-4" : "flex items-center justify-between gap-4 md:w-48"}>
              <div>
                <span className="text-xl font-bold text-[#F5C400]">{product.price} cash</span>
                {(product.item_type || "PRODUCT") === "PRODUCT" && <p className="mt-1 text-xs text-[#777]">{product.stock} in stock</p>}
              </div>
              {viewMode === "grid" && <div className="flex items-center gap-2">
                {canPurchase && (product.item_type || "PRODUCT") === "PRODUCT" && product.status === "ACTIVE" && <Button secondary disabled={!product.stock} onClick={() => { setCheckout(product); setPurchaseCustomerType("ACCOUNT"); setPurchaseRequestId(crypto.randomUUID()); setPaymentError("") }}>Customer purchase</Button>}
                {canManage && (product.item_type || "PRODUCT") === "PRODUCT" && <button onClick={() => setRestockProduct(product)} disabled={product.status !== "ACTIVE"} className="rounded-lg bg-[#1d1d1d] px-3 py-2 text-xs text-[#AAA] disabled:opacity-50">Restock</button>}
                {canManage && <button title="Toggle availability" aria-label={`${product.status === "ACTIVE" ? "Deactivate" : "Activate"} ${product.name}`} onClick={async () => {
                    const ok = await updateProductStatus(product.id, product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")
                    setNotice(ok ? `${product.name} availability updated.` : "Product status update failed.")
                  }} className="rounded-lg p-2 text-[#777] hover:bg-[#222] hover:text-white"><ToggleLeft size={20} /></button>}
                {["OWNER", "MANAGER"].includes(businessRole) && <button type="button" title="Delete item" aria-label={`Delete ${product.name}`} onClick={() => { setDeleteItem(product); setDeleteError("") }} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"><Trash2 size={18} /></button>}
              </div>
              }
            </div>
            {viewMode === "list" && <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {canPurchase && (product.item_type || "PRODUCT") === "PRODUCT" && product.status === "ACTIVE" && <Button secondary disabled={!product.stock} onClick={() => { setCheckout(product); setPurchaseRequestId(crypto.randomUUID()); setPaymentError("") }}>Customer purchase</Button>}
              {canManage && (product.item_type || "PRODUCT") === "PRODUCT" && <button onClick={() => setRestockProduct(product)} disabled={product.status !== "ACTIVE"} className="rounded-lg bg-[#1d1d1d] px-3 py-2 text-xs text-[#AAA] disabled:opacity-50">Restock</button>}
              {canManage && <button title="Toggle availability" aria-label={`${product.status === "ACTIVE" ? "Deactivate" : "Activate"} ${product.name}`} onClick={async () => {
                  const ok = await updateProductStatus(product.id, product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")
                  setNotice(ok ? `${product.name} availability updated.` : "Product status update failed.")
                }} className="rounded-lg p-2 text-[#777] hover:bg-[#222] hover:text-white"><ToggleLeft size={20} /></button>}
              {["OWNER", "MANAGER"].includes(businessRole) && <button type="button" title="Delete item" aria-label={`Delete ${product.name}`} onClick={() => { setDeleteItem(product); setDeleteError("") }} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"><Trash2 size={18} /></button>}
            </div>}
          </div>
        )) : <div className={`${cardClass} text-center text-sm text-[#666]`}>{dataLoading ? "Loading products…" : "No products found."}</div>}
      </div>
      {deleteItem && <Modal title="Delete Catalog Item" onClose={() => { if (!deleting) setDeleteItem(null) }}>
        <p className="text-sm text-[#AAA]">Delete <strong className="text-white">{deleteItem.name}</strong> from your catalog? It will no longer be available for purchase. Past transactions and stock records will be preserved.</p>
        {deleteError && <p role="alert" className="mt-4 text-sm text-red-300">{deleteError}</p>}
        <div className="mt-6 flex justify-end gap-3"><Button secondary disabled={deleting} onClick={() => setDeleteItem(null)}>Cancel</Button><Button disabled={deleting} onClick={confirmDelete}>{deleting ? "Deleting…" : "Confirm Delete"}</Button></div>
      </Modal>}
      {modal && <Modal title="Add Catalog Item" onClose={() => { if (!adding) setModal(false) }}><form onSubmit={add} className="space-y-4">
        <Field label="Item type"><select className={inputClass} value={itemType} onChange={(event) => setItemType(event.target.value)}><option value="PRODUCT">Product</option><option value="SERVICE">Service</option></select></Field>
        <p className="text-xs text-[#777]">A unique product ID will be generated automatically.</p>
        <Field label="Product Name"><input className={inputClass} name="name" required placeholder="Enter product name" /></Field>
        <Field label="Unit price (cash)"><input className={inputClass} name="price" type="number" min="0" required placeholder="50" /></Field>
        {itemType === "PRODUCT" && <Field label="Opening Stock Quantity"><input className={inputClass} name="stock" type="number" min="0" step="1" required defaultValue="0" /></Field>}
        {addError && <p role="alert" className="text-sm text-red-300">{addError}</p>}
        <Button type="submit" disabled={adding || dataLoading || !!dataError}>{adding ? "Adding..." : "Add Item"}</Button>
      </form></Modal>}
      {checkout && <Modal title={`Purchase · ${checkout.name}`} onClose={() => { if (!paying) setCheckout(null) }}><form onSubmit={pay} className="space-y-4">
        <Field label="Payment method"><select className={inputClass} value={catalogPaymentMethod} disabled={paying} onChange={(event)=>{setCatalogPaymentMethod(event.target.value);setPurchaseRequestId(crypto.randomUUID())}}><option value="CASH">Cash</option></select></Field>
        <Field label="Customer type"><select className={inputClass} value={purchaseCustomerType} disabled={paying} onChange={(event) => { setPurchaseCustomerType(event.target.value); setPurchaseRequestId(crypto.randomUUID()) }}><option value="ACCOUNT">Select customer account</option><option value="LOCAL">Local unregistered customer</option></select></Field>
        {purchaseCustomerType === "ACCOUNT"
          ? <PaymentCustomer key={catalogPaymentMethod} disabled={paying} onChange={() => setPurchaseRequestId(crypto.randomUUID())} />
          : <Field label="Local customer name"><input className={inputClass} name="guestName" required maxLength={160} disabled={paying} placeholder="Type customer name" /></Field>}
        <Field label="Quantity"><input className={inputClass} name="quantity" type="number" required min="1" max={checkout.stock} step="1" defaultValue="1" disabled={paying} onChange={() => setPurchaseRequestId(crypto.randomUUID())} /></Field>
        <Field label="Cash received"><input className={inputClass} name="cashAmount" type="number" min={0.01} step="0.01" required disabled={paying} placeholder="Enter amount paid by customer" /></Field>
        <p className="text-sm text-[#AAA]">{checkout.price} cash per unit. Launch payment flow is cash-only.</p>
        {paymentError && <p role="alert" className="text-sm text-red-300">{paymentError}</p>}
        <Button type="submit" disabled={paying}>{paying ? "Paying…" : "Complete Cash Purchase"}</Button>
      </form></Modal>}
      {restockProduct && <Modal title={`Restock ${restockProduct.name}`} onClose={() => setRestockProduct(null)}><form onSubmit={restock} className="space-y-4">
        <p className="text-sm text-[#AAA]">Current stock: <strong className="text-white">{restockProduct.stock}</strong></p>
        <Field label="Quantity to add"><input className={inputClass} name="quantity" type="number" min="1" step="1" required autoFocus /></Field>
        <Button type="submit"><Plus size={17} />Record restock</Button>
      </form></Modal>}
      <section className={`${cardClass} mt-8`}>
        <h2 className="text-lg font-semibold text-white">Recent stock movements</h2>
        {inventoryMovements.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-[#242424] text-xs uppercase text-[#666]"><tr><th className="px-3 py-3">Product</th><th className="px-3 py-3">Movement</th><th className="px-3 py-3">Quantity</th><th className="px-3 py-3">Operator</th><th className="px-3 py-3">Date</th></tr></thead>
              <tbody>{inventoryMovements.slice(0, 20).map((item) => (
                <tr className="border-b border-[#1d1d1d] last:border-0" key={item.id}>
                  <td className="px-3 py-3 text-white">{item.productName}</td>
                  <td className="px-3 py-3 text-[#AAA]">{item.movement_type}</td>
                  <td className="px-3 py-3 text-white">{item.movement_type === "ISSUE" ? "-" : "+"}{item.quantity}</td>
                  <td className="px-3 py-3 text-[#AAA]">{item.operatorName}</td>
                  <td className="px-3 py-3 text-[#777]">{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="mt-3 text-sm text-[#777]">No stock movements recorded yet.</p>}
      </section>
    </div>
  )
}

export default ProductsServices
