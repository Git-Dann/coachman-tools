import { ProcessSpine } from "@/components/ProcessSpine";
import { VanPlayer } from "@/components/VanPlayer";
import { HandoffList, WhatChanges } from "@/components/Cards";
import { viewById } from "@/content/views";

/** For the people doing the work. */
export function Operations() {
  return (
    <div className="wrap">
      <ProcessSpine meta={viewById("operations")} />
      <VanPlayer />
      <HandoffList />
      <WhatChanges />
    </div>
  );
}
