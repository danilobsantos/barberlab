exports.consumeRateLimit = async () => ({ allowed: true })
exports.rateLimitError = () => ({ ok: false, error: "rate limited" })
