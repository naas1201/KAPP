/**
 * OpenNext Configuration for Cloudflare Workers
 * 
 * This file configures how Next.js is built and deployed to Cloudflare Workers
 * using the @opennextjs/cloudflare adapter.
 * 
 * Documentation: https://opennext.js.org/cloudflare
 */

import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  // Default configuration for the main worker
  default: {
    override: {
      // Use Cloudflare-compatible Node.js wrapper
      wrapper: "cloudflare-node",
      // Use edge converter for request/response handling
      converter: "edge",
      // Use fetch for external requests
      proxyExternalRequest: "fetch",
      // Use dummy cache implementations (no ISR caching)
      incrementalCache: "dummy",
      tagCache: "dummy",
      // Use direct queue implementation
      queue: "direct",
    },
  },
  
  // External packages that should not be bundled
  edgeExternals: ["node:crypto"],
  
  // Middleware configuration
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "direct",
    },
  },
};

export default config;
