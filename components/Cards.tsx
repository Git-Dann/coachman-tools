import { RISKS } from "@/content/risks";
import { FAULTS } from "@/content/faults";
import { HANDOFFS } from "@/content/handoffs";
import { LEAD, OPS } from "@/content/copy";
import { Quote, SectionHead } from "./Shell";

/** The risks, in order. Brass edge: something to weigh, not a defect. */
export function Risks() {
  return (
    <section aria-labelledby="risks-h">
      <SectionHead n={LEAD.risks.n} title={LEAD.risks.h2} id="risks-h" />
      <div className="cards">
        {RISKS.map(([headline, tag, detail, consequence]) => (
          <div className="card r" key={headline}>
            <p className="card-t">{headline}</p>
            <span className="card-tag">{tag}</span>
            <p>{detail}</p>
            {consequence && (
              <p>
                <strong>{consequence}</strong>
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/** Four things that are broken, not missing. Flag edge. */
export function Faults() {
  return (
    <section aria-labelledby="faults-h">
      <SectionHead n={LEAD.faults.n} title={LEAD.faults.h2} id="faults-h" />
      <p className="lead">{LEAD.faults.lead}</p>
      <div className="cards">
        {FAULTS.map(([name, tag, detail, consequence]) => (
          <div className="card f" key={name}>
            <p className="card-t">{name}</p>
            <span className="card-tag">{tag}</span>
            <p>{detail}</p>
            {consequence && (
              <p>
                <strong>{consequence}</strong>
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/** All twenty re-entry points, in the order they happen. */
export function HandoffList() {
  return (
    <section aria-labelledby="handoffs-h">
      <SectionHead
        n={OPS.handoffs.n}
        title={OPS.handoffs.h2}
        id="handoffs-h"
      />
      <p className="lead">{OPS.handoffs.lead}</p>
      <Quote {...OPS.handoffs.quoteBefore} />
      <ol className="hl">
        {HANDOFFS.map(([title, detail]) => (
          <li key={title}>
            <span>
              <b>{title}</b>
              <span>{detail}</span>
            </span>
          </li>
        ))}
      </ol>
      <Quote {...OPS.handoffs.quoteAfter} />
    </section>
  );
}

/** What changes for the people doing the work. Moss edge. */
export function WhatChanges() {
  return (
    <section aria-labelledby="changes-h">
      <SectionHead n={OPS.changes.n} title={OPS.changes.h2} id="changes-h" />
      <div className="cards two">
        {OPS.changes.cards.map((c) => (
          <div className="card g" key={c.t}>
            <p className="card-t">{c.t}</p>
            <span className="card-tag">{c.tag}</span>
            <p>{c.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
