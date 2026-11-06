import { useCallback, useEffect, useRef, useState } from "react"
import { CreditCard } from "lucide-react"
import { useBusiness } from "../businessContext"
import { supabase } from "../lib/supabaseClient"
import { nextCustomerCode } from "../lib/customerRegistration"
import { Button, Field, Modal, inputClass } from "./BusinessUI"

export default function CustomerRegistration({ onClose, onRegistered }) {
  const { business, customers, dataLoading, dataError, refreshBusinessData } = useBusiness()
  const [mode, setMode] = useState("ACCOUNT")
  const [account, setAccount] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [cardCode, setCardCode] = useState("")
  const [lookingUp, setLookingUp] = useState(false)
  const [confirmAccount, setConfirmAccount] = useState(null)
  const lookupTimer = useRef(null)
  const lookupAttempts = useRef({ code: "", failures: 0 })
  const deletedCustomer = customers.find((customer) => customer.status === "DELETED" && (
    mode === "NFC" && account
      ? customer.profile_id === account.id || (!customer.profile_id && customer.email?.trim().toLowerCase() === email.trim().toLowerCase())
      : mode === "ACCOUNT" && !customer.profile_id && customer.email?.trim().toLowerCase() === email.trim().toLowerCase()
  ))
  const customerCode = deletedCustomer ? deletedCustomer.customer_code || deletedCustomer.id : nextCustomerCode(customers)

  const changeMode = (value) => {
    if (lookupTimer.current) clearTimeout(lookupTimer.current)
    setMode(value)
    setAccount(null)
    setName("")
    setEmail("")
    setCardCode("")
    lookupAttempts.current = { code: "", failures: 0 }
    setConfirmAccount(null)
    setError("")
  }

  const lookupCard = useCallback(async (value = cardCode) => {
    const code = value.trim()
    if (lookingUp || saving || !code || /^\d{6}$/.test(code)) return
    setLookingUp(true)
    setError("")
    setAccount(null)
    setName("")
    setEmail("")
    try {
      const result = await supabase.rpc("resolve_customer_card_account", { p_business_id: business.id, p_card_code: code })
      if (result.error) throw result.error
      const found = result.data?.[0]
      if (!found) throw new Error("No customer was found for this card.")
      setAccount(found)
      setName(found.full_name || "")
      setEmail(found.email || "")
      setConfirmAccount(found)
      lookupAttempts.current = { code, failures: 0 }
    } catch (failure) {
      if (lookupAttempts.current.code !== code) lookupAttempts.current = { code, failures: 0 }
      lookupAttempts.current.failures += 1
      setError(failure.message || "Card lookup failed.")
    }
    finally { setLookingUp(false) }
  }, [business, cardCode, lookingUp, saving])

  useEffect(() => {
    const code = cardCode.trim()
    if (
      mode !== "NFC" ||
      !code ||
      /^\d{6}$/.test(code) ||
      account ||
      confirmAccount ||
      lookingUp ||
      saving ||
      (lookupAttempts.current.code === code && lookupAttempts.current.failures >= 2)
    ) return undefined
    lookupTimer.current = setTimeout(() => lookupCard(code), 3000)
    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current)
    }
  }, [account, cardCode, confirmAccount, lookingUp, lookupCard, mode, saving])

  const register = async (event) => {
    event?.preventDefault()
    if (mode === "NFC" && !confirmAccount) return
    if (saving || lookingUp || dataLoading || dataError || !customerCode || (mode === "NFC" && !account)) return
    setSaving(true)
    setError("")
    try {
      const result = await supabase.rpc("register_customer_with_card_code", {
        p_business_id: business.id, p_profile_id: mode === "NFC" ? account?.id || null : null,
        p_name: name.trim(), p_email: email.trim(),
        p_customer_code: nextCustomerCode(customers),
        p_card_code: mode === "NFC" ? cardCode.trim() : null,
      })
      if (result.error) throw result.error
      await refreshBusinessData()
      onRegistered()
    } catch (failure) { setError(failure.message || "Customer registration failed.") }
    finally { setSaving(false) }
  }

  const cancelConfirmation = () => {
    if (saving) return
    setConfirmAccount(null)
    setAccount(null)
    setName("")
    setEmail("")
    setCardCode("")
    setError("")
  }
  const maskedCardCode = cardCode.length > 4
    ? `${"*".repeat(cardCode.length - 4)}${cardCode.slice(-4)}`
    : cardCode

  return <>
  <Modal title="Register Customer" onClose={() => { if (!saving) onClose() }}>
    <form onSubmit={register} className="space-y-4">
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Registration method">
        <Button type="button" secondary={mode !== "ACCOUNT"} disabled={saving || lookingUp} onClick={() => changeMode("ACCOUNT")}>Create local account</Button>
        <Button type="button" secondary={mode !== "NFC"} disabled={saving || lookingUp} onClick={() => changeMode("NFC")}><CreditCard size={16} />By BuzzTap NFC Card</Button>
      </div>
      {mode === "NFC" && <Field label="BuzzTap NFC Card Code"><div className="relative"><input className={`${inputClass} font-mono text-transparent caret-white selection:bg-white/20`} style={{ WebkitTextFillColor: "transparent" }} name="cardCode" required value={cardCode} disabled={saving || lookingUp} onChange={(event) => { const value = event.target.value; setCardCode(value); if (lookupAttempts.current.code !== value.trim()) lookupAttempts.current = { code: value.trim(), failures: 0 }; setAccount(null); setConfirmAccount(null); setName(""); setEmail(""); setError("") }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (lookupTimer.current) clearTimeout(lookupTimer.current); lookupCard(cardCode) } }} placeholder="Tap or enter the Admin-issued card code" aria-label="BuzzTap NFC card code (masked)" autoComplete="off" /><span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono text-sm text-white">{maskedCardCode}</span></div><p className="my-2 text-xs text-[#888]">Lookup starts automatically 3 seconds after input stops. Six-digit numbers are ignored; after two failed lookups, change the code to retry. The card stays linked by Admin.</p>{lookingUp && <p role="status" className="text-xs text-[#F5C400]">Finding customer…</p>}</Field>}
      {account && <p className="text-xs text-[#F5C400]">Customer found: {account.full_name || account.email}</p>}
      <Field label="Full Name"><input className={inputClass} name="name" required value={name} readOnly={Boolean(account)} disabled={saving} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label="Email"><input className={inputClass} name="email" type="email" required value={email} readOnly={Boolean(account)} disabled={saving} onChange={(event) => setEmail(event.target.value)} /></Field>
      <Field label="Customer ID (automatic)"><input className={inputClass} name="customerCode" readOnly value={dataLoading ? "" : customerCode || ""} placeholder="Generated automatically" /><p className="mt-2 text-xs text-[#888]">{deletedCustomer ? "This deleted customer will be restored with their original ID and history." : "Assigned when registered. The sequence starts at 001 each day."}</p></Field>
      {!customerCode && <p role="alert" className="text-sm text-red-300">The daily limit of 999 customer IDs has been reached.</p>}
      {dataError && <p role="alert" className="text-sm text-red-300">Customer records could not be loaded: {dataError}</p>}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {mode === "ACCOUNT" && <Button type="submit" disabled={saving || lookingUp || dataLoading || !!dataError || !customerCode}>{saving ? "Saving..." : deletedCustomer ? "Restore Customer" : "Register Customer"}</Button>}
    </form>
  </Modal>
  {confirmAccount && <Modal title="Confirm customer" onClose={cancelConfirmation}>
    <div className="space-y-4">
      <p className="text-sm text-[#AAA]">Register this customer using the scanned NFC card?</p>
      <div className="rounded-xl border border-[#292929] bg-[#0A0A0A] p-4">
        <p className="font-semibold text-white">{confirmAccount.full_name || "BuzzTap customer"}</p>
        <p className="mt-1 text-sm text-[#888]">{confirmAccount.email}</p>
        <p className="mt-2 font-mono text-xs text-[#777]">Card: {maskedCardCode}</p>
      </div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <div className="flex justify-end gap-3">
        <Button type="button" secondary disabled={saving} onClick={cancelConfirmation}>Cancel</Button>
        <Button type="button" disabled={saving || dataLoading || !!dataError} onClick={() => register()}>
          {saving ? "Registering…" : deletedCustomer ? "Confirm Restore" : "Confirm"}
        </Button>
      </div>
    </div>
  </Modal>}
  </>
}
