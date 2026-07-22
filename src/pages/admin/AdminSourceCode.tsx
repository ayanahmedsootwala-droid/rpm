import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCode2, FolderGit2, Github, Terminal } from 'lucide-react';

const projectSections = [
  { label: 'Frontend', path: 'src/', detail: 'React pages, layouts, hooks, and shared UI components' },
  { label: 'Database', path: 'supabase/migrations/', detail: 'Schema changes, policies, RPC functions, and seed data' },
  { label: 'Edge Functions', path: 'supabase/functions/', detail: 'AI helpers and media-processing serverless functions' },
  { label: 'Static Assets', path: 'public/', detail: 'Logos, icons, and public images used by the website' },
];

export default function AdminSourceCode() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold">
              <FileCode2 className="h-5 w-5" />
              Source Code
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Project structure, deployment notes, and repository shortcuts.
            </p>
          </div>
          <a href="https://github.com/ayanahmedsootwala-droid/rpm" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Github className="mr-2 h-4 w-4" />
              Open Repository
            </Button>
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {projectSections.map(section => (
            <Card key={section.path}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{section.label}</CardTitle>
                  <Badge variant="outline" className="font-mono text-xs">{section.path}</Badge>
                </div>
                <CardDescription>{section.detail}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Terminal className="h-4 w-4" />
              Local Commands
            </CardTitle>
            <CardDescription>Use these commands from the project root while developing or deploying.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {[
              ['Install', 'pnpm install'],
              ['Run locally', 'pnpm dev'],
              ['Build', 'pnpm build'],
            ].map(([label, command]) => (
              <div key={label} className="rounded-md border border-border p-3">
                <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">{label}</p>
                <code className="break-all rounded bg-muted px-2 py-1 font-mono text-xs">{command}</code>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderGit2 className="h-4 w-4" />
              Supabase Setup
            </CardTitle>
            <CardDescription>
              Apply the SQL files in numerical order from the migrations folder before using production data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The frontend reads Supabase connection values from local environment variables and keeps them out of source control.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
