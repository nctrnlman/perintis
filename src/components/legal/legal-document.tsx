interface LegalSection {
  heading: string;
  body?: string;
  list?: string[];
}

interface LegalDocumentProps {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

export function LegalDocument({ title, lastUpdated, intro, sections }: LegalDocumentProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{lastUpdated}</p>
      <p className="mt-6 leading-relaxed text-muted-foreground">{intro}</p>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-lg font-semibold">{section.heading}</h2>
            {section.body && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            )}
            {section.list && (
              <ul className="mt-3 space-y-2">
                {section.list.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span className="mt-[7px] size-1 shrink-0 rounded-full bg-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
