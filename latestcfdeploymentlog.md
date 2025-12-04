# Cloudflare Deployment Log

## Status: ❌ FAILED

## Error Summary

**Error Code:** 10042  
**Error Message:** `KV namespace 'YOUR_KV_NAMESPACE_ID' is not valid.`  
**Root Cause:** The `wrangler.toml` file contains a placeholder value `YOUR_KV_NAMESPACE_ID` for the KV namespace binding instead of a real KV namespace ID.

## Required Fix

1. **Create KV Namespace in Cloudflare Dashboard:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Workers & Pages** → **KV**
   - Click **Create a namespace**
   - Name it: `kapp-cache`
   - Click **Create**

2. **Copy the Namespace ID:**
   - Click on the newly created `kapp-cache` namespace
   - Copy the **Namespace ID** (looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

3. **Update `wrangler.toml`:**
   - Open `wrangler.toml` in the repository
   - Find line 70 with `id = "YOUR_KV_NAMESPACE_ID"`
   - Replace `YOUR_KV_NAMESPACE_ID` with your actual namespace ID

4. **Redeploy:**
   - Commit and push the changes, or
   - Retry the deployment from Cloudflare Dashboard

## Full Deployment Log

```
2025-12-04T05:14:40.027Z	Initializing build environment...
2025-12-04T05:14:41.181Z	Success: Finished initializing build environment
2025-12-04T05:14:41.451Z	Cloning repository...
2025-12-04T05:14:42.713Z	Detected the following tools from environment: pnpm@10.11.1, npm@10.9.2, nodejs@22.16.0
2025-12-04T05:14:42.714Z	Restoring from dependencies cache
2025-12-04T05:14:42.716Z	Restoring from build output cache
2025-12-04T05:14:46.244Z	Success: Build output restored from build cache.
2025-12-04T05:15:18.701Z	Success: Dependencies restored from build cache.
2025-12-04T05:15:18.840Z	Installing project dependencies: pnpm install --frozen-lockfile
2025-12-04T05:15:19.747Z	Lockfile is up to date, resolution step is skipped
2025-12-04T05:15:19.888Z	Progress: resolved 1, reused 0, downloaded 0, added 0
2025-12-04T05:15:20.074Z	Packages: +1799
2025-12-04T05:15:20.074Z	++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
2025-12-04T05:15:20.889Z	Progress: resolved 1799, reused 512, downloaded 0, added 0
2025-12-04T05:15:21.889Z	Progress: resolved 1799, reused 1477, downloaded 0, added 0
2025-12-04T05:15:22.890Z	Progress: resolved 1799, reused 1799, downloaded 0, added 281
2025-12-04T05:15:23.890Z	Progress: resolved 1799, reused 1799, downloaded 0, added 611
2025-12-04T05:15:24.891Z	Progress: resolved 1799, reused 1799, downloaded 0, added 1043
2025-12-04T05:15:25.891Z	Progress: resolved 1799, reused 1799, downloaded 0, added 1716
2025-12-04T05:15:25.935Z	Progress: resolved 1799, reused 1799, downloaded 0, added 1799, done
2025-12-04T05:15:34.492Z	
2025-12-04T05:15:34.493Z	dependencies:
2025-12-04T05:15:34.493Z	+ @genkit-ai/google-genai 1.24.0
2025-12-04T05:15:34.493Z	+ @genkit-ai/next 1.24.0
2025-12-04T05:15:34.493Z	+ @hookform/resolvers 4.1.3
2025-12-04T05:15:34.493Z	+ @radix-ui/react-accordion 1.2.12
2025-12-04T05:15:34.493Z	+ @radix-ui/react-alert-dialog 1.1.15
2025-12-04T05:15:34.493Z	+ @radix-ui/react-avatar 1.1.11
2025-12-04T05:15:34.493Z	+ @radix-ui/react-checkbox 1.3.3
2025-12-04T05:15:34.494Z	+ @radix-ui/react-collapsible 1.1.12
2025-12-04T05:15:34.494Z	+ @radix-ui/react-dialog 1.1.15
2025-12-04T05:15:34.494Z	+ @radix-ui/react-dropdown-menu 2.1.16
2025-12-04T05:15:34.494Z	+ @radix-ui/react-label 2.1.8
2025-12-04T05:15:34.494Z	+ @radix-ui/react-menubar 1.1.16
2025-12-04T05:15:34.494Z	+ @radix-ui/react-popover 1.1.15
2025-12-04T05:15:34.494Z	+ @radix-ui/react-progress 1.1.8
2025-12-04T05:15:34.494Z	+ @radix-ui/react-radio-group 1.3.8
2025-12-04T05:15:34.494Z	+ @radix-ui/react-scroll-area 1.2.10
2025-12-04T05:15:34.495Z	+ @radix-ui/react-select 2.2.6
2025-12-04T05:15:34.495Z	+ @radix-ui/react-separator 1.1.8
2025-12-04T05:15:34.495Z	+ @radix-ui/react-slider 1.3.6
2025-12-04T05:15:34.495Z	+ @radix-ui/react-slot 1.2.4
2025-12-04T05:15:34.495Z	+ @radix-ui/react-switch 1.2.6
2025-12-04T05:15:34.495Z	+ @radix-ui/react-tabs 1.1.13
2025-12-04T05:15:34.495Z	+ @radix-ui/react-toast 1.2.15
2025-12-04T05:15:34.495Z	+ @radix-ui/react-tooltip 1.2.8
2025-12-04T05:15:34.495Z	+ @stripe/react-stripe-js 5.4.1
2025-12-04T05:15:34.495Z	+ @stripe/stripe-js 8.5.3
2025-12-04T05:15:34.498Z	+ class-variance-authority 0.7.1
2025-12-04T05:15:34.498Z	+ clsx 2.1.1
2025-12-04T05:15:34.498Z	+ date-fns 3.6.0
2025-12-04T05:15:34.498Z	+ dotenv 16.6.1
2025-12-04T05:15:34.498Z	+ embla-carousel-react 8.6.0
2025-12-04T05:15:34.498Z	+ firebase 11.10.0
2025-12-04T05:15:34.498Z	+ framer-motion 11.18.2
2025-12-04T05:15:34.499Z	+ genkit 1.24.0
2025-12-04T05:15:34.499Z	+ lucide-react 0.475.0
2025-12-04T05:15:34.499Z	+ next 15.3.6
2025-12-04T05:15:34.499Z	+ patch-package 8.0.1
2025-12-04T05:15:34.499Z	+ react 18.3.1
2025-12-04T05:15:34.499Z	+ react-confetti 6.4.0
2025-12-04T05:15:34.499Z	+ react-day-picker 8.10.1
2025-12-04T05:15:34.499Z	+ react-dom 18.3.1
2025-12-04T05:15:34.499Z	+ react-hook-form 7.67.0
2025-12-04T05:15:34.499Z	+ react-use 17.6.0
2025-12-04T05:15:34.499Z	+ recharts 2.15.4
2025-12-04T05:15:34.499Z	+ stripe 20.0.0
2025-12-04T05:15:34.499Z	+ tailwind-merge 3.4.0
2025-12-04T05:15:34.499Z	+ tailwindcss-animate 1.0.7
2025-12-04T05:15:34.499Z	+ uuid 13.0.0
2025-12-04T05:15:34.499Z	+ zod 3.25.76
2025-12-04T05:15:34.499Z	
2025-12-04T05:15:34.499Z	devDependencies:
2025-12-04T05:15:34.499Z	+ @eslint/eslintrc 3.3.3
2025-12-04T05:15:34.499Z	+ @firebase/rules-unit-testing 4.0.1
2025-12-04T05:15:34.499Z	+ @opennextjs/cloudflare 1.14.2
2025-12-04T05:15:34.499Z	+ @playwright/test 1.57.0
2025-12-04T05:15:34.499Z	+ @types/jest 30.0.0
2025-12-04T05:15:34.500Z	+ @types/node 20.19.25
2025-12-04T05:15:34.500Z	+ @types/react 18.3.27
2025-12-04T05:15:34.500Z	+ @types/react-dom 18.3.7
2025-12-04T05:15:34.500Z	+ @types/uuid 10.0.0
2025-12-04T05:15:34.500Z	+ eslint 9.39.1
2025-12-04T05:15:34.500Z	+ eslint-config-next 16.0.6
2025-12-04T05:15:34.500Z	+ firebase-admin 13.6.0
2025-12-04T05:15:34.500Z	+ firebase-tools 14.26.0
2025-12-04T05:15:34.500Z	+ genkit-cli 1.24.0
2025-12-04T05:15:34.500Z	+ jest 30.2.0
2025-12-04T05:15:34.500Z	+ postcss 8.5.6
2025-12-04T05:15:34.500Z	+ tailwindcss 3.4.18
2025-12-04T05:15:34.500Z	+ ts-jest 29.4.6
2025-12-04T05:15:34.500Z	+ tsx 4.21.0
2025-12-04T05:15:34.500Z	+ typescript 5.9.3
2025-12-04T05:15:34.500Z	+ wrangler 4.52.1
2025-12-04T05:15:34.500Z	
2025-12-04T05:15:34.522Z	Done in 15.3s
2025-12-04T05:15:34.698Z	Executing user build command: pnpm run pages:build
2025-12-04T05:15:35.041Z	
2025-12-04T05:15:35.041Z	> nextn@0.1.0 pages:build /opt/buildhome/repo
2025-12-04T05:15:35.041Z	> npm run typecheck && npx @opennextjs/cloudflare build
2025-12-04T05:15:35.041Z	
2025-12-04T05:15:35.207Z	
2025-12-04T05:15:35.207Z	> nextn@0.1.0 typecheck
2025-12-04T05:15:35.208Z	> tsc --noEmit
2025-12-04T05:15:35.208Z	
2025-12-04T05:15:53.698Z	
2025-12-04T05:15:53.698Z	┌─────────────────────────────┐
2025-12-04T05:15:53.699Z	│ OpenNext — Cloudflare build │
2025-12-04T05:15:53.699Z	└─────────────────────────────┘
2025-12-04T05:15:53.699Z	
2025-12-04T05:15:53.766Z	WARN The direct mode queue is not recommended for use in production.
2025-12-04T05:15:53.775Z	App directory: /opt/buildhome/repo
2025-12-04T05:15:53.775Z	Next.js version : 15.3.6
2025-12-04T05:15:53.776Z	@opennextjs/cloudflare version: 1.14.2
2025-12-04T05:15:53.776Z	@opennextjs/aws version: 3.9.3
2025-12-04T05:15:53.777Z	
2025-12-04T05:15:53.777Z	┌─────────────────────────────────┐
2025-12-04T05:15:53.777Z	│ OpenNext — Building Next.js app │
2025-12-04T05:15:53.777Z	└─────────────────────────────────┘
2025-12-04T05:15:53.777Z	
2025-12-04T05:15:53.899Z	
2025-12-04T05:15:53.900Z	> nextn@0.1.0 build
2025-12-04T05:15:53.900Z	> npm run typecheck && next build
2025-12-04T05:15:53.900Z	
2025-12-04T05:15:54.024Z	
2025-12-04T05:15:54.024Z	> nextn@0.1.0 typecheck
2025-12-04T05:15:54.024Z	> tsc --noEmit
2025-12-04T05:15:54.025Z	
2025-12-04T05:15:59.352Z	   ▲ Next.js 15.3.6
2025-12-04T05:15:59.352Z	
2025-12-04T05:15:59.390Z	   Creating an optimized production build ...
2025-12-04T05:16:07.208Z	 ⚠ Compiled with warnings in 7.0s
2025-12-04T05:16:07.209Z	
2025-12-04T05:16:07.209Z	./node_modules/.pnpm/express@4.21.2/node_modules/express/lib/view.js
2025-12-04T05:16:07.210Z	Critical dependency: the request of a dependency is an expression
2025-12-04T05:16:07.210Z	
2025-12-04T05:16:07.210Z	Import trace for requested module:
2025-12-04T05:16:07.210Z	./node_modules/.pnpm/express@4.21.2/node_modules/express/lib/view.js
2025-12-04T05:16:07.210Z	./node_modules/.pnpm/express@4.21.2/node_modules/express/lib/application.js
2025-12-04T05:16:07.210Z	./node_modules/.pnpm/express@4.21.2/node_modules/express/lib/express.js
2025-12-04T05:16:07.210Z	./node_modules/.pnpm/express@4.21.2/node_modules/express/index.js
2025-12-04T05:16:07.210Z	./node_modules/.pnpm/@genkit-ai+core@1.24.0_@google-cloud+firestore@7.11.6_encoding@0.1.13__encoding@0.1.13_fireba_rg5crfz333rb7as73gzjftnjy4/node_modules/@genkit-ai/core/lib/reflection.js
2025-12-04T05:16:07.210Z	./node_modules/.pnpm/@genkit-ai+core@1.24.0_@google-cloud+firestore@7.11.6_encoding@0.1.13__encoding@0.1.13_fireba_rg5crfz333rb7as73gzjftnjy4/node_modules/@genkit-ai/core/lib/index.js
2025-12-04T05:16:07.210Z	./node_modules/.pnpm/genkit@1.24.0_@google-cloud+firestore@7.11.6_encoding@0.1.13__encoding@0.1.13_firebase-admin@_agrycpwi6nl3b7j533zzeclmfa/node_modules/genkit/lib/common.js
2025-12-04T05:16:07.210Z	./node_modules/.pnpm/genkit@1.24.0_@google-cloud+firestore@7.11.6_encoding@0.1.13__encoding@0.1.13_firebase-admin@_agrycpwi6nl3b7j533zzeclmfa/node_modules/genkit/lib/index.mjs
2025-12-04T05:16:07.210Z	./src/ai/flows/generate-treatment-faq.ts
2025-12-04T05:16:07.210Z	
2025-12-04T05:16:07.210Z	./node_modules/.pnpm/require-in-the-middle@7.5.2/node_modules/require-in-the-middle/index.js
2025-12-04T05:16:07.211Z	Critical dependency: require function is used in a way in which dependencies cannot be statically extracted
2025-12-04T05:16:07.211Z	
2025-12-04T05:16:07.211Z	Import trace for requested module:
2025-12-04T05:16:07.211Z	./node_modules/.pnpm/require-in-the-middle@7.5.2/node_modules/require-in-the-middle/index.js
2025-12-04T05:16:07.211Z	./node_modules/.pnpm/@opentelemetry+instrumentation@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/platform/node/instrumentation.js
2025-12-04T05:16:07.211Z	./node_modules/.pnpm/@opentelemetry+instrumentation@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/platform/node/index.js
2025-12-04T05:16:07.211Z	./node_modules/.pnpm/@opentelemetry+instrumentation@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/platform/index.js
2025-12-04T05:16:07.211Z	./node_modules/.pnpm/@opentelemetry+instrumentation@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/index.js
2025-12-04T05:16:07.211Z	./node_modules/.pnpm/@opentelemetry+sdk-node@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-node/build/src/sdk.js
2025-12-04T05:16:07.211Z	./node_modules/.pnpm/@opentelemetry+sdk-node@0.52.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-node/build/src/index.js
2025-12-04T05:16:07.211Z	./node_modules/.pnpm/@genkit-ai+core@1.24.0_@google-cloud+firestore@7.11.6_encoding@0.1.13__encoding@0.1.13_fireba_rg5crfz333rb7as73gzjftnjy4/node_modules/@genkit-ai/core/lib/tracing/node-telemetry-provider.js
2025-12-04T05:16:07.211Z	./node_modules/.pnpm/@genkit-ai+core@1.24.0_@google-cloud+firestore@7.11.6_encoding@0.1.13__encoding@0.1.13_fireba_rg5crfz333rb7as73gzjftnjy4/node_modules/@genkit-ai/core/lib/node.js
2025-12-04T05:16:07.211Z	./node_modules/.pnpm/genkit@1.24.0_@google-cloud+firestore@7.11.6_encoding@0.1.13__encoding@0.1.13_firebase-admin@_agrycpwi6nl3b7j533zzeclmfa/node_modules/genkit/lib/common.js
2025-12-04T05:16:07.211Z	./node_modules/.pnpm/genkit@1.24.0_@google-cloud+firestore@7.11.6_encoding@0.1.13__encoding@0.1.13_firebase-admin@_agrycpwi6nl3b7j533zzeclmfa/node_modules/genkit/lib/index.mjs
2025-12-04T05:16:07.211Z	./src/ai/flows/generate-treatment-faq.ts
2025-12-04T05:16:07.211Z	
2025-12-04T05:16:11.996Z	 ✓ Compiled successfully in 9.0s
2025-12-04T05:16:12.000Z	   Skipping linting
2025-12-04T05:16:12.000Z	   Checking validity of types ...
2025-12-04T05:16:25.658Z	   Collecting page data ...
2025-12-04T05:16:29.612Z	   Generating static pages (0/45) ...
2025-12-04T05:16:30.388Z	   Generating static pages (11/45) 
2025-12-04T05:16:30.548Z	   Generating static pages (22/45) 
2025-12-04T05:16:30.760Z	   Generating static pages (33/45) 
2025-12-04T05:16:30.761Z	 ✓ Generating static pages (45/45)
2025-12-04T05:16:31.364Z	   Finalizing page optimization ...
2025-12-04T05:16:31.365Z	   Collecting build traces ...
2025-12-04T05:16:44.503Z	
2025-12-04T05:16:44.509Z	Route (app)                                 Size  First Load JS
2025-12-04T05:16:44.509Z	┌ ○ /                                    11.6 kB         354 kB
2025-12-04T05:16:44.509Z	├ ○ /_not-found                            986 B         103 kB
2025-12-04T05:16:44.509Z	├ ○ /about                               6.17 kB         125 kB
2025-12-04T05:16:44.509Z	├ ○ /admin                                 185 B         105 kB
2025-12-04T05:16:44.509Z	├ ○ /admin/appointments                  10.7 kB         325 kB
2025-12-04T05:16:44.509Z	├ ○ /admin/dashboard                     8.11 kB         299 kB
2025-12-04T05:16:44.509Z	├ ○ /admin/discount-codes                7.77 kB         326 kB
2025-12-04T05:16:44.509Z	├ ○ /admin/doctors                       9.36 kB         318 kB
2025-12-04T05:16:44.510Z	├ ○ /admin/generate-faq                  4.91 kB         138 kB
2025-12-04T05:16:44.510Z	├ ○ /admin/login                           509 B         102 kB
2025-12-04T05:16:44.510Z	├ ○ /admin/name-requests                 9.49 kB         300 kB
2025-12-04T05:16:44.510Z	├ ○ /admin/newsletter                       7 kB         289 kB
2025-12-04T05:16:44.510Z	├ ○ /admin/power-tools                   13.1 kB         325 kB
2025-12-04T05:16:44.510Z	├ ○ /admin/procedures                    5.42 kB         314 kB
2025-12-04T05:16:44.510Z	├ ○ /admin/reports                       8.43 kB         302 kB
2025-12-04T05:16:44.511Z	├ ○ /admin/settings                       7.7 kB         286 kB
2025-12-04T05:16:44.511Z	├ ○ /admin/users                         10.9 kB         319 kB
2025-12-04T05:16:44.512Z	├ ƒ /api/stripe/create-payment-intent      140 B         102 kB
2025-12-04T05:16:44.512Z	├ ƒ /appointment/[appointmentId]           13 kB         343 kB
2025-12-04T05:16:44.512Z	├ ○ /booking                             20.7 kB         413 kB
2025-12-04T05:16:44.512Z	├ ○ /doctor/achievements                   10 kB         333 kB
2025-12-04T05:16:44.515Z	├ ƒ /doctor/chat/[patientId]             2.77 kB         328 kB
2025-12-04T05:16:44.515Z	├ ○ /doctor/dashboard                    15.3 kB         385 kB
2025-12-04T05:16:44.515Z	├ ○ /doctor/login                          516 B         102 kB
2025-12-04T05:16:44.515Z	├ ○ /doctor/my-services                  8.43 kB         320 kB
2025-12-04T05:16:44.515Z	├ ○ /doctor/onboarding                   7.21 kB         289 kB
2025-12-04T05:16:44.515Z	├ ƒ /doctor/patient/[patientId]          17.2 kB         345 kB
2025-12-04T05:16:44.515Z	├ ○ /doctor/patients                     8.54 kB         292 kB
2025-12-04T05:16:44.515Z	├ ○ /doctor/profile                      9.48 kB         322 kB
2025-12-04T05:16:44.515Z	├ ○ /faq                                 7.37 kB         124 kB
2025-12-04T05:16:44.515Z	├ ○ /forgot-password                        6 kB         308 kB
2025-12-04T05:16:44.515Z	├ ○ /legal                                 185 B         105 kB
2025-12-04T05:16:44.515Z	├ ○ /login                               9.25 kB         314 kB
2025-12-04T05:16:44.515Z	├ ○ /new-patient                         8.64 kB         310 kB
2025-12-04T05:16:44.515Z	├ ○ /newsletter-unsubscribe              5.38 kB         285 kB
2025-12-04T05:16:44.515Z	├ ○ /patient/appointments                8.19 kB         297 kB
2025-12-04T05:16:44.515Z	├ ○ /patient/dashboard                   15.9 kB         360 kB
2025-12-04T05:16:44.515Z	├ ○ /patient/medical-info                6.76 kB         283 kB
2025-12-04T05:16:44.515Z	├ ○ /patient/messages                    3.45 kB         287 kB
2025-12-04T05:16:44.515Z	├ ƒ /patient/messages/[roomId]            3.1 kB         332 kB
2025-12-04T05:16:44.515Z	├ ○ /patient/profile                      6.4 kB         282 kB
2025-12-04T05:16:44.515Z	├ ○ /privacy                               185 B         105 kB
2025-12-04T05:16:44.516Z	├ ○ /services                              188 B         111 kB
2025-12-04T05:16:44.516Z	├ ƒ /services/[slug]                     10.3 kB         317 kB
2025-12-04T05:16:44.516Z	├ ○ /signup                              7.35 kB         309 kB
2025-12-04T05:16:44.516Z	├ ○ /staff/login                         9.07 kB         314 kB
2025-12-04T05:16:44.516Z	├ ○ /terms                                 185 B         105 kB
2025-12-04T05:16:44.516Z	└ ƒ /video-call/[roomId]                 7.04 kB         287 kB
2025-12-04T05:16:44.516Z	+ First Load JS shared by all             102 kB
2025-12-04T05:16:44.516Z	  ├ chunks/406-c2c4886ee41ce8f1.js       46.5 kB
2025-12-04T05:16:44.516Z	  ├ chunks/d2c8f27c-3cab2cbbf6c7f231.js  53.2 kB
2025-12-04T05:16:44.516Z	  └ other shared chunks (total)          1.93 kB
2025-12-04T05:16:44.516Z	
2025-12-04T05:16:44.516Z	
2025-12-04T05:16:44.516Z	○  (Static)   prerendered as static content
2025-12-04T05:16:44.516Z	ƒ  (Dynamic)  server-rendered on demand
2025-12-04T05:16:44.516Z	
2025-12-04T05:16:44.580Z	
2025-12-04T05:16:44.581Z	┌──────────────────────────────┐
2025-12-04T05:16:44.581Z	│ OpenNext — Generating bundle │
2025-12-04T05:16:44.581Z	└──────────────────────────────┘
2025-12-04T05:16:44.581Z	
2025-12-04T05:16:44.672Z	Bundling middleware function...
2025-12-04T05:16:44.711Z	Bundling static assets...
2025-12-04T05:16:44.748Z	Bundling cache assets...
2025-12-04T05:16:44.775Z	Building server function: default...
2025-12-04T05:16:47.896Z	Applying code patches: 2.773s
2025-12-04T05:16:48.146Z	# copyPackageTemplateFiles
2025-12-04T05:16:48.148Z	⚙️ Bundling the OpenNext server...
2025-12-04T05:16:48.148Z	
2025-12-04T05:16:49.788Z	▲ [WARNING] Comparison with -0 using the "===" operator will also match 0 [equals-negative-zero]
2025-12-04T05:16:49.790Z	
2025-12-04T05:16:49.791Z	    .open-next/server-functions/default/.next/server/app/admin/generate-faq/page.js:19:6495:
2025-12-04T05:16:49.791Z	      19 │ ....unsigned){if(l<0)l+=o;else if(-0===l)return 0}return l}}e.expo...
2025-12-04T05:16:49.791Z	         ╵                                   ~~
2025-12-04T05:16:49.791Z	
2025-12-04T05:16:49.791Z	  Floating-point equality is defined such that 0 and -0 are equal, so "x === -0" returns true for both 0 and -0. You need to use "Object.is(x, -0)" instead to test for -0.
2025-12-04T05:16:49.791Z	
2025-12-04T05:16:50.259Z	Worker saved in `.open-next/worker.js` 🚀
2025-12-04T05:16:50.259Z	
2025-12-04T05:16:50.259Z	OpenNext build complete.
2025-12-04T05:16:50.450Z	Success: Build command completed
2025-12-04T05:16:50.556Z	Executing user deploy command: npx wrangler deploy
2025-12-04T05:16:51.687Z	
2025-12-04T05:16:51.687Z	 ⛅️ wrangler 4.52.1
2025-12-04T05:16:51.687Z	───────────────────
2025-12-04T05:16:54.467Z	▲ [WARNING] Using direct eval with a bundler is not recommended and may cause problems [direct-eval]
2025-12-04T05:16:54.467Z	
2025-12-04T05:16:54.468Z	    .open-next/server-functions/default/handler.mjs:93:55426:
2025-12-04T05:16:54.468Z	      93 │ ...quire(moduleName){try{var mod=eval("quire".replace(/^/,"re"))(m...
2025-12-04T05:16:54.468Z	         ╵                                  ~~~~
2025-12-04T05:16:54.468Z	
2025-12-04T05:16:54.468Z	  You can read more about direct eval and bundling here: https://esbuild.github.io/link/direct-eval
2025-12-04T05:16:54.468Z	
2025-12-04T05:16:54.468Z	
2025-12-04T05:16:54.468Z	▲ [WARNING] Using direct eval with a bundler is not recommended and may cause problems [direct-eval]
2025-12-04T05:16:54.468Z	
2025-12-04T05:16:54.468Z	    .open-next/server-functions/default/handler.mjs:483:61037:
2025-12-04T05:16:54.468Z	      483 │ ...uire(moduleName){try{var mod=eval("quire".replace(/^/,"re"))(m...
2025-12-04T05:16:54.468Z	          ╵                                 ~~~~
2025-12-04T05:16:54.468Z	
2025-12-04T05:16:54.468Z	  You can read more about direct eval and bundling here: https://esbuild.github.io/link/direct-eval
2025-12-04T05:16:54.468Z	
2025-12-04T05:16:54.468Z	
2025-12-04T05:16:54.468Z	▲ [WARNING] Comparison with -0 using the "===" operator will also match 0 [equals-negative-zero]
2025-12-04T05:16:54.469Z	
2025-12-04T05:16:54.469Z	    .open-next/server-functions/default/handler.mjs:504:6662:
2025-12-04T05:16:54.469Z	      504 │ ...gned){if(l<0)l+=o;else if(l===-0)return 0}return l}}e.exports=...
2025-12-04T05:16:54.469Z	          ╵                                  ~~
2025-12-04T05:16:54.469Z	
2025-12-04T05:16:54.469Z	  Floating-point equality is defined such that 0 and -0 are equal, so "x === -0" returns true for both 0 and -0. You need to use "Object.is(x, -0)" instead to test for -0.
2025-12-04T05:16:54.469Z	
2025-12-04T05:16:54.469Z	
2025-12-04T05:16:54.495Z	🌀 Building list of assets...
2025-12-04T05:16:54.503Z	✨ Read 179 files from the assets directory /opt/buildhome/repo/.open-next/assets
2025-12-04T05:16:54.527Z	🌀 Starting asset upload...
2025-12-04T05:16:55.994Z	🌀 Found 1 new or modified static asset to upload. Proceeding with upload...
2025-12-04T05:16:55.995Z	+ /BUILD_ID
2025-12-04T05:16:56.946Z	Uploaded 1 of 1 asset
2025-12-04T05:16:56.946Z	✨ Success! Uploaded 1 file (115 already uploaded) (0.95 sec)
2025-12-04T05:16:56.946Z	
2025-12-04T05:16:57.205Z	Total Upload: 13939.27 KiB / gzip: 2779.61 KiB
2025-12-04T05:16:58.693Z	Your Worker has access to the following bindings:
2025-12-04T05:16:58.694Z	Binding                                                                                        Resource                  
2025-12-04T05:16:58.694Z	env.KV (YOUR_KV_NAMESPACE_ID)                                                                  KV Namespace              
2025-12-04T05:16:58.694Z	env.DB (kapp-db)                                                                               D1 Database               
2025-12-04T05:16:58.694Z	env.STORAGE (kapp-files)                                                                       R2 Bucket                 
2025-12-04T05:16:58.694Z	env.AI                                                                                         AI                        
2025-12-04T05:16:58.694Z	env.ASSETS                                                                                     Assets                    
2025-12-04T05:16:58.694Z	env.ENVIRONMENT ("production")                                                                 Environment Variable      
2025-12-04T05:16:58.694Z	env.LOG_LEVEL ("info")                                                                         Environment Variable      
2025-12-04T05:16:58.694Z	env.ENABLE_ANALYTICS ("true")                                                                  Environment Variable      
2025-12-04T05:16:58.694Z	env.ENABLE_RATE_LIMITING ("true")                                                              Environment Variable      
2025-12-04T05:16:58.694Z	env.RATE_LIMIT_REQUESTS ("60")                                                                 Environment Variable      
2025-12-04T05:16:58.694Z	env.RATE_LIMIT_WINDOW_SECONDS ("60")                                                           Environment Variable      
2025-12-04T05:16:58.694Z	env.NEXT_PUBLIC_FIREBASE_API_KEY ("AIzaSyBKWX4YCrQtFbYdB1XfdqOW3ymVI9fdMoI")                   Environment Variable      
2025-12-04T05:16:58.694Z	env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ("studio-8822072999-a4137.firebaseapp.com")               Environment Variable      
2025-12-04T05:16:58.694Z	env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ("studio-8822072999-a4137")                                Environment Variable      
2025-12-04T05:16:58.694Z	env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ("studio-8822072999-a4137.firebasestora...")           Environment Variable      
2025-12-04T05:16:58.694Z	env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ("644784261357")                                  Environment Variable      
2025-12-04T05:16:58.694Z	env.NEXT_PUBLIC_FIREBASE_APP_ID ("1:644784261357:web:80e04a3ce959e1ca53...")                   Environment Variable      
2025-12-04T05:16:58.694Z	env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ("G-PMBWB5N37T")                                       Environment Variable      
2025-12-04T05:16:58.694Z	env.CLOUDFLARE_ACCOUNT_ID ("6ef54b6c3c948c59efd63fa96eab0bc8")                                 Environment Variable      
2025-12-04T05:16:58.694Z	
2025-12-04T05:16:58.701Z	
2025-12-04T05:16:58.702Z	✘ [ERROR] A request to the Cloudflare API (/accounts/6ef54b6c3c948c59efd63fa96eab0bc8/workers/scripts/kapp/versions) failed.
2025-12-04T05:16:58.703Z	
2025-12-04T05:16:58.703Z	  KV namespace 'YOUR_KV_NAMESPACE_ID' is not valid.  [code: 10042]
2025-12-04T05:16:58.703Z	  
2025-12-04T05:16:58.703Z	  If you think this is a bug, please open an issue at: https://github.com/cloudflare/workers-sdk/issues/new/choose
2025-12-04T05:16:58.703Z	
2025-12-04T05:16:58.703Z	
2025-12-04T05:16:58.703Z	
2025-12-04T05:16:58.703Z	Cloudflare collects anonymous telemetry about your usage of Wrangler. Learn more at https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler/telemetry.md
2025-12-04T05:16:58.724Z	🪵  Logs were written to "/opt/buildhome/.config/.wrangler/logs/wrangler-2025-12-04_05-16-51_271.log"
2025-12-04T05:16:58.820Z	Failed: error occurred while running deploy command
```
