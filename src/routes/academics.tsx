import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/academics")({
  head: () => ({
    meta: [
      { title: "Academics — Intermediate, Degree & SSC | Satya Sai Educational Society" },
      {
        name: "description",
        content:
          "Courses offered at Satya Sai Educational Society, Plakonda: Intermediate (MPC, BiPC, CEC, HEC), Degree (B.A., B.Sc., B.Com.) and SSC Class X — with details of teaching, tests and study hours.",
      },
      {
        property: "og:title",
        content:
          "Academics — Intermediate, Degree & SSC | Satya Sai Educational Society",
      },
      {
        property: "og:description",
        content:
          "Intermediate, Degree and SSC programmes with experienced faculty, regular tests and supervised study hours.",
      },
    ],
  }),
  component: AcademicsPage,
});

const STREAMS = [
  {
    name: "Intermediate",
    period: "2 Years · Classes XI & XII",
    options: [
      {
        combo: "MPC",
        subjects: "Maths, Physics, Chemistry",
        note: "For engineering and technology aspirants — EAMCET-oriented coaching from day one.",
      },
      {
        combo: "BiPC",
        subjects: "Biology, Physics, Chemistry",
        note: "For medical, agriculture and pharmacy aspirants with strong practical grounding.",
      },
      {
        combo: "CEC",
        subjects: "Civics, Economics, Commerce",
        note: "Foundation for B.Com., CA and careers in business and administration.",
      },
      {
        combo: "HEC",
        subjects: "History, Economics, Civics",
        note: "Prepares students for civil services foundation, law and arts degrees.",
      },
    ],
    features: [
      "Daily supervised study hours",
      "Weekly tests and monthly grand tests",
      "EAMCET foundation for MPC & BiPC",
      "Individual progress reports to parents",
    ],
  },
  {
    name: "Degree",
    period: "3 Years · B.A. / B.Sc. / B.Com.",
    options: [
      {
        combo: "B.Sc.",
        subjects: "Science stream combinations",
        note: "Strong laboratory work and concept teaching for higher studies and competitive exams.",
      },
      {
        combo: "B.Com.",
        subjects: "Commerce stream",
        note: "Accounting, taxation basics and computer skills for commerce careers.",
      },
      {
        combo: "B.A.",
        subjects: "Arts stream",
        note: "Preparation for government exams, further study and teaching careers.",
      },
    ],
    features: [
      "Experienced degree lecturers",
      "Communication and soft-skills sessions",
      "Career guidance and exam preparation",
      "Affordable fee structure",
    ],
  },
  {
    name: "SSC",
    period: "Class X",
    options: [
      {
        combo: "SSC (Class X)",
        subjects: "All Board of Secondary Education subjects",
        note: "Focused board-exam preparation with chapter-wise revision and previous-paper practice.",
      },
    ],
    features: [
      "Small batches with individual attention",
      "Daily homework checking",
      "Pre-final and grand test series",
      "Doubt-clearing sessions every evening",
    ],
  },
];

function AcademicsPage() {
  return (
    <div>
      <section className="bg-secondary">
        <div className="container-site section-pad text-center">
          <h1 className="font-display text-4xl text-primary sm:text-5xl">
            Academics
          </h1>
          <p className="mx-auto mt-2 h-1 w-16 rounded-full rule-gold" />
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Three stages of learning under one campus — SSC, Intermediate and
            Degree — each with structured teaching, regular assessment and
            personal mentoring.
          </p>
        </div>
      </section>

      {STREAMS.map((stream, i) => (
        <section key={stream.name} className={i % 2 === 1 ? "bg-secondary" : ""}>
          <div className="container-site section-pad">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-3xl text-primary sm:text-4xl">
                {stream.name}
              </h2>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-accent-foreground">
                {stream.period}
              </p>
            </div>
            <p className="mt-2 h-1 w-16 rounded-full rule-gold" />
            <div className="mt-10 grid gap-8 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {stream.options.map((opt) => (
                  <div
                    key={opt.combo}
                    className="rounded-2xl border border-border bg-card p-6"
                  >
                    <h3 className="font-display text-xl text-primary">
                      {opt.combo}
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {opt.subjects}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {opt.note}
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-primary p-8 text-primary-foreground">
                <h3 className="font-display text-xl">
                  How We Teach {stream.name}
                </h3>
                <ul className="mt-5 space-y-3 text-sm">
                  {stream.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/admissions"
                  className="mt-8 inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  Apply for {stream.name}
                </Link>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
