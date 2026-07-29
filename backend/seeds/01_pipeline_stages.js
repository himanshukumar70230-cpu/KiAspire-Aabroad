// Fixed, seeded reference data for the 5-phase / staff-granular pipeline
// described in CLAUDE.md's Lead → Profile → Application → Visa →
// Post-Arrival workflow. Not admin-editable in this phase (see
// ARCHITECTURE.md section 3) — this seed is the source of truth for it.
//
// student_label is identical for every stage within a phase, so the
// student dashboard's 5-phase grouped view reads consistently regardless
// of which granular stage the application is actually on.

const STAGES = [
  // phase: lead — student_label: "Getting to Know You"
  { code: "lead_captured", label: "Lead Captured", phase: "lead" },
  { code: "counsellor_assigned", label: "Counsellor Assigned", phase: "lead" },
  {
    code: "followups_counselling",
    label: "Follow-ups & Counselling",
    phase: "lead",
  },

  // phase: profile_planning — student_label: "Building Your Profile"
  {
    code: "student_profile_created",
    label: "Student Profile Created",
    phase: "profile_planning",
  },
  {
    code: "academic_details_records",
    label: "Academic Details & Records",
    phase: "profile_planning",
  },
  {
    code: "test_scores",
    label: "Test Scores (IELTS/TOEFL/GRE/GMAT)",
    phase: "profile_planning",
  },
  {
    code: "preferences",
    label: "Preferences (Country, Course, Intake, Budget)",
    phase: "profile_planning",
  },
  {
    code: "shortlist_universities_courses",
    label: "Shortlist Universities & Courses",
    phase: "profile_planning",
  },
  {
    code: "application_plan_checklist",
    label: "Application Plan & Checklist",
    phase: "profile_planning",
  },

  // phase: application_process — student_label: "Applying to Universities"
  {
    code: "select_university_course",
    label: "Select University & Course",
    phase: "application_process",
  },
  {
    code: "prepare_review_documents",
    label: "Prepare & Review Documents",
    phase: "application_process",
  },
  {
    code: "submit_application",
    label: "Submit Application",
    phase: "application_process",
  },
  {
    code: "under_review",
    label: "Under Review",
    phase: "application_process",
  },
  {
    code: "receive_offer",
    label: "Receive Offer (Conditional/Unconditional)",
    phase: "application_process",
  },
  {
    code: "accept_offer_pay_fees",
    label: "Accept Offer & Pay Fees",
    phase: "application_process",
  },

  // phase: visa — student_label: "Visa & Travel Prep"
  { code: "start_visa_process", label: "Start Visa Process", phase: "visa" },
  {
    code: "upload_visa_documents",
    label: "Upload Visa Documents",
    phase: "visa",
  },
  {
    code: "book_visa_appointment",
    label: "Book Visa Appointment",
    phase: "visa",
  },
  {
    code: "visa_interview",
    label: "Visa Interview (if required)",
    phase: "visa",
  },
  { code: "visa_decision", label: "Visa Decision", phase: "visa" },
  {
    code: "pre_departure_guidance",
    label: "Pre-Departure Guidance",
    phase: "visa",
  },
  {
    code: "travel_fly_to_country",
    label: "Travel & Fly to Country",
    phase: "visa",
  },

  // phase: post_arrival — student_label: "Settling In"
  {
    code: "student_arrives",
    label: "Student Arrives",
    phase: "post_arrival",
  },
  {
    code: "airport_pickup",
    label: "Airport Pickup (if applicable)",
    phase: "post_arrival",
  },
  {
    code: "accommodation_support",
    label: "Accommodation Support",
    phase: "post_arrival",
  },
  {
    code: "university_onboarding",
    label: "University Onboarding",
    phase: "post_arrival",
  },
  {
    code: "ongoing_support_testimonial",
    label: "Ongoing Support & Testimonial",
    phase: "post_arrival",
  },
];

const PHASE_STUDENT_LABELS = {
  lead: "Getting to Know You",
  profile_planning: "Building Your Profile",
  application_process: "Applying to Universities",
  visa: "Visa & Travel Prep",
  post_arrival: "Settling In",
};

exports.seed = async function (knex) {
  const rows = STAGES.map((stage, index) => ({
    phase: stage.phase,
    code: stage.code,
    label: stage.label,
    student_label: PHASE_STUDENT_LABELS[stage.phase],
    sort_order: index + 1,
  }));

  // Upsert on the stable `code` key instead of delete+insert — pipeline_stages
  // is referenced by applications/application_stage_history with ON DELETE
  // RESTRICT, so a delete-first seed would fail (or cascade data loss) the
  // moment any real application exists. Safe to re-run at any time.
  await knex("pipeline_stages")
    .insert(rows)
    .onConflict("code")
    .merge(["phase", "label", "student_label", "sort_order"]);
};
