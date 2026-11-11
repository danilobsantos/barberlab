exports.requireAdminContext = async (slug) =>
  globalThis.__serverActionAdmin?.slug === slug
    ? globalThis.__serverActionAdmin.context
    : null
