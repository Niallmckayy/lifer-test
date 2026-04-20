interface VercelDeployment {
  url: string
  readyState: string
  meta?: {
    githubCommitRef?: string
  }
}

interface VercelDeploymentsResponse {
  deployments: VercelDeployment[]
}

/**
 * Poll the Vercel API until a preview deployment for the given branch
 * is READY, then return its public URL. Returns null if it times out.
 *
 * Polls every 8 seconds for up to 3 minutes (22 attempts).
 */
export async function waitForPreviewDeployment(
  projectId: string,
  branchName: string,
  teamId?: string | null,
): Promise<string | null> {
  const token = process.env.VERCEL_TOKEN
  if (!token) {
    console.warn('VERCEL_TOKEN not set — skipping preview URL polling')
    return null
  }

  const params = new URLSearchParams({ projectId, limit: '10' })
  if (teamId) params.set('teamId', teamId)

  for (let i = 0; i < 22; i++) {
    await new Promise(r => setTimeout(r, 8000))

    try {
      const res = await fetch(`https://api.vercel.com/v6/deployments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        console.warn(`Vercel API returned ${res.status}`)
        continue
      }

      const body = (await res.json()) as VercelDeploymentsResponse
      const match = body.deployments.find(
        d => d.meta?.githubCommitRef === branchName && d.readyState === 'READY',
      )
      if (match) return `https://${match.url}`
    } catch (err) {
      console.warn('Vercel polling error:', err)
    }
  }

  return null // timed out after ~3 min
}

interface VercelProjectResponse {
  id: string
}

export async function createVercelProject(params: {
  name: string
  githubRepo: string
  teamId?: string | null
}): Promise<string> {
  const token = process.env.VERCEL_TOKEN
  if (!token) throw new Error('VERCEL_TOKEN is not set')

  const { name, githubRepo, teamId } = params

  const url = teamId
    ? `https://api.vercel.com/v10/projects?teamId=${teamId}`
    : 'https://api.vercel.com/v10/projects'

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      gitRepository: {
        type: 'github',
        repo: githubRepo,
      },
      framework: null,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Vercel project creation failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as VercelProjectResponse
  return data.id
}

export async function waitForProductionDeployment(
  projectId: string,
  teamId?: string | null,
  timeoutMs = 180_000,
): Promise<string | null> {
  const token = process.env.VERCEL_TOKEN
  if (!token) {
    console.warn('VERCEL_TOKEN not set — skipping production deployment polling')
    return null
  }

  const params = new URLSearchParams({ projectId, target: 'production', limit: '5' })
  if (teamId) params.set('teamId', teamId)

  const attempts = Math.floor(timeoutMs / 8000)

  for (let i = 0; i < attempts; i++) {
    await new Promise(r => setTimeout(r, 8000))

    try {
      const res = await fetch(`https://api.vercel.com/v6/deployments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) continue

      const body = (await res.json()) as VercelDeploymentsResponse
      const match = body.deployments.find(d => d.readyState === 'READY')
      if (match) return `https://${match.url}`
    } catch (err) {
      console.warn('Vercel production polling error:', err)
    }
  }

  return null
}
