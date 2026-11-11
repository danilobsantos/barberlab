const Module = require("node:module")
const path = require("node:path")

const resolveFilename = Module._resolveFilename
const stubs = {
  "server-only": path.join(__dirname, "server-only.cjs"),
  "@/app/_lib/tenant/require-admin-context": path.join(
    __dirname,
    "require-admin-context.cjs",
  ),
  "@/app/_lib/rate-limit": path.join(__dirname, "rate-limit.cjs"),
  "next/cache": path.join(__dirname, "next-cache.cjs"),
}

Module._resolveFilename = function (request, parent, isMain, options) {
  const stub =
    stubs[request] ??
    (request.includes("/app/_lib/tenant/require-admin-context")
      ? stubs["@/app/_lib/tenant/require-admin-context"]
      : undefined) ??
    (request.includes("/app/_lib/rate-limit")
      ? stubs["@/app/_lib/rate-limit"]
      : undefined)
  return stub ?? resolveFilename.call(this, request, parent, isMain, options)
}
