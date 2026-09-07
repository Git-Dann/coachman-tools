/**
 * Section headings, standfirsts, quotes and lists.
 * Prose that is not a row in a table lives here, so the components hold no
 * strings of their own.
 */

export interface Quote {
  text: string;
  cite: string;
}

/* ---------------------------------------------------------------- counters */

export const COUNTERS = {
  steps: {
    today: "16",
    proposed: "12",
    label: "Steps to get one caravan out",
  },
  handoffs: {
    today: "20",
    proposed: "0",
    label: "Points the same work is done twice",
  },
  paper: {
    today: "4,000",
    proposed: "0",
    label: "Sheets of paper a year, checklist alone",
  },
  history: {
    today: "3",
    proposed: "Forever",
    label: "Seasons of history kept",
  },
};

export const MODE = {
  showing: "Showing",
  today: "How it runs today",
  proposed: "How it would run",
  handoffs: "Handoffs",
  /** Only meaningful in today mode. */
  handoffsHint: "Re-entry points, marked on each step",
};

/* -------------------------------------------------------------- operations */

export const OPS = {
  process: {
    n: "01",
    h2: "The process, end to end",
    lead: "Tap any step to see what actually happens. Turn on the handoffs to see every point where information already held somewhere gets entered again.",
  },
  van: {
    n: "02",
    h2: "Follow one caravan",
    lead: "Same unit, all the way through. Step forward and watch where it lives, who touches it, and what it costs in re-typing.",
    stageOf: (i: number, total: number) => `stage ${i} of ${total}`,
    livesIn: "Lives in",
    handledBy: "Handled by",
    reEntry: "Re-entry points",
    prev: "Previous stage",
    next: "Next stage",
  },
  handoffs: {
    n: "03",
    h2: "Every point the work gets done twice",
    lead: "Not twenty inefficiencies in general terms. Twenty specific, nameable ones, in the order they happen.",
    quoteBefore: {
      text: "For one van that gets ordered and sent to a customer, there are maybe ten different files, if not more, being updated at any one point, rather than searching for that order and seeing everything there.",
      cite: "Said in the room, and agreed",
    } satisfies Quote,
    quoteAfter: {
      text: "You are doing a lot of the same work over and over again to achieve the same result.",
      cite: "Said in the room",
    } satisfies Quote,
  },
  changes: {
    n: "04",
    h2: "What changes for the people doing the work",
    cards: [
      {
        t: "One place to look a van up",
        tag: "Asked for repeatedly",
        d: "Search by customer number, part number or serial number and see everything attached to that caravan. No hunting across fourteen spreadsheets.",
      },
      {
        t: "Dates fill themselves in",
        tag: "Wish list, item two",
        d: "Set the batch up once. The date works itself out from the build time, the working week and the shutdowns, with an override for show units.",
      },
      {
        t: "Invoices print complete",
        tag: "Wish list, item three",
        d: "Price, options and the £50 marketing contribution all on the sheet. Nothing handwritten. The address stays where you put it.",
      },
      {
        t: "Acknowledgements go out on their own",
        tag: "Currently not happening",
        d: "The dealer gets one automatically when something changes, instead of a print, scan and email cycle that there is no time for.",
      },
      {
        t: "The factory records its own work",
        tag: "Removes the retyping",
        d: "Completion and faults get entered once, on the floor. No clipboard, no scan, no reading someone's handwriting back into a screen.",
      },
      {
        t: "History stops disappearing",
        tag: "Replaces the book",
        d: "Every caravan keeps its full record permanently. No three season limit, and nothing that depends on a handwritten book.",
      },
    ],
  },
};

/* -------------------------------------------------------------- leadership */

export const LEAD = {
  risks: { n: "01", h2: "The risks, in order" },
  breaking: {
    n: "02",
    h2: "The breaking point",
    lead: "There are two ceilings, and both get hit whether or not anyone plans for them. One is the system: it already crashes at today's volume and was described as collapsing if orders doubled. The other is the machines: every invoice and acknowledgement gets saved to a desktop folder and never leaves.",
  },
  impact: {
    n: "03",
    h2: "What the manual work costs",
    lead: "Built from the volumes given on the day. Adjust the minutes to whatever feels right and the totals follow. Nothing here is assumed on your behalf.",
  },
  faults: {
    n: "04",
    h2: "Four things that are broken, not missing",
    lead: "Worth separating from the gaps. A missing feature is a decision about what to build. A broken one costs time every day and has already been paid for.",
  },
  lands: {
    n: "05",
    h2: "How it lands",
    quote: {
      text: "We are building a car. Get the shell in first, then the suspension and the intricate bits come later.",
      cite: "Said in the room",
    } satisfies Quote,
    points: [
      {
        strong: "Quick wins first, and they are real platform work.",
        rest: "The date calculator, acknowledgements, documents and search all deliver inside weeks and none of it gets thrown away.",
      },
      {
        strong: "Then the structural core.",
        rest: "Seasons, models, options, batches and dealer allocations.",
      },
      {
        strong: "The clean break is a season boundary.",
        rest: "Nothing gets cut over mid-season. The current season finishes where it is, the next one starts on the new platform.",
      },
      {
        strong: "Released in stages, not one launch.",
        rest: "Aimed at being useful for the 2027 season.",
      },
    ],
    needH3: "What we need from you",
    need: [
      "The pack: screens, the reports and spreadsheets in use, example documents.",
      "Access to the current system, and a copy of it so nothing is ever tested on live dealer data.",
      "Build times per model, the working week, and this season's shutdown dates.",
      "Confirmation of which accounts system version is in use.",
      "A decision on committing to the 2027 season as the changeover.",
    ],
  },
};

/* --------------------------------------------------------------- technical */

export const TECH = {
  decisions: {
    n: "01",
    h2: "The three decisions",
    rows: [
      {
        n: 1,
        t: "A separate database for every client",
        p: [
          "No shared data, ever. A mistake in the code cannot leak one client's records to another because there is physically nothing to leak, and the first question a second manufacturer asks has a one sentence answer.",
          "What it adds: a central admin database holding the client list and versions, an update runner that applies changes across every client in turn, and automated setup for new clients. Separate databases on shared hardware first, promoted to dedicated hardware as a settings change.",
        ],
      },
      {
        n: 2,
        t: "Every unit keeps its own permanent history",
        p: [
          "Not a record that gets overwritten. A list of things that happened to that caravan, in order, never edited. Current state is worked out from it and kept ready so screens stay fast.",
          "This fixes the three season limit, makes recalls answerable, and lets one codebase serve clients whose processes differ. The history table is split by year from the first version.",
        ],
      },
      {
        n: 3,
        t: "One standard process, with controlled customisation",
        p: [
          "Twelve stages built into the product. Clients turn stages on or off, set what must be true before a stage closes, use their own wording, add their own fields, and bring their own document layouts.",
          "They do not get their own version of the software. If something cannot be done through settings it becomes a feature everyone gets, or it does not happen. Every vertical product that dies, dies of per-customer code.",
        ],
      },
    ],
  },
  stages: {
    n: "02",
    h2: "The standard twelve stages",
    lead: "Coachman runs sixteen steps. This is twelve, and the gap is the whole point. Around five of their steps exist only to move paper between systems that cannot talk to each other. Those are not stages in building a caravan and they do not get rebuilt.",
    cols: ["Stage", "What it means"],
  },
  entities: {
    n: "03",
    h2: "What the data hangs off",
    lead: 'The unit is the centre of everything. Every other record attaches to it over its life. Coachman\'s whole problem is that nothing in their setup represents "this caravan", so build around the numbered physical item and looking one up stops being a feature you add later.',
    cols: ["Entity", "Why it applies to any manufacturer like this"],
  },
  stack: {
    n: "04",
    h2: "The stack",
    lead: "Nothing unusual. The hard part is understanding the business, not the technology, and anything clever here is a distraction.",
    cols: ["Part", "Choice", "Why"],
    headroomH3: "Headroom, since it comes up",
    headroomP:
      "At roughly a hundred recorded events across a caravan's life, ten years of full history is about two million rows. That is nothing for this database.",
    headroomCols: ["Volume", "Events over ten years", "What it needs"],
    headroomAfter:
      "A hundred times current volume would mean building several times the entire UK touring caravan market. Capacity is not a real concern. Getting the model right is.",
  },
  settle: {
    n: "05",
    h2: "Still to settle",
    points: [
      {
        strong: "The commercial arrangement.",
        rest: "If Coachman funds a system intended for other manufacturers, that gets written down before the first migration. Ownership, licence, and whether they know that is the plan.",
      },
      {
        strong: "What Factory Master actually does.",
        rest: "It never came up on the visit, so where production scheduling, stock and parts lists sit is unknown. The largest gap.",
      },
      {
        strong: "Which accounts system version.",
        rest: "It is the only permanent integration and invoicing cannot ship without it, so this now outranks everything about the old system.",
      },
      {
        strong: "How the factory records work.",
        rest: "Handhelds, tablets or something new, and whether it has to work without a signal.",
      },
      {
        strong: "A test copy of the current system.",
        rest: "There is no test environment today. Everything runs on live data, so a copy is a prerequisite rather than a nicety.",
      },
    ],
  },
};
