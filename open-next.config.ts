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
      
      // Optional: Enable ISR (Incremental Static Regeneration) with KV
      // Uncomment if you want to use KV for caching
      // incrementalCache: "cloudflare-kv",
      // tagCache: "cloudflare-kv",
    },
  },
  
  // Middleware configuration
  middleware: {
    // Run middleware as external worker (recommended)
    external: true,
  },
  
  // Build output configuration
  // buildOutputPath: ".open-next", // Default output directory
  
  // Optional: Configure image optimization
  // dangerous: {
  //   disableIncrementalCache: true,
  //   disableTagCache: true,
  // },
};

export default config;
