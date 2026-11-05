# FitCheck shopping service

This small Node 22 service requests Google Shopping listings through SerpApi.
It does not receive photos, full quiz profiles, wardrobe records or account IDs.
Only the occasion, category, one selected style and optional budget are sent by
the app. SerpApi receives a search query and US/English market parameters.

## Configure locally

1. Create a SerpApi account at https://serpapi.com/ and review its current plan.
2. Copy `server/.env.example` to `server/.env.local`.
3. Put the private key in `SERPAPI_KEY`. Never use an `EXPO_PUBLIC_` key variable.
4. From the project root run `npm run shopping:server` (Node 22+).
5. Copy root `.env.example` to `.env.local`; set
   `EXPO_PUBLIC_SHOPPING_API_URL` to the server base URL, then restart Expo.
   On a phone use the computer's reachable LAN address instead of localhost.
   Production builds should use an HTTPS server URL; local HTTP transport may
   need a development build and device-specific network configuration.
6. For web, set `SHOPPING_WEB_ORIGIN` to the exact frontend origin. Native apps
   do not send browser Origin headers. CORS is not authentication.

Example request:

`GET /shopping?occasion=Date%20Night&category=top&style=minimalist&maxPrice=80`

Responses contain normalized USD products, the search query, provider label and
retrieval time. Budget is a per-item item-price ceiling, excluding shipping/tax.
Unpriced, non-USD and unsafe-link results are omitted. Search relevance comes
from the provider, not an exact compatibility guarantee or stock/size check.
Product links may open Google Shopping product pages rather than a direct seller.

## Hosting

Deploy `server/shopping.cjs` and `src/features/shopping/shoppingModel.js` together,
using Node 22+, set the private environment variables in the host dashboard, and
start `node server/shopping.cjs`. The host supplies PORT and HTTPS termination. Use `/health` for its health check.
The app needs only the public HTTPS base URL. Do not deploy before choosing a
host, configuring a key and checking the provider allowance.

The initial service has a 10-minute bounded in-memory cache, in-flight request
coalescing, a 12-second provider timeout and a 30-provider-call/hour process-wide
limit. This is a bounded prototype, not per-user authentication or distributed
quota enforcement. For public launch add authenticated access and a shared quota
store; multiple instances/restarts otherwise reset the allowance. No upstream
errors or key-bearing URLs are returned or logged. Do not enable verbose request
logging that captures provider URLs.

## Verification

`npm run test:shopping` starts temporary local HTTP servers with a simulated
provider. Tests make no paid API calls. Live results, hosted HTTPS, retailer links
and physical iOS/Android network behavior require separate verification.
