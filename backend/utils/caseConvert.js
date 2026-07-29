// Shallow snake_case -> camelCase conversion for DB rows going out over the
// API. Deliberately shallow (only top-level keys): several columns are
// JSONB blobs whose keys are admin-defined opaque strings (service_fields
// options, applications.field_values) — recursively rewriting those would
// mangle round-tripping data the app itself doesn't own the shape of.
function snakeToCamelKey(key) {
  return key.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function rowToCamel(row) {
  if (row === null || row === undefined) return row;

  const result = {};
  for (const [key, value] of Object.entries(row)) {
    result[snakeToCamelKey(key)] = value;
  }
  return result;
}

function rowsToCamel(rows) {
  return rows.map(rowToCamel);
}

module.exports = { rowToCamel, rowsToCamel };
