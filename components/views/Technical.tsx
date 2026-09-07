import { Hero, SectionHead } from "@/components/Shell";
import { TECH } from "@/content/copy";
import { STAGES } from "@/content/stages";
import { ENTITIES } from "@/content/entities";
import { HEADROOM, STACK } from "@/content/stack";
import { viewById } from "@/content/views";

/** For our side and their IT. */
export function Technical() {
  const meta = viewById("technical");
  return (
    <div className="wrap">
      <Hero eyebrow={meta.eyebrow} h1={meta.h1} standfirst={meta.standfirst} />

      <section aria-labelledby="dec-h">
        <SectionHead
          n={TECH.decisions.n}
          title={TECH.decisions.h2}
          id="dec-h"
        />
        <div className="dec">
          {TECH.decisions.rows.map((d) => (
            <div className="decrow" key={d.n}>
              <div className="decn">{d.n}</div>
              <div>
                <p className="dect">{d.t}</p>
                {d.p.map((para) => (
                  <p key={para}>{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="stages-h">
        <SectionHead n={TECH.stages.n} title={TECH.stages.h2} id="stages-h" />
        <p className="lead">{TECH.stages.lead}</p>
        <Table cols={TECH.stages.cols}>
          {STAGES.map(([name, meaning], i) => (
            <tr key={name}>
              <td>
                {i + 1}. {name}
              </td>
              <td>{meaning}</td>
            </tr>
          ))}
        </Table>
      </section>

      <section aria-labelledby="ent-h">
        <SectionHead
          n={TECH.entities.n}
          title={TECH.entities.h2}
          id="ent-h"
        />
        <p className="lead">{TECH.entities.lead}</p>
        <Table cols={TECH.entities.cols}>
          {ENTITIES.map(([name, why]) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{why}</td>
            </tr>
          ))}
        </Table>
      </section>

      <section aria-labelledby="stack-h">
        <SectionHead n={TECH.stack.n} title={TECH.stack.h2} id="stack-h" />
        <p className="lead">{TECH.stack.lead}</p>
        <Table cols={TECH.stack.cols}>
          {STACK.map(([part, choice, why]) => (
            <tr key={part}>
              <td>{part}</td>
              <td>{choice}</td>
              <td>{why}</td>
            </tr>
          ))}
        </Table>

        <h3>{TECH.stack.headroomH3}</h3>
        <p>{TECH.stack.headroomP}</p>
        <Table cols={TECH.stack.headroomCols}>
          {HEADROOM.map(([volume, events, needs]) => (
            <tr key={volume}>
              <td>{volume}</td>
              <td className="mono">{events}</td>
              <td>{needs}</td>
            </tr>
          ))}
        </Table>
        <p>{TECH.stack.headroomAfter}</p>
      </section>

      <section aria-labelledby="settle-h">
        <SectionHead n={TECH.settle.n} title={TECH.settle.h2} id="settle-h" />
        <ul className="pl q">
          {TECH.settle.points.map((p) => (
            <li key={p.strong}>
              <span>
                <strong>{p.strong}</strong> {p.rest}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Tables scroll inside their own container, never the page body. */
function Table({
  cols,
  children,
}: {
  cols: readonly string[];
  children: React.ReactNode;
}) {
  return (
    <div className="tw" tabIndex={0} role="region" aria-label={cols.join(", ")}>
      <table>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
