// The stored shapes of a video post's video. Both sides check them against their own parser (the CMS's src/cms/lib/posts/video.ts in
// tests/cms/posts-video.test.ts, the site's src/lib/blog/video.ts in tests/site/video-post.test.ts): lint keeps a test from importing both,
// so this shared list is what keeps the two in step.
export const VIDEO_OUTPUTS = {
  files: ['/cms/a1b2c3d4e5f60718.mp4', '/cms/clip_2-final.webm'],
  embeds: [
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=90',
    'https://player.vimeo.com/video/76979871',
    'https://player.vimeo.com/video/76979871?h=abc123def0',
  ],
}
