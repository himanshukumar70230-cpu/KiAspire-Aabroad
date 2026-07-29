// Seeds the Germany entry for "Study Abroad for Free" — the one country
// CLAUDE.md requires to launch with real content. Facts here (tuition
// structure, blocked-account amount, job-seeker visa length) are drawn
// from the same established figures already used in
// frontend/countryPages/germany.html, not invented for this seed.
const GERMANY_CONTENT_MARKDOWN = `Germany funds higher education as public infrastructure rather than a
market good. Most public universities charge **no tuition fee** for
bachelor's and master's programs — including for international students
— regardless of which country you're applying from.

## What "free" actually means

Public universities charge a **semester contribution** (Semesterbeitrag),
not tuition — typically a modest administrative fee that usually bundles
in a regional public transport pass and student services access. This is
a fraction of what tuition costs in the US, UK, Australia, or Canada, and
it applies at essentially all public universities, not a handful of
scholarship slots.

Private universities in Germany do charge real tuition — "free" refers
specifically to the public system, which is also where the great majority
of strong engineering, research, and applied-science programs sit.

## What you'll still need to budget for

Tuition being free doesn't mean the move is free:

- **Blocked account (Sperrkonto):** proof you can support yourself —
  currently around €11,904, held in a blocked account you draw down from
  monthly once you arrive.
- **Health insurance:** mandatory for your visa and enrollment, arranged
  either through a German public provider or an approved private one.
- **Semester contribution:** the fee mentioned above, paid each semester
  directly to the university.
- **Living costs:** rent, food, and daily expenses — Germany is
  affordable by Western European standards, but this is real spending,
  not covered by "free tuition."

## Eligibility basics

- Academic transcripts and an **APS Certificate** verifying your Indian
  academic documents — this is one of the first things to start, since
  little else in the timeline can move without it.
- English-taught programs generally require IELTS or TOEFL; German-taught
  programs require a recognized German-language certificate (TestDaF or
  DSH), though PhD and Erasmus Mundus applicants are typically exempt.
- A foundation year (Studienkolleg) option exists for students whose prior
  qualifications don't directly match German university entry
  requirements.

## The trade-off

German academic culture expects independence — self-directed study,
less hand-holding than some other systems — and many strong programs
still expect at least conversational German for day-to-day life, even
when the coursework itself is taught in English. Students who go in
prepared for that tend to get both a genuinely strong degree and a real
shot at staying on afterward.

## After graduation

Graduates get an **18-month residence permit** specifically to search for
qualifying work in Germany before needing to move to a different visa
category — one of the more generous post-study work windows among
popular study destinations, and a meaningful part of why the numbers
below keep growing.

India is now the single largest source country for international
students in Germany, with well over 50,000 Indian students currently
enrolled — this isn't a niche path, it's an increasingly well-worn one.`;

exports.seed = async function (knex) {
  await knex("free_study_countries")
    .insert({
      country_name: "Germany",
      country_slug: "germany",
      summary:
        "Public university tuition is free or near-free for international students — plus an 18-month post-study work window.",
      content_markdown: GERMANY_CONTENT_MARKDOWN,
      hero_image_url: null,
      is_published: true,
      sort_order: 1,
    })
    .onConflict("country_slug")
    .ignore();
};
