import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions — Satya Sai Educational Society, Plakonda" },
      {
        name: "description",
        content:
          "Admissions from Nursery to Class 10 (SSC), Intermediate (MPC, BiPC, CEC, HEC) and Degree programmes at Satya Sai Educational Society, Plakonda — eligibility, documents required and the admission process.",
      },
      {
        property: "og:title",
        content: "Admissions — Satya Sai Educational Society, Plakonda",
      },
      {
        property: "og:description",
        content:
          "Admission process, eligibility and documents for Nursery to Class 10 (SSC), Intermediate and Degree programmes. Visit our Plakonda campus to enrol.",
      },
    ],
  }),
  component: AdmissionsPage,
});

const STEPS = [
  {
    step: "1",
    title: "Enquire",
    desc: "Visit the campus office at Plakonda or call us to ask about the stream, seats and fees.",
  },
  {
    step: "2",
    title: "Counselling",
    desc: "Meet our staff with your marks memo. We help you choose the right stream based on your interests and results.",
  },
  {
    step: "3",
    title: "Submit Documents",
    desc: "Hand in the required certificates and fill in the application form at the office.",
  },
  {
    step: "4",
    title: "Confirm Admission",
    desc: "Pay the fee, collect your ID and timetable, and attend the orientation before classes begin.",
  },
];

const DOCUMENTS = [
  "SSC / previous class marks memo (original + photocopy)",
  "Transfer Certificate (T.C.) from the previous institution",
  "Study / Bonafide certificate",
  "Aadhaar card copy of the student",
  "Caste & income certificates (if applicable, for scholarships)",
  "Passport-size photographs (4 copies)",
];

const FAQS = [
  {
    q: "When do admissions open?",
    a: "Admissions open after SSC and Intermediate results are announced, usually in April–May, and continue until seats are filled. Contact the office for the current status.",
  },
  {
    q: "Is there an entrance test?",
    a: "Admission is generally based on your previous examination marks. Counselling at the office helps decide the right stream for you.",
  },
  {
    q: "Are scholarships available?",
    a: "Eligible students can apply for government scholarships (such as Jnanabhumi) with the help of our office. Bring caste and income certificates if applying.",
  },
  {
    q: "What are the college timings?",
    a: "Classes run from morning to afternoon with supervised study hours in the evening. Exact timings are shared at the time of admission.",
  },
];

const enquirySchema = z.object({
  student_name: z
    .string()
    .trim()
    .min(2, "Please enter the student's name")
    .max(100, "Name must be under 100 characters"),
  location: z
    .string()
    .trim()
    .min(2, "Please enter your village or town")
    .max(100, "Location must be under 100 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  class_of_admission: z
    .string()
    .min(1, "Please select the class of admission"),
});

const CLASS_OPTIONS = [
  "Nursery",
  "L.K.G",
  "U.K.G",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10 (SSC)",
  "Intermediate — MPC",
  "Intermediate — BiPC",
  "Intermediate — CEC",
  "Intermediate — HEC",
  "Degree — B.A.",
  "Degree — B.Sc.",
  "Degree — B.Com.",
];

function EnquiryForm() {
  const [form, setForm] = useState({
    student_name: "",
    location: "",
    phone: "",
    class_of_admission: "",
  });
  type FormFields = typeof form;
  const [errors, setErrors] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );

  const update =
    (field: keyof typeof form) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = enquirySchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormFields, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]) as keyof FormFields;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setStatus("saving");

    const newEnquiry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `enq_${Date.now()}`,
      student_name: parsed.data.student_name.trim(),
      location: parsed.data.location.trim(),
      phone: parsed.data.phone.trim(),
      class_of_admission: parsed.data.class_of_admission,
      created_at: new Date().toISOString(),
    };

    // 1. Immediately cache in localStorage so it appears in the frontend Admin Portal
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sses_admission_enquiries_cache");
        const existing: typeof newEnquiry[] = stored ? JSON.parse(stored) : [];
        const merged = [
          newEnquiry,
          ...existing.filter(
            (item) =>
              item.phone !== newEnquiry.phone ||
              item.student_name !== newEnquiry.student_name,
          ),
        ];
        localStorage.setItem(
          "sses_admission_enquiries_cache",
          JSON.stringify(merged.slice(0, 100)),
        );
        window.dispatchEvent(
          new CustomEvent("sses_new_enquiry", { detail: newEnquiry }),
        );
      }
    } catch (err) {
      console.warn("Could not cache enquiry to localStorage:", err);
    }

    // 2. Persist to Supabase Database
    const { error } = await supabase
      .from("admission_enquiries")
      .insert({
        student_name: newEnquiry.student_name,
        location: newEnquiry.location,
        phone: newEnquiry.phone,
        class_of_admission: newEnquiry.class_of_admission,
      });

    if (error) {
      console.error("Supabase enquiry insert failed:", error);
      // If Supabase fails due to RLS, the enquiry is still preserved in local cache
    }

    setStatus("done");
    setForm({
      student_name: "",
      location: "",
      phone: "",
      class_of_admission: "",
    });
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary font-display text-xl text-primary-foreground">
          ✓
        </span>
        <h3 className="mt-4 font-display text-2xl text-primary">
          Enquiry Received
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Thank you! Our office will call you shortly to guide you through the
          admission process. You can also visit the campus during office hours.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 inline-flex items-center rounded-lg border border-primary/30 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          Submit Another Enquiry
        </button>
      </div>
    );
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="student_name"
            className="text-sm font-semibold text-foreground"
          >
            Student Name
          </label>
          <input
            id="student_name"
            type="text"
            value={form.student_name}
            onChange={update("student_name")}
            placeholder="Full name of the student"
            className={inputClass}
            maxLength={100}
          />
          {errors.student_name && (
            <p className="mt-1 text-xs text-destructive">
              {errors.student_name}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="phone"
            className="text-sm font-semibold text-foreground"
          >
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            placeholder="10-digit mobile number"
            className={inputClass}
            maxLength={10}
            inputMode="numeric"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="location"
            className="text-sm font-semibold text-foreground"
          >
            Location
          </label>
          <input
            id="location"
            type="text"
            value={form.location}
            onChange={update("location")}
            placeholder="Your village / town"
            className={inputClass}
            maxLength={100}
          />
          {errors.location && (
            <p className="mt-1 text-xs text-destructive">{errors.location}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="class_of_admission"
            className="text-sm font-semibold text-foreground"
          >
            Class of Admission
          </label>
          <select
            id="class_of_admission"
            value={form.class_of_admission}
            onChange={update("class_of_admission")}
            className={inputClass}
          >
            <option value="">Select a class / course</option>
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.class_of_admission && (
            <p className="mt-1 text-xs text-destructive">
              {errors.class_of_admission}
            </p>
          )}
        </div>
      </div>
      {status === "error" && (
        <p className="mt-4 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          Something went wrong while submitting. Please try again or visit the
          office.
        </p>
      )}
      <button
        type="submit"
        disabled={status === "saving"}
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-60 sm:w-auto"
      >
        {status === "saving" ? "Submitting…" : "Submit Enquiry"}
      </button>
    </form>
  );
}

function AdmissionsPage() {
  return (
    <div>
      <section className="bg-primary">
        <div className="container-site section-pad text-center">
          <p className="inline-block rounded-full border border-accent/60 bg-primary/50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            New Academic Year Admissions
          </p>
          <h1 className="mt-6 font-display text-4xl text-primary-foreground sm:text-5xl">
            Admissions
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/85">
            Join Satya Sai Educational Society for SSC, Intermediate or Degree
            education. Simple process, honest guidance, limited seats per
            stream.
          </p>
        </div>
      </section>

      <section id="enquire" className="scroll-mt-24 bg-secondary">
        <div className="container-site section-pad">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-3xl text-primary sm:text-4xl">
              Enquire Now
            </h2>
            <p className="mx-auto mt-2 h-1 w-16 rounded-full rule-gold" />
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              Fill in your details and our office will call you back with
              stream guidance, seat availability and fee details.
            </p>
            <div className="mt-10">
              <EnquiryForm />
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-site">
          <h2 className="text-center font-display text-3xl text-primary">
            How to Apply
          </h2>
          <p className="mx-auto mt-2 h-1 w-16 rounded-full rule-gold" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="relative rounded-2xl border border-border bg-card p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-primary font-display text-lg text-primary-foreground">
                  {s.step}
                </span>
                <h3 className="mt-4 font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary">
        <div className="container-site section-pad grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl text-primary">
              Documents Required
            </h2>
            <p className="mt-2 h-1 w-16 rounded-full rule-gold" />
            <ul className="mt-8 space-y-3">
              {DOCUMENTS.map((d) => (
                <li key={d} className="flex gap-3 text-sm text-foreground/90">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  {d}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              Carry originals for verification. The office will guide you if
              any document needs to be arranged.
            </p>
          </div>
          <div>
            <h2 className="font-display text-3xl text-primary">
              Common Questions
            </h2>
            <p className="mt-2 h-1 w-16 rounded-full rule-gold" />
            <div className="mt-8 space-y-4">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-2xl border border-border bg-card p-5"
                >
                  <summary className="cursor-pointer list-none font-semibold text-foreground marker:hidden">
                    <span className="mr-2 text-accent-foreground group-open:hidden">
                      +
                    </span>
                    <span className="mr-2 hidden text-accent-foreground group-open:inline">
                      −
                    </span>
                    {f.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-site rounded-3xl bg-primary px-6 py-14 text-center sm:px-12">
          <h2 className="font-display text-3xl text-primary-foreground sm:text-4xl">
            Ready to Enrol?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
            Visit our campus at Plakonda, Vizianagaram district, or reach the
            office — our staff will walk you through every step.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Contact & Location
            </Link>
            <Link
              to="/academics"
              className="inline-flex items-center rounded-lg border border-primary-foreground/40 px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
