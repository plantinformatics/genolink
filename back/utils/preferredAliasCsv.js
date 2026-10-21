function parsePreferredAlias(raw) {
  const supplied = Object.prototype.hasOwnProperty.call(raw, "preferredAlias");

  if (!supplied) {
    return { supplied: false, value: null };
  }

  const normalized = String(raw.preferredAlias ?? "")
    .trim()
    .replace(/\s+/g, " ");

  return {
    supplied: true,
    value: normalized || null,
  };
}

module.exports = { parsePreferredAlias };
