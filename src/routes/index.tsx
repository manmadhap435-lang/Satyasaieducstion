import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import classroom from "@/assets/classroom.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Satya Sai Educational Society — Inter, Degree & SSC, Plakonda",
      },
      {
        name: "description",
        content:
          "Satya Sai Educational Society in Plakonda, Vizianagaram district, A.P. offers Intermediate, Degree and SSC education with dedicated faculty and personal attention.",
      },
      {
        property: "og:title",
        content:
          "Satya Sai Educational Society — Inter, Degree & SSC, Plakonda",
      },
      {
        property: "og:description",
        content:
          "Quality Intermediate, Degree and SSC education in Plakonda, Vizianagaram district, Andhra Pradesh.",
      },
    ],
  }),
  component: Index,
});

const PROGRAMS = [
  {
    title: "Intermediate",
    tag: "Classes XI & XII",
    desc: "MPC, BiPC, CEC and HEC streams with regular tests, study hours and exam-focused coaching for a strong base for EAMCET and higher studies.",
    to: "/academics",
  },
  {
    title: "Degree",
    tag: "B.A. · B.Sc. · B.Com.",
    desc: "Three-year degree programmes that combine solid academics with communication skills and career guidance for further study or employment.",
    to: "/academics",
  },
  {
    title: "SSC",
    tag: "Class X",
    desc: "Carefully guided Class X preparation with experienced subject teachers, doubt-clearing sessions and continuous assessment all year.",
    to: "/academics",
  },
];

const HIGHLIGHTS = [
  {
    title: "Experienced Faculty",
    desc: "Dedicated subject teachers who know every student by name and track progress closely.",
  },
  {
    title: "Personal Attention",
    desc: "Small batches, regular doubt-clearing and individual mentoring for slower learners.",
  },
  {
    title: "Study Hours & Tests",
    desc: "Supervised daily study hours, weekly tests and revision exams before every board exam.",
  },
  {
    title: "Affordable Education",
    desc: "Quality education at fees that families in rural Vizianagaram district can afford.",
  },
];

function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={hero}
          alt="Students walking on the campus of Satya Sai Educational Society"
          width={1600}
          height={900}
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/30" />
        <div className="container-site section-pad">
          <div className="max-w-2xl">
            <p className="inline-block rounded-full border border-accent/60 bg-primary/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Plakonda · Vizianagaram District · Andhra Pradesh
            </p>
            <h1 className="mt-6 font-display text-4xl leading-tight text-primary-foreground sm:text-5xl md:text-6xl">
              Satya Sai Educational Society
            </h1>
            <p className="mt-2 h-1 w-24 rounded-full rule-gold" />
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary-foreground/90">
              Intermediate, Degree and SSC education under one roof — building
              strong foundations and bright futures for students of rural
              Vizianagaram.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/admissions"
                hash="enquire"
                className="inline-flex items-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Admissions Open — Enquire Now
              </Link>
              <Link
                to="/academics"
                className="inline-flex items-center rounded-lg border border-primary-foreground/40 px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Explore Academics
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="section-pad">
        <div className="container-site">
          <h2 className="text-center font-display text-3xl text-primary sm:text-4xl">
            What We Offer
          </h2>
          <p className="mx-auto mt-2 h-1 w-16 rounded-full rule-gold" />
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            From Class X to Degree — every stage guided by committed teachers.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PROGRAMS.map((p) => (
              <Link
                key={p.title}
                to={p.to}
                className="group rounded-2xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-foreground">
                  {p.tag}
                </p>
                <h3 className="mt-3 font-display text-2xl text-primary">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p.desc}
                </p>
                <span className="mt-5 inline-block text-sm font-semibold text-primary group-hover:underline">
                  Learn more →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="bg-secondary">
        <div className="container-site section-pad grid items-center gap-12 md:grid-cols-2">
          <img
            src={classroom}
            alt="A classroom session in progress"
            width={1200}
            height={800}
            loading="lazy"
            className="w-full rounded-2xl object-cover shadow-md"
          />
          <div>
            <h2 className="font-display text-3xl text-primary sm:text-4xl">
              Why Families Choose Us
            </h2>
            <p className="mt-2 h-1 w-16 rounded-full rule-gold" />
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {HIGHLIGHTS.map((h) => (
                <div key={h.title}>
                  <h3 className="font-semibold text-foreground">{h.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {h.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary">
        <div className="container-site section-pad text-center">
          <h2 className="font-display text-3xl text-primary-foreground sm:text-4xl">
            Admissions Open for the New Academic Year
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
            Seats are limited in every stream. Visit our campus at Plakonda or
            get in touch with the office to know about courses, fees and the
            admission process.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/admissions"
              className="inline-flex items-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              View Admission Details
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-lg border border-primary-foreground/40 px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Contact the Office
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
