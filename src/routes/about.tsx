import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import classroom from "@/assets/classroom.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Satya Sai Educational Society, Plakonda" },
      {
        name: "description",
        content:
          "Learn about Satya Sai Educational Society — our mission, values and commitment to affordable, quality education in Plakonda, Vizianagaram district, Andhra Pradesh.",
      },
      {
        property: "og:title",
        content: "About Us — Satya Sai Educational Society, Plakonda",
      },
      {
        property: "og:description",
        content:
          "Our mission and values: affordable, quality Intermediate, Degree and SSC education for rural Andhra Pradesh.",
      },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  {
    title: "Education for All",
    desc: "Every student from Plakonda and nearby villages deserves good education, regardless of background or means.",
  },
  {
    title: "Discipline & Values",
    desc: "We teach alongside character — punctuality, respect, honesty and responsibility in daily campus life.",
  },
  {
    title: "Strong Foundations",
    desc: "Concept clarity first. Regular revision and assessment so students face board exams with confidence.",
  },
  {
    title: "Community Trust",
    desc: "Built with the trust of parents across Vizianagaram district through years of consistent results.",
  },
];

function AboutPage() {
  return (
    <div>
      <section className="bg-secondary">
        <div className="container-site section-pad text-center">
          <h1 className="font-display text-4xl text-primary sm:text-5xl">
            About Our Society
          </h1>
          <p className="mx-auto mt-2 h-1 w-16 rounded-full rule-gold" />
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Satya Sai Educational Society is an educational institution in
            Plakonda, Vizianagaram district, Andhra Pradesh, offering SSC,
            Intermediate and Degree education with the aim of bringing quality,
            affordable learning within reach of rural students.
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-site grid items-start gap-12 md:grid-cols-2">
          <img
            src={classroom}
            alt="Students learning in a classroom at our campus"
            width={1200}
            height={800}
            loading="lazy"
            className="w-full rounded-2xl object-cover shadow-md"
          />
          <div>
            <h2 className="font-display text-3xl text-primary">
              Our Mission
            </h2>
            <p className="mt-2 h-1 w-16 rounded-full rule-gold" />
            <p className="mt-6 leading-relaxed text-muted-foreground">
              To provide value-based education that prepares students of rural
              Andhra Pradesh for board examinations, higher education and
              meaningful careers — with personal attention that large city
              colleges cannot offer.
            </p>
            <h2 className="mt-10 font-display text-3xl text-primary">
              Our Vision
            </h2>
            <p className="mt-2 h-1 w-16 rounded-full rule-gold" />
            <p className="mt-6 leading-relaxed text-muted-foreground">
              A generation of young people from Plakonda and surrounding
              villages who are confident, disciplined and equipped to compete
              anywhere in the state and beyond.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-secondary">
        <div className="container-site section-pad">
          <h2 className="text-center font-display text-3xl text-primary sm:text-4xl">
            What We Stand For
          </h2>
          <p className="mx-auto mt-2 h-1 w-16 rounded-full rule-gold" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-border bg-card p-8"
              >
                <h3 className="font-display text-xl text-primary">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/admissions"
              className="inline-flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Join Our Institution
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
