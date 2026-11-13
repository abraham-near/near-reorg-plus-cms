import { ConnectedApps, CopyField } from '@/cms/components/users/ConnectedApps'
import type { ConnectedApp } from '@/cms/lib/people/oauth-grants'

type Props = {
  /** The Claude connector: on when CMS_MCP_ENABLED. */
  enabled: boolean
  /** The address people paste in Claude (<CMS_ORIGIN>/api/mcp). */
  url: string
  connections: ConnectedApp[]
}

const card = 'space-y-4 rounded-xl border bg-card p-6'

/** Settings › Claude, for people who are not technical: one way to connect Claude Desktop, and how to use it. */
export default function ConnectClaude({ enabled, url, connections }: Props) {
  if (!enabled) {
    return (
      <section className={card}>
        <h2 className="text-lg font-semibold">Connect Claude</h2>
        <p className="text-sm text-muted-foreground">Connecting Claude to the CMS is not turned on yet. Ask an admin.</p>
      </section>
    )
  }
  const active = connections.filter((c) => c.status === 'active')

  return (
    <>
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Connect Claude</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Write and schedule blog posts by talking to Claude. Claude creates drafts in the CMS for you and always asks before publishing anything.
        </p>
      </header>

      <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${active.length ? 'border-primary/30 bg-primary/5' : 'bg-muted/40'}`}>
        {active.length
          ? <><strong>Claude is connected.</strong> You can start asking it to write posts.</>
          : <><strong>Claude is not connected yet.</strong> Follow the steps below; it takes about a minute.</>}
      </p>

      <section aria-labelledby="connect-heading" className={card}>
        <h2 id="connect-heading" className="text-lg font-semibold">How to connect Claude Desktop</h2>
        <ol className="list-decimal space-y-4 pl-5 text-sm marker:font-semibold marker:text-primary">
          <li className="space-y-2">
            <p><strong>Copy this address.</strong></p>
            <CopyField value={url} label="Connector address" />
          </li>
          <li className="space-y-1">
            <p><strong>Open Claude Desktop</strong> and go to <strong>Settings › Connectors</strong>.</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>If you see <strong>NEAR CMS</strong> in the list (your company added it), click <strong>Connect</strong>.</li>
              <li>If not, click <strong>Add custom connector</strong>, name it <strong>NEAR CMS</strong>, paste the address, click <strong>Add</strong>, then <strong>Connect</strong>.</li>
            </ul>
          </li>
          <li className="space-y-1">
            <p><strong>Sign in to the CMS</strong> in the page that opens and click <strong>Allow</strong>.</p>
            <p className="text-muted-foreground">If you only want Claude to write drafts, untick “Publish, schedule and unpublish” before clicking Allow.</p>
          </li>
        </ol>
        <p className="text-xs text-muted-foreground">It also works in Cowork and on claude.ai with the same Claude account.</p>
      </section>

      <section aria-labelledby="use-heading" className={card}>
        <h2 id="use-heading" className="text-lg font-semibold">How to use it</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Paste your text: <em>“Create a draft in the NEAR CMS with this text: …”</em> Claude gives you a link to the draft.</li>
          <li>Ask for changes: <em>“Make the title shorter and add the Ecosystem category.”</em></li>
          <li>Publish: <em>“Schedule it for Monday at 10:00 Mexico City time.”</em> Claude repeats the details and waits for your yes.</li>
        </ul>
        <div className="space-y-2 rounded-lg bg-muted/40 p-4 text-sm">
          <p className="font-medium">Images are added by you, in the CMS</p>
          <p className="text-muted-foreground">
            Claude can’t move pictures from the chat into the CMS: images you paste or attach in Claude stay in Claude. So Claude writes the text, and you add the pictures yourself:
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>Open the draft with the link Claude gives you (or from Posts in the CMS).</li>
            <li>Click <strong>Add cover</strong> for the main image, or type <strong>/</strong> in the text and choose <strong>Image</strong> to add one inside the post.</li>
            <li>Upload the picture from your computer, or pick one from Media, and write a short description of it.</li>
          </ol>
          <p className="text-muted-foreground">Then you can ask Claude to publish or schedule it, or do it from the editor.</p>
        </div>
      </section>

      <section aria-labelledby="limits-heading" className={card}>
        <h2 id="limits-heading" className="text-lg font-semibold">What Claude can and can’t do</h2>
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="mb-1.5 font-medium">Claude can</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Create and edit drafts</li>
              <li>Publish now or schedule, after you say yes</li>
              <li>Edit a published post, after showing you the changes</li>
              <li>Add categories, tags and image descriptions</li>
            </ul>
          </div>
          <div>
            <p className="mb-1.5 font-medium">Only you can</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Add images to a post</li>
              <li>Delete anything</li>
              <li>Change the address (URL) of a published post</li>
              <li>Go back to an earlier version of a post</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Every change Claude makes is saved as a version you can restore from the editor, and you get an email whenever Claude publishes or schedules a post.</p>
      </section>

      <section aria-labelledby="connections-heading" className={card}>
        <h2 id="connections-heading" className="text-lg font-semibold">Your connections</h2>
        <p className="text-sm text-muted-foreground">To stop Claude from using your CMS account, click Disconnect.</p>
        <ConnectedApps connections={connections} />
      </section>
    </>
  )
}
