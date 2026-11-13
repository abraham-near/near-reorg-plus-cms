import ApiTokens from '@/cms/components/users/ApiTokens'
import { ConnectedApps, CopyField } from '@/cms/components/users/ConnectedApps'
import type { ApiTokenRow } from '@/cms/lib/people/api-tokens'
import type { ConnectedApp } from '@/cms/lib/people/oauth-grants'

type Props = {
  tokens: ApiTokenRow[]
  enabled: boolean
  cmsOrigin: string
  /** The Claude connector (Desktop, Cowork, claude.ai): on when CMS_MCP_ENABLED. */
  connector: { enabled: boolean; url: string; connections: ConnectedApp[]; googleEmail: string | null; googlePublicLinks: boolean }
}

const code = 'rounded bg-muted px-1.5 py-0.5 font-mono text-xs'

/** Settings › Claude: the connector for Claude Desktop, Cowork and claude.ai; personal tokens for Claude Code. */
export default function ConnectClaude({ tokens, enabled, cmsOrigin, connector }: Props) {
  return (
    <>
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Connect Claude to the CMS</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          With the NEAR CMS connector, Claude writes and prepares blog posts for you: drafts from text you paste, Google Docs with their images, categories and tags, and scheduling. Claude asks you before publishing anything.
        </p>
      </header>

      {connector.enabled && (
        <section aria-labelledby="connector-heading" className="space-y-5 rounded-xl border bg-card p-6">
          <div className="space-y-1">
            <h2 id="connector-heading" className="text-lg font-semibold">Claude Desktop, Cowork and claude.ai</h2>
            <p className="text-sm text-muted-foreground">Add the NEAR CMS once as a connector. You sign in with your CMS account; nothing to install.</p>
          </div>
          <CopyField value={connector.url} label="Connector URL" />
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div className="space-y-2 rounded-lg border p-4">
              <h3 className="font-medium">Your own Claude plan (Pro, Max)</h3>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>In Claude, open <strong>Settings › Connectors</strong> and click <strong>Add custom connector</strong>.</li>
                <li>Name it <strong>NEAR CMS</strong> and paste the URL above.</li>
                <li>Click <strong>Connect</strong>, sign in to the CMS and click <strong>Allow</strong>.</li>
              </ol>
            </div>
            <div className="space-y-2 rounded-lg border p-4">
              <h3 className="font-medium">Your organization&apos;s plan (Team, Enterprise)</h3>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>An Owner adds it once: <strong>Organization settings › Connectors</strong>, with the URL above.</li>
                <li>Then each person opens <strong>Settings › Connectors</strong>, finds NEAR CMS and clicks <strong>Connect</strong>.</li>
                <li>Owners: set the publish tools to <strong>Needs approval</strong>.</li>
              </ol>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <h3 className="font-medium">Images: send a Google Doc</h3>
            <p className="text-muted-foreground">Images pasted in a chat never reach the CMS. Put the text and images in a Google Doc and give Claude its link.{connector.googleEmail ? ' Share the Doc with this address as Viewer:' : connector.googlePublicLinks ? ' Set the Doc to “Anyone with the link” (Viewer).' : ''}</p>
            {connector.googleEmail && <CopyField value={connector.googleEmail} label="Google account to share Docs with" />}
            {connector.googleEmail && connector.googlePublicLinks && <p className="text-xs text-muted-foreground">Docs set to “Anyone with the link” work too, but then anyone with the link can read your draft.</p>}
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Your connections</h3>
            <ConnectedApps connections={connector.connections} />
          </div>
        </section>
      )}

      <details className="group rounded-xl border bg-card p-6" open={!connector.enabled}>
        <summary className="cursor-pointer text-lg font-semibold">Claude Code (developers)</summary>
        <div className="mt-4 space-y-6">
      {connector.enabled && <p className="text-sm text-muted-foreground">Claude Code can use the connector too: <code className={code}>claude mcp add --transport http near-cms {connector.url}</code>. Or, from this repository, a personal token:</p>}
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
        </div>
      </details>

      <section aria-labelledby="try-heading" className="space-y-3 rounded-xl border bg-card p-6">
        <h2 id="try-heading" className="text-lg font-semibold">Try it</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Ask Claude: <em>“Get started with the NEAR CMS”</em>. In Claude Code you can also type <code className={code}>/mcp__near-cms__onboarding</code>.</li>
          <li>Other prompts: <strong>draft_from_google_doc</strong> (a Google Doc to a draft, with its images) and <strong>ready_to_publish</strong> (check a draft, then publish or schedule it once you say yes).</li>
          <li>Or just ask, for example <em>“Write a draft about … in the Ecosystem category”</em>.</li>
        </ul>
      </section>

      <section aria-labelledby="limits-heading" className="space-y-3 rounded-xl border bg-card p-6">
        <h2 id="limits-heading" className="text-lg font-semibold">What Claude can and can’t do</h2>
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="mb-1.5 font-medium">Claude can</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Create and edit drafts</li>
              <li>Turn a Google Doc into a draft with its images</li>
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
        <p className="text-xs text-muted-foreground">Every save keeps a revision, so you can undo any change Claude makes from the editor’s Revision history. Everything Claude does is recorded (Dashboard › Recent activity, for admins), and you get an email whenever Claude publishes or schedules a post. Claude can publish at most 10 posts an hour.</p>
      </section>

    </>
  )
}
