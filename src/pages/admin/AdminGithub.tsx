import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Github, GitBranch, GitCommit, GitPullRequest, Star, Eye, AlertCircle, CheckCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface Commit { sha: string; message: string; author: string; date: string; url: string; }
interface PullRequest { id: number; title: string; state: string; author: string; date: string; url: string; branch: string; }
interface RepoInfo { name: string; full_name: string; description: string; stars: number; watchers: number; forks: number; default_branch: string; language: string; updated_at: string; url: string; }

export default function AdminGithub() {
  const { t } = useLanguage();
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [pulls, setPulls] = useState<PullRequest[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [error, setError] = useState('');

  async function connect() {
    if (!token.trim() || !repo.trim()) { toast.error('Enter a GitHub token and repository (owner/repo)'); return; }
    setLoading(true); setError('');
    try {
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
      const [rRes, cRes, pRes, bRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${repo}`, { headers }),
        fetch(`https://api.github.com/repos/${repo}/commits?per_page=10`, { headers }),
        fetch(`https://api.github.com/repos/${repo}/pulls?state=all&per_page=10`, { headers }),
        fetch(`https://api.github.com/repos/${repo}/branches?per_page=20`, { headers }),
      ]);
      if (!rRes.ok) { const e = await rRes.json(); throw new Error(e.message || 'Repository not found'); }
      const [rData, cData, pData, bData] = await Promise.all([rRes.json(), cRes.json(), pRes.json(), bRes.json()]);

      setRepoInfo({
        name: rData.name, full_name: rData.full_name, description: rData.description || '',
        stars: rData.stargazers_count, watchers: rData.watchers_count, forks: rData.forks_count,
        default_branch: rData.default_branch, language: rData.language, updated_at: rData.updated_at, url: rData.html_url,
      });
      setCommits((Array.isArray(cData) ? cData : []).map((c: Record<string, unknown>) => ({
        sha: (c.sha as string).slice(0, 7),
        message: ((c.commit as Record<string, unknown>).message as string).split('\n')[0],
        author: (((c.commit as Record<string, unknown>).author as Record<string, unknown>).name as string) || 'Unknown',
        date: (((c.commit as Record<string, unknown>).author as Record<string, unknown>).date as string),
        url: ((c.html_url as string) || ''),
      })));
      setPulls((Array.isArray(pData) ? pData : []).map((p: Record<string, unknown>) => ({
        id: p.number as number, title: p.title as string, state: p.state as string,
        author: ((p.user as Record<string, unknown>).login as string) || 'Unknown',
        date: p.updated_at as string,
        url: p.html_url as string,
        branch: ((p.head as Record<string, unknown>).ref as string),
      })));
      setBranches((Array.isArray(bData) ? bData : []).map((b: Record<string, unknown>) => b.name as string));
      setConnected(true);
      toast.success(`Connected to ${rData.full_name}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Connection failed';
      setError(msg); toast.error(msg);
    }
    setLoading(false);
  }

  async function refresh() {
    setConnected(false); await connect();
  }

  function disconnect() {
    setConnected(false); setRepoInfo(null); setCommits([]); setPulls([]); setBranches([]); setToken(''); setRepo('');
    toast.info('Disconnected from GitHub');
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2"><Github className="w-5 h-5" />GitHub Integration</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Monitor your repository activity, commits and pull requests</p>
          </div>
          {connected && (
            <div className="flex items-center gap-2">
              <Badge className="bg-success/10 text-success"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>
              <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="w-3.5 h-3.5 mr-1" />Refresh</Button>
              <Button variant="outline" size="sm" onClick={disconnect}>Disconnect</Button>
            </div>
          )}
        </div>

        {!connected ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Connect to GitHub</CardTitle>
              <CardDescription>Enter your personal access token and repository to start monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Personal Access Token</Label>
                <Input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" className="font-mono" />
                <p className="text-xs text-muted-foreground">
                  Create a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">github.com/settings/tokens</a> with <code className="bg-muted px-1 rounded text-xs">repo</code> scope
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Repository</Label>
                <Input value={repo} onChange={e => setRepo(e.target.value)} placeholder="owner/repository-name" />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}
              <Button onClick={connect} disabled={loading}>
                {loading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Connecting…</> : <><Github className="w-4 h-4 mr-2" />Connect</>}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Repo stats */}
            {repoInfo && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Star, label: 'Stars', value: repoInfo.stars },
                  { icon: Eye, label: 'Watchers', value: repoInfo.watchers },
                  { icon: GitBranch, label: 'Branches', value: branches.length },
                  { icon: GitPullRequest, label: 'Pull Requests', value: pulls.length },
                ].map(({ icon: Icon, label, value }) => (
                  <Card key={label}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold mt-0.5">{value}</p></div>
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {repoInfo && (
              <Card>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{repoInfo.full_name}</p>
                      {repoInfo.language && <Badge variant="outline" className="text-xs">{repoInfo.language}</Badge>}
                      <Badge variant="secondary" className="text-xs flex items-center gap-1"><GitBranch className="w-3 h-3" />{repoInfo.default_branch}</Badge>
                    </div>
                    {repoInfo.description && <p className="text-sm text-muted-foreground mt-1">{repoInfo.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Last updated {new Date(repoInfo.updated_at).toLocaleDateString()}</p>
                  </div>
                  <a href={repoInfo.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><ExternalLink className="w-3.5 h-3.5 mr-1" />View on GitHub</Button>
                  </a>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="commits">
              <TabsList><TabsTrigger value="commits">Recent Commits</TabsTrigger><TabsTrigger value="pulls">Pull Requests</TabsTrigger><TabsTrigger value="branches">Branches</TabsTrigger></TabsList>

              <TabsContent value="commits">
                <Card>
                  <CardContent className="p-0">
                    {commits.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-10">No commits found</p>
                    ) : commits.map((c, i) => (
                      <div key={c.sha} className={`flex items-start gap-3 p-4 ${i < commits.length - 1 ? 'border-b border-border' : ''}`}>
                        <GitCommit className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug">{c.message}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                            <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{c.sha}</code>
                            <span>{c.author}</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{new Date(c.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="w-3.5 h-3.5" /></Button>
                        </a>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pulls">
                <Card>
                  <CardContent className="p-0">
                    {pulls.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-10">No pull requests found</p>
                    ) : pulls.map((p, i) => (
                      <div key={p.id} className={`flex items-start gap-3 p-4 ${i < pulls.length - 1 ? 'border-b border-border' : ''}`}>
                        <GitPullRequest className={`w-4 h-4 mt-0.5 shrink-0 ${p.state === 'open' ? 'text-success' : p.state === 'merged' ? 'text-gold' : 'text-muted-foreground'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{p.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                            <Badge variant="secondary" className={`text-xs ${p.state === 'open' ? 'bg-success/10 text-success' : p.state === 'merged' ? 'bg-gold/10 text-gold' : ''}`}>{p.state}</Badge>
                            <span>by {p.author}</span>
                            <span>·</span>
                            <code className="bg-muted px-1 py-0.5 rounded font-mono text-xs">{p.branch}</code>
                          </div>
                        </div>
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="w-3.5 h-3.5" /></Button>
                        </a>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="branches">
                <Card>
                  <CardContent className="p-4">
                    {branches.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No branches found</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {branches.map(b => (
                          <Badge key={b} variant="outline" className="flex items-center gap-1.5 py-1 px-2.5">
                            <GitBranch className="w-3 h-3" />{b}
                            {repoInfo?.default_branch === b && <span className="text-gold text-xs ml-0.5">default</span>}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
