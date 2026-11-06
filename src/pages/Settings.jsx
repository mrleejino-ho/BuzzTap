import {
  Bell,
  Banknote,
  Building2,
  Check,
  CircleAlert,
  ClipboardCheck,
  Database,
  Eye,
  EyeOff,
  LockKeyhole,
  PackageCheck,
  Plus,
  ReceiptText,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react"
import { Link } from "react-router-dom"
import { useState } from "react"

import { useBusiness } from "../businessContext"
import {
  Button,
  Field,
  Modal,
  PageHeader,
  Status,
  cardClass,
  inputClass,
} from "../components/BusinessUI"

const requirementList = [
  ["At least 8 characters", (value) => value.length >= 8],
  ["One uppercase letter", (value) => /[A-Z]/.test(value)],
  ["One lowercase letter", (value) => /[a-z]/.test(value)],
  ["One number", (value) => /\d/.test(value)],
  ["One special character", (value) => /[^A-Za-z0-9]/.test(value)],
]

const launchChecklist = [
  {
    id: "production-config",
    title: "Production configuration is ready",
    details: "Confirm the production URL, HTTPS, and required Vercel environment variables are set in the hosting dashboard. Never deploy a local .env file.",
    icon: ShieldCheck,
  },
  {
    id: "auth-roles",
    title: "Sign-in and staff permissions are verified",
    details: "Test owner, manager, cashier, and staff access in production; confirm each role only sees and can use its permitted pages.",
    icon: UserCog,
  },
  {
    id: "cash-sale",
    title: "A real cash sale completes correctly",
    details: "Run a small test sale, check the amount due, cash received, change, receipt, transaction status, and inventory decrement.",
    icon: Banknote,
  },
  {
    id: "refund",
    title: "Refund behavior is verified",
    details: "Test a cash refund and confirm the ledger, inventory policy, receipt/history, and customer-facing records are correct.",
    icon: ReceiptText,
  },
  {
    id: "catalog",
    title: "Catalog and stock workflows are checked",
    details: "Verify product prices, stock counts, out-of-stock behavior, restocking, and any services you intend to sell.",
    icon: PackageCheck,
  },
  {
    id: "supabase",
    title: "Production database access is secure",
    details: "Confirm production migrations are applied, Row Level Security policies are enabled, and business data is isolated between accounts.",
    icon: Database,
  },
  {
    id: "cash-only",
    title: "Cash-only launch scope is enforced",
    details: "Verify the live cashier flow has no wallet or rewards payment option, and that hidden roadmap pages cannot be opened by non-authorized roles.",
    icon: ClipboardCheck,
  },
  {
    id: "recovery",
    title: "Recovery and support are planned",
    details: "Know how to restore a database backup, contact the system administrator, and report a failed or duplicate transaction.",
    icon: CircleAlert,
  },
]

function Settings({ changePassword }) {
  const businessData = useBusiness()
  const settingsKey = `${businessData.business?.id || ""}:${businessData.dataLoading ? "loading" : JSON.stringify(businessData.notificationPreferences)}`
  return <SettingsPanel key={settingsKey} changePassword={changePassword} {...businessData} />
}

function LaunchChecklist({ businessId }) {
  const storageKey = `buzztap-launch-checklist:${businessId || "unassigned"}`
  const [savedState, setSavedState] = useState(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      const checks = saved ? JSON.parse(saved) : {}
      if (!checks || typeof checks !== "object" || Array.isArray(checks)) {
        throw new Error("Saved checklist data is invalid.")
      }
      return { checks, error: "" }
    } catch (error) {
      return {
        checks: {},
        error: error instanceof SyntaxError
          ? "Saved launch checklist data could not be read. The checklist has been reset."
          : error.message || "Launch checklist progress could not be loaded.",
      }
    }
  })

  const verifiedChecks = launchChecklist.filter((item) => savedState.checks[item.id]).length
  const launchReady = verifiedChecks === launchChecklist.length

  const updateCheck = (id, checked) => {
    const checks = { ...savedState.checks, [id]: checked }
    setSavedState({ checks, error: "" })
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(checks))
    } catch {
      setSavedState({ checks, error: "Checklist progress could not be saved in this browser. Keep a separate record of completed checks." })
    }
  }

  return (
    <div className="rounded-2xl border border-[#242424] bg-[#111] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#F5C400]">STORE OPENING GATE</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Cash-only POS Go / No-Go</h3>
          <p className="mt-1 text-sm text-[#888]">Complete each item only after you have verified it in the production environment.</p>
        </div>
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-2 self-start rounded-xl border px-4 py-3 text-sm font-bold sm:self-auto ${
            launchReady
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {launchReady ? <Check size={18} /> : <CircleAlert size={18} />}
          {launchReady ? "GO TO PILOT" : "NO-GO"}
        </div>
      </div>

      <p className="mt-4 text-xs text-[#777]">
        {verifiedChecks} of {launchChecklist.length} checks verified. This is a manual release checklist; it does not replace deployment, database, or operational testing.
      </p>

      {savedState.error && (
        <p role="alert" className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          {savedState.error}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {launchChecklist.map(({ id, title, details, icon: Icon }) => (
          <label key={id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#242424] bg-[#0d0d0d] p-4 transition hover:border-[#F5C400]/40">
            <input
              type="checkbox"
              checked={Boolean(savedState.checks[id])}
              onChange={(event) => updateCheck(id, event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#F5C400]"
            />
            <Icon size={18} className="mt-0.5 shrink-0 text-[#F5C400]" />
            <span>
              <span className="block text-sm font-semibold text-white">{title}</span>
              <span className="mt-1 block text-xs leading-5 text-[#888]">{details}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

function SettingsPanel({
  business,
  profile,
  notificationPreferences,
  staff,
  accessLogs,
  addStaff,
  updateStaffStatus,
  deleteStaff,
  saveBusinessSettings,
  dataLoading,
  dataError,
  changePassword,
}) {
  const [businessForm, setBusinessForm] = useState({
    name: business?.name || "",
    email: business?.email || "",
    phone: business?.phone || "",
    address: business?.address || "",
  })
  const [notificationForm, setNotificationForm] = useState(notificationPreferences)
  const [saving, setSaving] = useState(false)
  const [staffModal, setStaffModal] = useState(false)
  const [passwordModal, setPasswordModal] = useState(false)
  const [notice, setNotice] = useState("")
  const [accessQuery, setAccessQuery] = useState("")
  const [accessDay, setAccessDay] = useState("")
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  })
  const [errors, setErrors] = useState({})
  const [visible, setVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  })
  const saveSettings = async () => {
    if (!businessForm.name.trim() || !businessForm.phone.trim() || !businessForm.address.trim()) {
      setNotice("Business name, phone, and address are required.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessForm.email.trim())) {
      setNotice("Enter a valid business email address.")
      return
    }
    setSaving(true)
    setNotice("")
    const result = await saveBusinessSettings({
      ...businessForm,
      notifications: notificationForm,
    })
    setSaving(false)
    setNotice(result.success ? "Business settings saved." : result.error || "Business settings could not be saved.")
  }

  const invite = async (event) => {
    event.preventDefault()

    const result = await addStaff(
      Object.fromEntries(new FormData(event.currentTarget))
    )

    setNotice(
      result.success
        ? "Staff account created successfully."
        : result.error || "Staff invitation could not be saved."
    )

    if (result.success) {
      setStaffModal(false)
    }
  }

  const closePassword = () => {
    setPasswordModal(false)
    setPasswords({
      current: "",
      next: "",
      confirm: "",
    })
    setErrors({})
    setVisible({
      current: false,
      next: false,
      confirm: false,
    })
  }

  const validatePassword = () => {
    const nextErrors = {}

    if (!passwords.current) {
      nextErrors.current = "Current password is required."
    }

    if (!passwords.next) {
      nextErrors.next = "New password is required."
    } else if (
      !requirementList.every(([, test]) => test(passwords.next))
    ) {
      nextErrors.next = "Use all listed password requirements."
    }

    if (
      passwords.next === passwords.current &&
      passwords.next
    ) {
      nextErrors.next =
        "New password must be different from current password."
    }

    if (!passwords.confirm) {
      nextErrors.confirm = "Please confirm your new password."
    } else if (passwords.next !== passwords.confirm) {
      nextErrors.confirm = "Passwords do not match."
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const submitPasswordChange = async (event) => {
    event.preventDefault()

    if (!validatePassword()) {
      return
    }

    const result = await changePassword(passwords.current, passwords.next)
    setNotice(
      result.success
        ? "Password changed successfully."
        : result.error?.message || "Password change failed.",
    )
    if (result.success) closePassword()
  }

  const passwordField = (key, label, placeholder) => (
    <Field label={label}>
      <div className="relative">
        <input
          className={`${inputClass} pr-11`}
          name={key}
          type={visible[key] ? "text" : "password"}
          value={passwords[key]}
          onChange={(event) =>
            setPasswords((current) => ({
              ...current,
              [key]: event.target.value,
            }))
          }
          placeholder={placeholder}
          autoComplete={
            key === "current"
              ? "current-password"
              : "new-password"
          }
        />

        <button
          type="button"
          onClick={() =>
            setVisible((current) => ({
              ...current,
              [key]: !current[key],
            }))
          }
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#777] hover:bg-[#222] hover:text-white"
          aria-label={`${
            visible[key] ? "Hide" : "Show"
          } ${label.toLowerCase()}`}
        >
          {visible[key] ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
         )}
        </button>
      </div>

      {errors[key] && (
        <p className="mt-2 text-xs text-red-400">
          {errors[key]}
        </p>
     )}
    </Field>
  )

  const ownerName = profile?.full_name || profile?.email || ""
  const visibleAccessLogs = accessLogs
    .filter((entry) =>
      `${entry.userEmail} ${entry.event}`
        .toLowerCase()
        .includes(accessQuery.toLowerCase()),
    )
    .filter((entry) => !accessDay || entry.occurred_at?.slice(0, 10) === accessDay)
    .sort((left, right) => new Date(right.occurred_at) - new Date(left.occurred_at))
    .slice(0, 20)

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Settings"
        description="Manage your business profile, notifications, security, and staff access."
        action={
          <Button onClick={saveSettings} disabled={saving || dataLoading || !business?.id}>
            <Save size={17} />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        }
      />

     <div className="mb-6 space-y-5">
       <div className="rounded-2xl border border-[#F5C400]/25 bg-[#111] p-5 shadow-[8px_8px_25px_rgba(0,0,0,0.3)]">
         <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
           <div>
             <p className="text-sm font-medium text-[#F5C400]">LAUNCH ROADMAP</p>
             <h2 className="mt-2 text-xl font-semibold text-white">What’s Coming Soon</h2>
             <p className="mt-2 text-sm text-[#AAA]">
               The launch will stay cash-first. Future loyalty and subscription features remain in the roadmap and are intentionally hidden from the live POS screens.
             </p>
           </div>

           <Link to="/settings/coming-soon">
             <button className="rounded-xl border border-[#333] bg-[#191919] px-4 py-3 text-sm font-semibold text-white transition-all hover:border-[#F5C400]/50 hover:-translate-y-0.5">
               View roadmap
             </button>
           </Link>
         </div>
       </div>

       <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
         {[
           { label: "Workstations", status: "Planned", accent: "bg-[#F5C400]/10 text-[#F5C400]" },
           { label: "BuzzPoints wallet", status: "Planned", accent: "bg-[#F5C400]/10 text-[#F5C400]" },
           { label: "Customized BP rewards", status: "Planned", accent: "bg-[#F5C400]/10 text-[#F5C400]" },
           { label: "Subscription access", status: "Free launch", accent: "bg-emerald-500/10 text-emerald-300" },
         ].map((item) => (
           <div key={item.label} className="rounded-2xl border border-[#242424] bg-[#111] p-4">
             <div className="flex items-center justify-between gap-3">
               <p className="text-sm font-medium text-white">{item.label}</p>
               <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${item.accent}`}>
                 {item.status}
               </span>
             </div>
             <p className="mt-3 text-xs text-[#777]">
               {item.status === "Free launch" ? "Enabled as a free public launch path." : "Hidden from the standard POS launch until a later release."}
             </p>
           </div>
         ))}
       </div>

       <LaunchChecklist key={business?.id || "unassigned"} businessId={business?.id} />
     </div>

     {(notice || dataError) && (
       <p role={dataError ? "alert" : "status"} className={`mb-5 rounded-xl border p-3 text-sm ${dataError ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-[#F5C400]/30 bg-[#F5C400]/10 text-[#F5C400]"}`}>
         {dataError ? `Database error: ${dataError}` : notice}
       </p>
     )}

     <div className="grid gap-6 lg:grid-cols-2">
        {/* BUSINESS PROFILE */}
        <section className={cardClass}>
          <div className="mb-6 flex items-center gap-3">
            <Building2 className="text-[#F5C400]" />

            <div>
              <h2 className="font-semibold text-white">
                Business Profile
              </h2>

              <p className="text-sm text-[#666]">
                {business
                  ? `${business.business_code || "Business"} · ${
                      business.business_type || "Business"
                    }`
                  : "Business details unavailable"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Business Name">
              <input
                className={inputClass}
                value={businessForm.name}
                onChange={(event) => setBusinessForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Business name unavailable"
                required
              />
            </Field>

            <Field label="Owner">
              <input
                className={inputClass}
                value={ownerName}
                readOnly
                placeholder="Owner information unavailable"
              />
            </Field>

            <Field label="Contact Information">
              <div className="space-y-3">
                <input
                  className={inputClass}
                  type="email"
                  value={businessForm.email}
                  onChange={(event) => setBusinessForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="Business email"
                  aria-label="Business email"
                  required
                />
                <input
                  className={inputClass}
                  type="tel"
                  value={businessForm.phone}
                  onChange={(event) => setBusinessForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="Business phone"
                  aria-label="Business phone"
                  required
                />
                <textarea
                  className={inputClass}
                  value={businessForm.address}
                  onChange={(event) => setBusinessForm((current) => ({ ...current, address: event.target.value }))}
                  placeholder="Business address"
                  aria-label="Business address"
                  rows="2"
                  required
                />
              </div>
            </Field>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        <section className={cardClass}>
          <div className="mb-6 flex items-center gap-3">
            <Bell className="text-[#F5C400]" />
            <h2 className="font-semibold text-white">
              Notifications
            </h2>
          </div>

          {[
            ["Transaction alerts", "transactionAlerts"],
            ["Settlement updates", "settlementUpdates"],
            ["Content moderation", "contentModeration"],
            ["Low inventory", "lowPointInventory"],
          ].map(([label, key]) => (
            <label
              className="flex items-center justify-between border-b border-[#242424] py-4 text-sm text-[#AAA]"
              key={label}
            >
              {label}

              <input
                type="checkbox"
                checked={Boolean(notificationForm[key])}
                onChange={(event) => setNotificationForm((current) => ({ ...current, [key]: event.target.checked }))}
                className="h-4 w-4 accent-[#F5C400]"
              />
            </label>
          ))}
        </section>

        {/* STAFF */}
        <section className={`${cardClass} lg:col-span-2`}>
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCog className="text-[#F5C400]" />

              <div>
                <h2 className="font-semibold text-white">
                  Staff Accounts
                </h2>

                <p className="text-sm text-[#666]">
                  Roles control which business features each member
                  can access.
                </p>
              </div>
            </div>

            <Button onClick={() => setStaffModal(true)}>
              <Plus size={17} />
              Add Staff
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {staff.length ? (
              staff.map((member) => (
                <div
                  className="rounded-xl border border-[#242424] bg-[#0d0d0d] p-4"
                  key={member.id}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-white">
                        {member.name}
                      </p>

                      <p className="mt-1 text-xs text-[#666]">
                        {member.email}
                      </p>
                    </div>

                    <Status>{member.status}</Status>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#F5C400]">
                      {member.role}
                    </span>

                    {member.status === "ACTIVE" &&
                      member.role !== "OWNER" && (
                        <button
                          onClick={async () => await updateStaffStatus(
                              member.id,
                              "SUSPENDED"
                            )}
                          className="text-xs text-red-400"
                        >
                          Suspend
                        </button>
                     )}

                    {member.status === "SUSPENDED" && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={async () => await updateStaffStatus(
                              member.id,
                              "ACTIVE"
                            )}
                          className="text-xs text-[#F5C400]"
                        >
                          Reactivate
                        </button>

                        <button
                          onClick={async () => {
                            if (!window.confirm(`Delete the account for ${member.email}?`)) return
                            await deleteStaff(member.id)
                          }}
                          className="inline-flex items-center gap-1 text-xs text-red-400"
                        >
                          <Trash2 size={14} />
                          Delete account
                        </button>
                      </div>
                   )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#666]">
                No staff accounts available.
              </p>
           )}
          </div>
        </section>

        {/* ACCESS HISTORY */}
        <section className={`${cardClass} lg:col-span-2`}>
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <UserCog className="text-[#F5C400]" />

              <div>
                <h2 className="font-semibold text-white">
                  Member Access History
                </h2>

                <p className="text-sm text-[#666]">
                  Showing up to 20 most recent events.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
                <input
                  className={`${inputClass} pl-9 sm:w-64`}
                  placeholder="Search email or event"
                  value={accessQuery}
                  onChange={(event) => setAccessQuery(event.target.value)}
                />
              </div>

              <input
                className={inputClass}
                type="date"
                value={accessDay}
                onChange={(event) => setAccessDay(event.target.value)}
                aria-label="Filter access history by day"
              />
            </div>
          </div>

          {visibleAccessLogs.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-[#242424] text-xs uppercase tracking-wider text-[#666]">
                  <tr>
                    <th className="px-3 py-3">Email</th>
                    <th className="px-3 py-3">Event</th>
                    <th className="px-3 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAccessLogs.map((entry) => (
                    <tr className="border-b border-[#1d1d1d] last:border-0" key={entry.id}>
                      <td className="px-3 py-3 text-white">{entry.userEmail}</td>
                      <td className="px-3 py-3">
                        <Status>{entry.event}</Status>
                      </td>
                      <td className="px-3 py-3 text-xs text-[#777]">{entry.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[#666]">No member access history available.</p>
          )}
        </section>

        {/* SECURITY */}
        <section className={cardClass}>
          <div className="mb-4 flex items-center gap-3">
            <LockKeyhole className="text-[#F5C400]" />

            <div>
              <h2 className="font-semibold text-white">
                Security
              </h2>

              <p className="text-sm text-[#666]">
                Manage your account security.
              </p>
            </div>
          </div>

          <button
            onClick={() => setPasswordModal(true)}
            className="w-full rounded-xl border border-[#333] px-4 py-3 text-left text-sm text-[#AAA] transition hover:-translate-y-0.5 hover:border-[#F5C400]/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40"
            aria-label="Change password"
          >
            Change password
          </button>

          <p className="mt-4 text-xs text-[#666]">
            Password changes are handled by your authenticated Supabase account.
          </p>
        </section>
      </div>

      {/* ADD STAFF MODAL */}
      {staffModal && (
        <Modal
          title="Add Staff"
          onClose={() => setStaffModal(false)}
        >
          <form
            onSubmit={invite}
            className="space-y-4"
          >
            <Field label="Full Name">
              <input
                className={inputClass}
                name="name"
                required
              />
            </Field>

            <Field label="Email">
              <input
                className={inputClass}
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </Field>

            <Field label="Phone Number">
              <input
                className={inputClass}
                name="phone"
                type="tel"
                required
                autoComplete="tel"
              />
            </Field>

            <Field label="Account Password">
              <input
                className={inputClass}
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
            </Field>

            <Field label="Role">
              <select
                className={inputClass}
                name="role"
                defaultValue="STAFF"
              >
                <option>MANAGER</option>
                <option>STAFF</option>
                <option>CASHIER</option>
              </select>
            </Field>

            <Button type="submit">
              Send Invitation
            </Button>
          </form>
        </Modal>
     )}

      {/* CHANGE PASSWORD MODAL */}
      {passwordModal && (
        <Modal
          title="Change Password"
          onClose={closePassword}
        >
          <p className="mb-6 text-sm text-[#888]">
            Update the password for your authenticated account.
          </p>

          <form
            onSubmit={submitPasswordChange}
            className="space-y-4"
          >
            {passwordField(
              "current",
              "Current Password",
              "Enter current password"
           )}

            {passwordField(
              "next",
              "New Password",
              "Enter a new password"
           )}

            <div className="rounded-xl border border-[#242424] bg-[#0d0d0d] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#666]">
                Password requirements
              </p>

              {requirementList.map(([label, test]) => (
                <p
                  className={`text-xs ${
                    test(passwords.next)
                      ? "text-[#F5C400]"
                      : "text-[#666]"
                  }`}
                  key={label}
                >
                  {test(passwords.next) ? "✓" : "○"}{" "}
                  {label}
                </p>
              ))}
            </div>

            {passwordField(
              "confirm",
              "Confirm New Password",
              "Repeat your new password"
           )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closePassword}
                className="rounded-xl border border-[#333] px-4 py-3 text-sm text-white"
              >
                Cancel
              </button>

              <Button type="submit">
                Change Password
              </Button>
            </div>
          </form>
        </Modal>
     )}
    </div>
  )
}

export default Settings