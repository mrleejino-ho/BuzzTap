import { useCallback, useEffect, useRef, useState } from "react"
import { CreditCard } from "lucide-react"
import { useBusiness } from "../businessContext"
import { supabase } from "../lib/supabaseClient"
import { Button, Field, inputClass } from "./BusinessUI"

export default function PaymentCustomer({ disabled = false, allowTap = true, linkedOnly = true, onChange }) {
  const { business, customers } = useBusiness()
  const [mode, setMode] = useState("MANUAL")
  const [code, setCode] = useState("")
  const [selected, setSelected] = useState("")
  const [lookingUp, setLookingUp] = useState(false)
  const [error, setError] = useState("")
  const token = useRef(0)
  const timer = useRef(null)
  const attempts = useRef({ code: "", failures: 0 })
  const eligible = customers.filter((item) => item.status === "ACTIVE" && (!linkedOnly || (item.profile_id && item.profileStatus === "ACTIVE")))
  const customer = eligible.find((item) => item.id === selected)
  useEffect(() => () => { token.current += 1 }, [])
  const reset = () => {
    token.current += 1
    setSelected("")
    setError("")
    setLookingUp(false)
    onChange?.()
  }
  const lookup = useCallback(async (value = code) => {
    const cardCode = value.trim()
    if (disabled || lookingUp || !cardCode || /^\d{6}$/.test(cardCode)) return
    const request = ++token.current
    setSelected(""); setError(""); setLookingUp(true); onChange?.()
    try {
      const { data, error: failure } = await supabase.rpc("resolve_customer_card_account", { p_business_id: business.id, p_card_code: cardCode })
      if (token.current !== request) return
      if (failure) throw failure
      const account = data?.[0]
      const found = eligible.find((item) => item.profile_id === account?.id)
      if (!found) throw new Error("This card's account must be registered and active in your business. Register it on the Customers page first.")
      setSelected(found.id)
      onChange?.()
      attempts.current = { code: cardCode, failures: 0 }
    } catch (failure) {
      if (token.current === request) {
        if (attempts.current.code !== cardCode) attempts.current = { code: cardCode, failures: 0 }
        attempts.current.failures += 1
        setError(failure.message || "Card lookup failed.")
      }
    }
    finally { if (token.current === request) setLookingUp(false) }
  }, [business, code, disabled, eligible, lookingUp, onChange])

  useEffect(() => {
    const cardCode = code.trim()
    if (
      mode !== "TAP" ||
      disabled ||
      !cardCode ||
      /^\d{6}$/.test(cardCode) ||
      selected ||
      lookingUp ||
      (attempts.current.code === cardCode && attempts.current.failures >= 2)
    ) return undefined

    timer.current = setTimeout(() => lookup(cardCode), 3000)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [code, disabled, lookingUp, lookup, mode, selected])

  const maskedCode = code.length > 4
    ? `${"*".repeat(code.length - 4)}${code.slice(-4)}`
    : code
  return <div className="space-y-3">
    {allowTap && <div className="grid grid-cols-2 gap-2" role="group" aria-label="Customer identification method">
      <Button secondary={mode !== "MANUAL"} disabled={disabled} onClick={() => { reset(); setCode(""); attempts.current = { code: "", failures: 0 }; setMode("MANUAL") }}>Select account</Button>
      <Button secondary={mode !== "TAP"} disabled={disabled} onClick={() => { reset(); setCode(""); attempts.current = { code: "", failures: 0 }; setMode("TAP") }}><CreditCard size={16} />Find by NFC card</Button>
    </div>}
    {mode === "TAP" && allowTap && <>
      <Field label="Tap NFC card"><div className="relative"><input autoFocus className={`${inputClass} font-mono text-transparent caret-white selection:bg-white/20`} style={{ WebkitTextFillColor: "transparent" }} value={code} disabled={disabled || lookingUp} autoComplete="off" maxLength={160} aria-label="NFC card code (masked)" onChange={(event) => { const value = event.target.value; reset(); setCode(value); if (attempts.current.code !== value.trim()) attempts.current = { code: value.trim(), failures: 0 } }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (timer.current) clearTimeout(timer.current); lookup(code) } }} placeholder="Tap or enter the Admin-issued card code" /><span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center font-mono text-sm text-white">{maskedCode}</span></div></Field>
      <p className="text-xs leading-5 text-[#AAA]">Lookup starts automatically 3 seconds after input stops. Six-digit numbers are ignored; after two failed lookups, change the code to retry. Only the last four characters are shown.</p>
      {lookingUp && <p role="status" className="text-xs text-[#F5C400]">Finding account…</p>}
    </>}
    <Field label={mode === "TAP" && allowTap ? "Linked customer account" : "Customer"}>
      <select className={inputClass} name="customerId" required value={customer?.id || ""} disabled={disabled} onChange={(event) => { setSelected(event.target.value); onChange?.() }}>
        <option value="" disabled>{mode === "TAP" && allowTap ? "Tap a registered card to find the account" : "Select customer"}</option>
        {(mode === "TAP" && allowTap ? customer ? [customer] : [] : eligible).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.customer_code || item.id}</option>)}
      </select>
    </Field>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </div>
}
