export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-5xl uppercase leading-none sm:text-6xl">
        Contact
      </h1>
      <p className="mt-8 text-sm text-muted">
        Questions, exchanges, or wholesale — reach us at
      </p>
      <a
        href="mailto:offthread026@gmail.com"
        className="mt-2 inline-block font-mono text-sm text-accent hover:underline"
      >
        offthread026@gmail.com
      </a>
    </div>
  );
}
