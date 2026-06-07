import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, MapPin, BellRing, Upload, Search, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PermitLeads — Find NYC construction leads before competitors" },
      { name: "description", content: "Search 500,000+ NYC DOB permit filings. Filter by trade, borough, budget. Save leads. Get alerts." },
      { property: "og:title", content: "PermitLeads — NYC construction leads from DOB data" },
      { property: "og:description", content: "Convert NYC Department of Buildings permit data into warm sales leads for contractors, architects, and trades." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-brand-foreground"><Building2 className="h-4 w-4" /></span>
            PermitLeads
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#features" className="hidden text-muted-foreground hover:text-foreground sm:block">Features</a>
            <a href="#pricing" className="hidden text-muted-foreground hover:text-foreground sm:block">Pricing</a>
            <Link to="/auth" className="text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link to="/auth" className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:opacity-90">
              Start free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--brand-soft),transparent)]" />
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Updated daily from NYC Open Data
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            Find NYC construction leads <span className="text-brand">before</span> your competitors do
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Search 500,000+ active DOB permit filings. Filter by trade, borough, and budget. Get alerts when new projects match your criteria.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-3 text-sm font-medium text-brand-foreground hover:opacity-90">
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-5 py-3 text-sm font-medium hover:bg-accent">
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">No credit card required · 25 free lead views/month</p>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-muted-foreground">
          Trusted by contractors, architects & material suppliers across all 5 boroughs
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { icon: Building2, title: "500K+ daily-updated filings", body: "All 5 boroughs, 95 data points per project — owner, applicant, cost, scope, work types, dates." },
            { icon: Search, title: "Trade-specific filters", body: "Filter by plumbing, sprinkler, mechanical, fire alarm, and 8 more work types. Borough, budget, building type." },
            { icon: BellRing, title: "Smart lead scoring", body: "Every filing gets a 0–100 score based on recency, scope, cost, and status. Sort by hot leads first." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-soft text-brand"><f.icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center font-display text-3xl font-bold">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { icon: Upload, n: "1", title: "Upload DOB data", body: "Drop today's DOB Job Application export — or let us auto-sync it nightly." },
              { icon: Search, n: "2", title: "Filter & score", body: "Slice by borough, job type, work scope, and budget. Hot leads bubble to the top." },
              { icon: MapPin, n: "3", title: "Save & work", body: "Save promising filings to your pipeline. Track outreach, notes, follow-up dates." },
            ].map((s) => (
              <div key={s.n} className="relative rounded-xl border border-border bg-card p-6">
                <div className="absolute -top-3 left-6 grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-bold text-brand-foreground">{s.n}</div>
                <s.icon className="h-5 w-5 text-brand" />
                <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center font-display text-3xl font-bold">Simple pricing</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">Start free. Upgrade when you're closing deals.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { plan: "Free", price: "$0", desc: "Get a feel for the data", features: ["25 lead views/month", "Basic search", "List view", "1 seat"], cta: "Start free" },
            { plan: "Pro", price: "$49", desc: "For active sales pros", features: ["Unlimited leads", "Full filter suite", "Map view", "3 saved alerts", "CSV/Excel export", "Email digest"], cta: "Start free trial", highlight: true },
            { plan: "Team", price: "$149", desc: "For small construction firms", features: ["Everything in Pro", "5 seats", "Shared pipeline", "HubSpot/Salesforce push", "REST API", "Priority support"], cta: "Start free trial" },
          ].map((p) => (
            <div key={p.plan} className={`relative rounded-2xl border p-6 ${p.highlight ? "border-brand bg-brand-soft" : "border-border bg-card"}`}>
              {p.highlight && <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-xs font-medium text-brand-foreground">Most popular</span>}
              <h3 className="font-display text-lg font-semibold">{p.plan}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-brand" /> {f}</li>
                ))}
              </ul>
              <Link to="/auth" className={`mt-6 block rounded-md px-4 py-2 text-center text-sm font-medium ${p.highlight ? "bg-brand text-brand-foreground hover:opacity-90" : "border border-input bg-card hover:bg-accent"}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} PermitLeads. NYC DOB data from NYC Open Data.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
