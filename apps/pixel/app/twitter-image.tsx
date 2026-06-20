// X/Twitter uses the same poster as Open Graph. Re-export so there's one source
// of truth — Next.js emits twitter:image from this route.
export { default, alt, size, contentType } from "./opengraph-image";
