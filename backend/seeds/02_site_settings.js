// Seeds the two admin-editable About-page stat numbers required by
// CLAUDE.md. Values are text (not integers) because the displayed copy
// includes the "+" as part of the value itself. Upsert-by-key, safe to
// re-run — will not clobber a value an admin has since changed via the API
// unless this seed is re-run (which only happens intentionally at setup).
exports.seed = async function (knex) {
  await knex("site_settings")
    .insert([
      {
        key: "about_countries_count",
        value: "40+",
        label: "Countries served (About page)",
      },
      {
        key: "about_universities_count",
        value: "200+",
        label: "Partner universities (About page)",
      },
    ])
    .onConflict("key")
    .ignore();
};
