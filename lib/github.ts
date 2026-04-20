import { Octokit } from '@octokit/rest'

function getOctokit() {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN is not set')
  return new Octokit({ auth: token })
}

function parseRepo(repo: string): { owner: string; repo: string } {
  const [owner, name] = repo.split('/')
  if (!owner || !name) throw new Error(`Invalid repo format: "${repo}" — expected "owner/repo"`)
  return { owner, repo: name }
}

async function getMainSha(octokit: Octokit, owner: string, repo: string): Promise<string> {
  const { data } = await octokit.repos.getBranch({ owner, repo, branch: 'main' })
  return data.commit.sha
}

export async function createBranch(repoSlug: string, branchName: string): Promise<void> {
  const octokit = getOctokit()
  const { owner, repo } = parseRepo(repoSlug)
  const sha = await getMainSha(octokit, owner, repo)
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha,
  })
}

export interface ContentPayload {
  headline: string
  subheading: string
  about: string
  services: string[]
}

export async function commitContent(
  repoSlug: string,
  branchName: string,
  content: ContentPayload,
): Promise<void> {
  const octokit = getOctokit()
  const { owner, repo } = parseRepo(repoSlug)

  // Try to get existing file SHA (needed for update); if missing, create fresh
  let existingSha: string | undefined
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: 'content.json',
      ref: branchName,
    })
    if ('sha' in data) existingSha = data.sha
  } catch {
    // File doesn't exist yet — that's fine, we'll create it
  }

  const fileContent = Buffer.from(JSON.stringify(content, null, 2)).toString('base64')

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: 'content.json',
    message: 'chore: update website content via Studio dashboard',
    content: fileContent,
    ...(existingSha ? { sha: existingSha } : {}),
    branch: branchName,
  })
}

export async function createPullRequest(
  repoSlug: string,
  branchName: string,
  requestMessage: string,
): Promise<{ number: number; url: string }> {
  const octokit = getOctokit()
  const { owner, repo } = parseRepo(repoSlug)

  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: `Content update — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    body: `Requested by client via Studio dashboard.\n\n> ${requestMessage}`,
    head: branchName,
    base: 'main',
  })

  return { number: pr.number, url: pr.html_url }
}

export async function mergePullRequest(
  repoSlug: string,
  prNumber: number,
): Promise<void> {
  const octokit = getOctokit()
  const { owner, repo } = parseRepo(repoSlug)

  await octokit.pulls.merge({
    owner,
    repo,
    pull_number: prNumber,
    merge_method: 'squash',
  })
}

export async function createRepository(
  repoName: string,
  description: string,
): Promise<{ fullName: string; htmlUrl: string; defaultBranch: string }> {
  const octokit = getOctokit()

  const { data } = await octokit.repos.createForAuthenticatedUser({
    name: repoName,
    description,
    private: true,
    auto_init: true,
  })

  return {
    fullName: data.full_name,
    htmlUrl: data.html_url,
    defaultBranch: data.default_branch,
  }
}

export async function pushStaticSite(repo: string, htmlContent: string): Promise<void> {
  const octokit = getOctokit()
  const { owner, repo: repoName } = parseRepo(repo)

  const vercelConfig = JSON.stringify({ outputDirectory: '.', cleanUrls: true }, null, 2)

  const htmlBase64 = Buffer.from(htmlContent).toString('base64')
  const vercelBase64 = Buffer.from(vercelConfig).toString('base64')

  // Fetch existing SHAs — required by GitHub when updating files that already exist
  async function getFileSha(path: string): Promise<string | undefined> {
    try {
      const { data } = await octokit.repos.getContent({ owner, repo: repoName, path, ref: 'main' })
      return 'sha' in data ? data.sha : undefined
    } catch {
      return undefined
    }
  }

  const [htmlSha, vercelSha] = await Promise.all([getFileSha('index.html'), getFileSha('vercel.json')])

  // Commit index.html
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo: repoName,
    path: 'index.html',
    message: 'chore: regenerate website via Studio',
    content: htmlBase64,
    branch: 'main',
    ...(htmlSha ? { sha: htmlSha } : {}),
  })

  // Commit vercel.json
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo: repoName,
    path: 'vercel.json',
    message: 'chore: add Vercel config',
    content: vercelBase64,
    branch: 'main',
    ...(vercelSha ? { sha: vercelSha } : {}),
  })
}
