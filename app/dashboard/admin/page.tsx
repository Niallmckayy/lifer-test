import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getAdminDashboardData } from '@/lib/actions'
import AdminActions from './AdminActions'
import AdminBillingForm from './AdminBillingForm'
import AdminDeploymentForm from './AdminDeploymentForm'
import AdminImportForm from './AdminImportForm'
import DeleteClientButton from './DeleteClientButton'
import AdminResetPasswordButton from './AdminResetPasswordButton'
import SignOutButton from '@/components/ui/SignOutButton'
import BirdLogo from '@/components/ui/BirdLogo'

const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
  PENDING:  { bg: 'rgba(245,232,208,0.06)',      color: 'rgba(245,232,208,0.5)', dot: '#7a8585' },
  DRAFT:    { bg: 'rgba(212,131,12,0.12)',        color: '#e8a020',               dot: '#d4830c' },
  APPROVED: { bg: 'rgba(77,158,58,0.12)',         color: '#6dbf56',               dot: '#4d9e3a' },
  DEPLOYED: { bg: 'rgba(77,158,58,0.18)',         color: '#6dbf56',               dot: '#4d9e3a' },
  DENIED:   { bg: 'rgba(192,57,27,0.12)',         color: '#e05a3a',               dot: '#c0391b' },
}

const clientStatusStyle: Record<string, { bg: string; color: string }> = {
  Active:   { bg: 'rgba(77,158,58,0.12)',   color: '#6dbf56' },
  Inactive: { bg: 'rgba(245,232,208,0.06)', color: 'rgba(245,232,208,0.3)' },
  Pending:  { bg: 'rgba(212,131,12,0.12)',  color: '#e8a020' },
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider"
      style={{ color: 'rgba(245,232,208,0.25)', borderBottom: '1px solid rgba(245,232,208,0.06)' }}
    >
      {children}
    </th>
  )
}

function Tag({ label, style }: { label: string; style: { bg: string; color: string; dot?: string } }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 capitalize"
      style={{ background: style.bg, color: style.color, borderRadius: '999px' }}
    >
      {style.dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: style.dot }} />}
      {label.toLowerCase()}
    </span>
  )
}

function StatCard({ label, value, sub, accent = false }: { label: string; value: number | string; sub?: string; accent?: boolean }) {
  return (
    <div
      className="flex flex-col gap-1 px-5 py-5 relative overflow-hidden"
      style={{
        background: accent ? 'rgba(212,131,12,0.08)' : 'rgba(245,232,208,0.03)',
        borderRadius: '16px',
        border: accent ? '1px solid rgba(212,131,12,0.22)' : '1px solid rgba(245,232,208,0.07)',
      }}
    >
      {accent && (
        <div
          className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(212,131,12,0.15), transparent 70%)' }}
        />
      )}
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
      <span className="text-2xl font-bold tabular-nums" style={{ color: accent ? '#e8a020' : '#f5e8d0' }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{sub}</span>}
    </div>
  )
}

export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') redirect('/login')

  const { clients, changeRequests, analytics } = await getAdminDashboardData()

  return (
    <div className="min-h-screen" style={{ background: '#0e0b07' }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-6 py-3.5 sticky top-0 z-10"
        style={{
          background: 'rgba(14,11,7,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(212,131,12,0.14)',
        }}
      >
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5" style={{ color: '#d4830c' }}>
            <BirdLogo size={20} />
            <span className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}>
              Lifer
            </span>
          </Link>
          <span className="block w-px h-4" style={{ background: 'rgba(245,232,208,0.1)' }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(245,232,208,0.3)' }}>
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/prospects"
            className="text-xs font-semibold px-4 py-2 transition-all hover:opacity-70"
            style={{ background: 'rgba(245,232,208,0.06)', borderRadius: '999px', color: 'rgba(245,232,208,0.6)', border: '1px solid rgba(245,232,208,0.1)' }}
          >
            Prospects
          </Link>
          <Link
            href="/dashboard/admin/clients/new"
            className="text-xs font-semibold px-4 py-2 transition-all hover:opacity-90"
            style={{ background: '#d4830c', borderRadius: '999px', color: '#fff' }}
          >
            + New Client
          </Link>
          <SignOutButton
            className="text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'rgba(245,232,208,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">

        {/* ── Analytics ────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
            This month
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total clients"   value={analytics.totalClients} />
            <StatCard label="Active"          value={analytics.activeThisMonth}      sub="with requests" />
            <StatCard label="Requests"        value={analytics.requestsThisMonth}    sub="submitted" accent />
            <StatCard label="Pending review"  value={analytics.draftsPending}        sub="drafts" />
            <StatCard label="Deployments"     value={analytics.deploymentsThisMonth} sub="gone live" />
            <StatCard label="Prospects ready" value={(analytics as { readyProspects?: number }).readyProspects ?? 0} sub="awaiting outreach" />
          </div>
        </section>

        {/* ── Clients ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-semibold text-white">Clients</h2>
            <span
              className="text-xs font-semibold px-2.5 py-1"
              style={{ background: 'rgba(212,131,12,0.12)', color: '#e8a020', borderRadius: '999px' }}
            >
              {clients.length}
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th>Draft</Th>
                  <Th>Website</Th>
                  <Th>Deployment</Th>
                  <Th>Import</Th>
                  <Th>Billing</Th>
                  <Th>Password</Th>
                  <Th>{''}</Th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, i) => (
                  <tr
                    key={client.id}
                    className="transition-colors hover:bg-white/2"
                    style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
                  >
                    <td className="px-5 py-4 font-medium text-white">
                      <div>{client.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{client.plan}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {(client as { user?: { email?: string } }).user?.email ?? '—'}
                    </td>
                    <td className="px-5 py-4">
                      <Tag
                        label={client.status}
                        style={clientStatusStyle[client.status] ?? { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
                      />
                    </td>
                    <td className="px-5 py-4">
                      {(client as { website?: { draftVersionId?: string | null } }).website?.draftVersionId ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#e8a020' }}>
                          <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#d4830c' }} />
                          draft
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {(client as { website?: { slug?: string; previewUrl?: string | null } }).website ? (
                        <a
                          href={(client as { website?: { previewUrl?: string | null; slug?: string } }).website?.previewUrl ?? `/sites/${(client as { website?: { slug?: string } }).website?.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium transition-opacity hover:opacity-70"
                          style={{ color: '#d4830c' }}
                        >
                          ↗ open
                        </a>
                      ) : (
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <AdminDeploymentForm
                        websiteId={(client as { website?: { id?: string } }).website?.id ?? ''}
                        githubRepo={(client as { website?: { githubRepo?: string | null } }).website?.githubRepo ?? null}
                        githubBranch={(client as { website?: { githubBranch?: string | null } }).website?.githubBranch ?? null}
                        vercelProjectId={(client as { website?: { vercelProjectId?: string | null } }).website?.vercelProjectId ?? null}
                        vercelTeamId={(client as { website?: { vercelTeamId?: string | null } }).website?.vercelTeamId ?? null}
                        previewUrl={(client as { website?: { previewUrl?: string | null } }).website?.previewUrl ?? null}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <AdminImportForm
                        websiteId={(client as { website?: { id?: string } }).website?.id ?? ''}
                        hasImport={!!(client as { website?: { htmlContent?: string | null } }).website?.htmlContent}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <AdminBillingForm
                        clientId={client.id}
                        stripeCustomerId={(client as { stripeCustomerId?: string | null }).stripeCustomerId ?? null}
                        stripeSubscriptionId={(client as { stripeSubscriptionId?: string | null }).stripeSubscriptionId ?? null}
                        plan={client.plan}
                        requestLimit={client.requestLimit}
                        subscriptionStatus={(client as { subscriptionStatus?: string | null }).subscriptionStatus ?? null}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <AdminResetPasswordButton clientId={client.id} />
                    </td>
                    <td className="px-5 py-4">
                      <DeleteClientButton clientId={client.id} clientName={client.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Change requests ───────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-semibold text-white">Change Requests</h2>
            <span
              className="text-xs font-semibold px-2.5 py-1"
              style={{ background: 'rgba(212,131,12,0.12)', color: '#e8a020', borderRadius: '999px' }}
            >
              {changeRequests.length}
            </span>
          </div>

          {changeRequests.length === 0 ? (
            <div
              className="px-8 py-20 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-sm font-medium mb-1 text-white">Queue is empty</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Customer requests will appear here</p>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <Th>Client</Th>
                    <Th>Request</Th>
                    <Th>Date</Th>
                    <Th>Status</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {changeRequests.map((req, i) => (
                    <tr
                      key={req.id}
                      className="transition-colors hover:bg-white/2"
                      style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
                    >
                      <td className="px-5 py-4 font-medium whitespace-nowrap text-white">
                        {(req as { client: { name: string } }).client.name}
                      </td>
                      <td className="px-5 py-4 max-w-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        <span className="block truncate">{req.message}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-5 py-4">
                        <Tag label={req.status} style={statusStyle[req.status] ?? statusStyle.PENDING} />
                      </td>
                      <td className="px-5 py-4">
                        <AdminActions
                          requestId={req.id}
                          status={req.status}
                          githubPrNumber={(req as { githubPrNumber?: number | null }).githubPrNumber}
                          githubPrUrl={(req as { githubPrUrl?: string | null }).githubPrUrl}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
