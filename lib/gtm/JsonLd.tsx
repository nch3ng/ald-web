/**
 * GTM module — JSON-LD renderer.
 *
 * Renders a schema.org structured-data node as a <script type="application/ld+json">.
 * Server component (no client JS). Pass nodes from the builders in `seo.ts`.
 *
 * JSON is serialized with `<` escaped to prevent breaking out of the script tag
 * — the data here is our own, but escaping keeps it safe if a field ever carries
 * user/CMS content.
 */

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
