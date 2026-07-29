// Seeds the two fields CLAUDE.md mandates as a minimum for Study Abroad:
// destination country, and a ranked/ordered list of preferred universities.
// Country options mirror the country pages already built under
// frontend/countryPages/ (australia, canada, dubai, germany, singapore,
// uk, us) rather than inventing a new list. Any additional Study Abroad
// fields are an admin-panel configuration decision for later, not seeded
// here (see ARCHITECTURE.md section 1).
const COUNTRY_OPTIONS = [
  { label: "Australia", value: "australia" },
  { label: "Canada", value: "canada" },
  { label: "Dubai", value: "dubai" },
  { label: "Germany", value: "germany" },
  { label: "Singapore", value: "singapore" },
  { label: "United Kingdom", value: "uk" },
  { label: "United States", value: "us" },
];

exports.seed = async function (knex) {
  const studyAbroad = await knex("services")
    .where({ slug: "study-abroad" })
    .first();

  if (!studyAbroad) {
    // 03_services.js hasn't run / Study Abroad was removed — nothing to attach to.
    return;
  }

  await knex("service_fields")
    .insert([
      {
        service_id: studyAbroad.id,
        field_key: "destination_country",
        label: "Destination Country",
        field_type: "select",
        allow_multiple: false,
        is_ordered: false,
        options: JSON.stringify(COUNTRY_OPTIONS),
        is_required: true,
        sort_order: 1,
      },
      {
        service_id: studyAbroad.id,
        field_key: "preferred_universities",
        label: "Preferred Universities (in order of preference)",
        field_type: "text",
        allow_multiple: true,
        is_ordered: true,
        options: null,
        is_required: true,
        help_text: "Add your top choices, most preferred first.",
        sort_order: 2,
      },
    ])
    .onConflict(["service_id", "field_key"])
    .ignore();
};
