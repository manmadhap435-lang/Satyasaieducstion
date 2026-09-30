import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Satya Sai Educational Society, Plakonda" },
      {
        name: "description",
        content:
          "Contact Satya Sai Educational Society at Plakonda, Vizianagaram district, Andhra Pradesh. Campus address, office hours and directions.",
      },
      {
        property: "og:title",
        content: "Contact Us — Satya Sai Educational Society, Plakonda",
      },
      {
        property: "og:description",
        content:
          "Visit our campus at Plakonda, Vizianagaram district, A.P. Office open Monday to Saturday, 9 AM to 5 PM.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div>
      <section className="bg-secondary">
        <div className="container-site section-pad text-center">
          <h1 className="font-display text-4xl text-primary sm:text-5xl">
            Contact Us
          </h1>
          <p className="mx-auto mt-2 h-1 w-16 rounded-full rule-gold" />
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            We welcome parents and students at our campus. Walk in during
            office hours or reach out to us — we're happy to help.
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-site grid gap-10 md:grid-cols-2">
          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-8">
              <h2 className="font-display text-2xl text-primary">
                Campus Address
              </h2>
              <address className="mt-4 not-italic leading-relaxed text-foreground/90">
                <strong>Satya Sai Educational Society</strong>
                <br />
                Plakonda,
                <br />
                Vizianagaram District,
                <br />
                Andhra Pradesh, India
              </address>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8">
              <h2 className="font-display text-2xl text-primary">
                Office Hours
              </h2>
              <dl className="mt-4 space-y-2 text-sm text-foreground/90">
                <div className="flex justify-between border-b border-border pb-2">
                  <dt>Monday – Saturday</dt>
                  <dd className="font-medium">9:00 AM – 5:00 PM</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Sunday</dt>
                  <dd className="font-medium">Closed</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-muted-foreground">
                For admissions enquiries, visiting between 9 AM and 4 PM on
                working days is best.
              </p>
            </div>
            <div className="rounded-2xl bg-primary p-8 text-primary-foreground">
              <h2 className="font-display text-2xl">Planning to visit?</h2>
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/90">
                Ask for the admissions desk at the office. Bring your previous
                marks memo so our staff can guide you on the right stream
                immediately.
              </p>
              <Link
                to="/admissions"
                className="mt-6 inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
              >
                See Admission Steps
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border">
            <iframe
              title="Map showing Plakonda, Vizianagaram district, Andhra Pradesh"
              src="https://www.google.com/maps?q=Plakonda,%20Vizianagaram,%20Andhra%20Pradesh&output=embed"
              className="h-full min-h-[480px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
