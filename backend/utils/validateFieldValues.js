// Validates a submitted `fieldValues` object against a service's active
// field definitions. Used at registration time (and reusable for admin
// edits) — the dynamic form is admin-configured, so the shape of what's
// "valid" can't be hardcoded per service and must be checked at runtime
// against the field_type/allow_multiple/options/is_required metadata.
function isProvided(rawValue) {
  if (rawValue === undefined || rawValue === null) return false;
  if (Array.isArray(rawValue)) return rawValue.length > 0;
  if (typeof rawValue === "string") return rawValue.trim().length > 0;
  return true;
}

function validateFieldValues(fields, fieldValues) {
  const errors = [];
  const cleaned = {};
  const source = fieldValues || {};

  for (const field of fields) {
    const rawValue = source[field.field_key];
    const provided = isProvided(rawValue);

    if (field.is_required && !provided) {
      errors.push(`${field.label} is required`);
      continue;
    }

    if (!provided) continue;

    const optionValues = Array.isArray(field.options)
      ? field.options.map((option) => option.value)
      : null;

    if (field.allow_multiple) {
      if (!Array.isArray(rawValue)) {
        errors.push(`${field.label} must be a list of values`);
        continue;
      }

      if (optionValues) {
        const invalid = rawValue.filter((v) => !optionValues.includes(v));
        if (invalid.length > 0) {
          errors.push(`${field.label} contains an invalid option`);
          continue;
        }
      }

      cleaned[field.field_key] = rawValue.map((v) =>
        typeof v === "string" ? v.trim() : v
      );
    } else {
      if (Array.isArray(rawValue)) {
        errors.push(`${field.label} must be a single value`);
        continue;
      }

      if (optionValues && !optionValues.includes(rawValue)) {
        errors.push(`${field.label} has an invalid value`);
        continue;
      }

      cleaned[field.field_key] =
        typeof rawValue === "string" ? rawValue.trim() : rawValue;
    }
  }

  return { errors, cleaned };
}

module.exports = { validateFieldValues };
