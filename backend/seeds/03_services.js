// Seeds the services named explicitly in CLAUDE.md's business context,
// plus Foreign Language Training (added later via the admin panel — kept
// here too so a fresh deploy doesn't lose it). Book a Consultation is the
// one "external_redirect" service (see ARCHITECTURE.md section 5); the
// rest are plain forms with no field definitions yet — those are added by
// an admin later, except Study Abroad's two CLAUDE.md-mandated fields,
// seeded separately (04_*).
const SERVICES = [
  {
    name: "Study Abroad",
    slug: "study-abroad",
    kind: "form",
    description:
      "End-to-end study abroad counselling — university shortlisting, application strategy, and everything in between, built around your budget and goals.",
    sort_order: 1,
  },
  {
    name: "Book a Consultation",
    slug: "book-a-consultation",
    kind: "external_redirect",
    redirect_url: "https://cal.com/code-knight-debjit/discovery-call",
    description:
      "A free, no-obligation first call with a counsellor to figure out what you actually need before committing to anything.",
    sort_order: 2,
  },
  {
    name: "Test Prep (IELTS/TOEFL/GRE)",
    slug: "test-prep",
    kind: "form",
    description:
      "Focused preparation for the English-proficiency and standardized tests your target universities require, on a timeline that fits your application deadlines.",
    sort_order: 3,
  },
  {
    name: "Foreign Language Training",
    slug: "foreign-language-training",
    kind: "form",
    description: "We teach you Languages that will be useful in your Foreign Study Journey",
    sort_order: 4,
  },
  {
    name: "Career Counselling",
    slug: "career-counselling",
    kind: "form",
    description:
      "Guidance on course and career direction when you're not yet sure what to study or where — before you spend on applications.",
    sort_order: 5,
  },
  {
    name: "Loan / Financial Assistance",
    slug: "loan-financial-assistance",
    kind: "form",
    description:
      "Guidance on education loans and funding options — which lenders and documents typically work for your destination and budget.",
    sort_order: 6,
  },
];

exports.seed = async function (knex) {
  await knex("services")
    .insert(
      SERVICES.map((service) => ({
        name: service.name,
        slug: service.slug,
        kind: service.kind,
        redirect_url: service.redirect_url || null,
        description: service.description || "",
        sort_order: service.sort_order,
      }))
    )
    .onConflict("slug")
    .ignore();
};
