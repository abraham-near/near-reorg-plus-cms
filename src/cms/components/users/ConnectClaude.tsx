import ApiTokens from '@/cms/components/users/ApiTokens'
import type { ApiTokenRow } from '@/cms/lib/people/api-tokens'

type Props = {
  tokens: ApiTokenRow[]
  enabled: boolean
  cmsOrigin: string
}

const code = 'rounded bg-muted px-1.5 py-0.5 font-mono text-xs'

/** Settings › Claude: create a token, connect Claude Code, try it. */
export default function ConnectClaude({ tokens, enabled, cmsOrigin }: Props) {
  return (
    <>
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Connect Claude to the CMS</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          With the NEAR CMS connector, Claude writes and prepares blog posts for you: drafts, Word documents with their images, categories and tags, and scheduling. You always review and publish.
        </p>
      </header>

      <ApiTokens tokens={tokens} enabled={enabled} />

      <section aria-labelledby="connect-heading" className="space-y-4 rounded-xl border bg-card p-6">
        <div className="space-y-1">
          <h2 id="connect-heading" className="text-lg font-semibold"><span className="text-muted-foreground">2.</span> Connect Claude</h2>
          <p className="text-sm text-muted-foreground">Claude gets its instructions from the CMS when it connects, so there is nothing else to install or configure.</p>
        </div>
        <div className="grid gap-4">
          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="font-medium">Claude Code</h3>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>In this repository, run <code className={code}>npm run mcp:cms:login</code>.</li>
              <li>Enter <code className={code}>{cmsOrigin}</code> as the CMS address and paste your token. It is stored in the macOS Keychain, or in a private file under <code className={code}>~/.config/near-cms</code> elsewhere.</li>
              <li>Start Claude Code in the repository and approve the <code className={code}>near-cms</code> server the first time.</li>
            </ol>
          </div>
        </div>
      </section>

      <section aria-labelledby="try-heading" className="space-y-3 rounded-xl border bg-card p-6">
        <h2 id="try-heading" className="text-lg font-semibold"><span className="text-muted-foreground">3.</span> Try it</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Ask Claude: <em>“Get started with the NEAR CMS”</em>. In Claude Code you can also type <code className={code}>/mcp__near-cms__onboarding</code>.</li>
          <li>Other prompts: <strong>draft_from_word</strong> (a .docx from your upload folder to a draft) and <strong>ready_to_publish</strong> (check a draft, then publish or schedule it once you say yes).</li>
          <li>Or just ask, for example <em>“Write a draft about … in the Ecosystem category”</em>.</li>
        </ul>
      </section>

      <section aria-labelledby="limits-heading" className="space-y-3 rounded-xl border bg-card p-6">
        <h2 id="limits-heading" className="text-lg font-semibold">What Claude can and can’t do</h2>
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="mb-1.5 font-medium">Claude can</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Create drafts and duplicate posts as drafts</li>
              <li>Turn a Word document into a draft with its images</li>
              <li>Publish now or at a set time, after you say yes</li>
              <li>Edit live and scheduled posts, after showing you the changes</li>
              <li>Take a post down (back to draft or archive)</li>
              <li>Upload images, set their alt text, and add categories and tags</li>
            </ul>
          </div>
          <div>
            <p className="mb-1.5 font-medium">Only you can</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Delete anything: posts, images, categories, tags</li>
              <li>Change the URL or visibility of a published post</li>
              <li>Restore an earlier version from Revision history</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Every save keeps a revision, so you can undo any change Claude makes from the editor’s Revision history. Everything done with a token is recorded in the audit log, and you get an email whenever a token publishes or schedules a post.</p>
      </section>

    </>
  )
}
