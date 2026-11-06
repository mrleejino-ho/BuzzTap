import {
  ArrowLeft,
  BriefcaseBusiness,
  ChartColumn,
  Coins,
  Monitor,
  Sparkles,
  WalletCards,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Button, PageHeader, cardClass } from "../components/BusinessUI"

const roadmapItems = [
  {
    title: "Workstations & session controls",
    description: "Advanced device management, session tracking, and workstation status tools for multi-device operations.",
    icon: Monitor,
  },
  {
    title: "BuzzPoints wallet features",
    description: "Customer wallet balances, BP settlement requests, and shared loyalty flows for future business expansion.",
    icon: WalletCards,
  },
  {
    title: "Customized BP & rebates",
    description: "Business-only rewards, promo campaigns, and rebate logic for loyalty programs and customer retention.",
    icon: Coins,
  },
  {
    title: "Subscription & business billing",
    description: "Free launch deployment now; paid subscription and admin billing flows can be added after the core POS release.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Advanced reporting",
    description: "Expanded sales analytics, wallet insights, and deeper operational dashboards for future growth stages.",
    icon: ChartColumn,
  },
  {
    title: "Launch-ready polish",
    description: "Final UX refinements, role-based onboarding, and deeper automation based on early POS adoption feedback.",
    icon: Sparkles,
  },
]

export default function WhatsComingSoon() {
  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        eyebrow="ROADMAP"
        title="What’s Coming Soon"
        description="These features are intentionally hidden from the launch POS experience so the business can deploy the core system first."
        action={
          <Link to="/settings">
            <Button secondary>
              <ArrowLeft size={17} />
              Back to Settings
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roadmapItems.map(({ title, description, icon: Icon }) => (
          <section key={title} className={`${cardClass} flex h-full flex-col`}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5C400]/10 text-[#F5C400]">
              <Icon size={20} />
            </div>

            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#AAA]">{description}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
