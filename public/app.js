// ============================================================================
// FollowUp OS — app.js
// Ported from _extracted/component-script.js (Component extends DCLogic)
// Stage 1 scope: shell, Home, Follow-ups (inbox), Post-meeting, Sent, Dismissed
// Settings + Thread are placeholder screens for now.
// ============================================================================

// ---------------------------------------------------------------------------
// DATA TABLES (verbatim from component-script.js)
// ---------------------------------------------------------------------------

const MAILBOXES = [
  { address: "ellen@heartcount.com", count: 7, dot: "#0b8ee8", role: "Primary · Google Workspace", state: "ok", sync: "scanned 2 min ago" },
  { address: "partnerships@heartcount.com", count: 4, dot: "#8b7fd4", role: "Shared inbox · Google Workspace", state: "ok", sync: "scanned 2 min ago" },
  { address: "ellen@thrivea.io", count: 3, dot: "#3fb27f", role: "Partner org · Google Workspace", state: "ok", sync: "scanned 6 min ago" },
  { address: "bd@heartcount.com", count: 0, dot: "#e8801f", role: "Shared inbox · Google Workspace", state: "reauth", sync: "last scan failed 4 h ago" },
  { address: "events@heartcount.com", count: 2, dot: "#d98aa8", role: "Alias · forwards to primary", state: "sync", sync: "first scan in progress" }
];

const MB_STATE = {
  ok:     { label: "Connected",     bg: "#dcf0e6", color: "#2b7355", icon: "ti-circle-check" },
  reauth: { label: "Reconnect",     bg: "#fce6d8", color: "#a5561b", icon: "ti-alert-triangle" },
  sync:   { label: "Syncing",       bg: "#dce9fb", color: "#0b6fb8", icon: "ti-refresh" }
};

const TIERS = {
  today:  { label: "Reply today", bg: "#fce6d8", color: "#a5561b", dot: "#e8801f" },
  week:   { label: "This week",   bg: "#e8e2f8", color: "#54459b", dot: "#8b7fd4" },
  fyi:    { label: "FYI only",    bg: "#dcf0e6", color: "#2b7355", dot: "#3fb27f" }
};

const THREADS = [
  {
    id: "t1", tier: "today", waited: "51h",
    name: "Marcus Delaney", org: "Northwind Logistics", initials: "MD", av: "linear-gradient(135deg,#cfe2f7,#b6cdf0)",
    subject: "Re: Q3 pilot pricing, need your numbers by Friday",
    snippet: "Legal cleared the MSA, so the only open item is the per-seat figure for the 400-employee tier. If you can get me a range before Friday I can take it to the steering group.",
    mailbox: "partnerships@heartcount.com", time: "Wed 09:14",
    body: "Hi Ellen,\n\nGood news, legal cleared the MSA on Monday with no redlines on the data-processing schedule.\n\nThe only open item is the per-seat figure for the 400-employee tier. Our CFO wants a range rather than a single number so she can model best/worst case for the Q3 board pack.\n\nIf you can get me something before Friday I can take it to the steering group next week instead of waiting for the August cycle.\n\nAlso, is the pilot still 8 weeks, or did we land on 10?\n\nThanks,\nMarcus",
    why: "Direct question with a Friday deadline · thread has been open 51 hours"
  },
  {
    id: "t2", tier: "today", waited: "26h",
    name: "Priya Raghavan", org: "Aster Health Group", initials: "PR", av: "linear-gradient(135deg,#f7ddc4,#f3c9ae)",
    subject: "Can you intro me to Aster's People Ops lead?",
    snippet: "You mentioned you know Dana Whitfield from the Lisbon summit. We're circling Aster for the engagement survey rollout and a warm intro would move this months faster.",
    mailbox: "ellen@heartcount.com", time: "Thu 16:40",
    body: "Ellen,\n\nQuick ask. You mentioned at the Lisbon summit that you know Dana Whitfield, Aster's People Ops lead.\n\nWe're circling Aster for the engagement survey rollout and their procurement route is famously slow. A warm intro from you would move this months faster than my cold sequence.\n\nHappy to draft the forwardable blurb if that's easier, just say the word.\n\nPriya",
    why: "Asks for a specific action from you · no reply sent yet"
  },
  {
    id: "t3", tier: "week", waited: "3d",
    name: "Tom Okafor", org: "Meridian Consulting", initials: "TO", av: "linear-gradient(135deg,#cdeadd,#a9d8c4)",
    subject: "Follow-up from Tuesday's call: revenue share terms",
    snippet: "Recapping where we landed: 40% referral share on year one, reviewed annually. Sending the partner one-pager Monday unless you want changes to the tiering.",
    mailbox: "partnerships@heartcount.com", time: "Mon 11:02",
    body: "Hi Ellen,\n\nRecapping Tuesday so we have it in writing:\n\n• 40% referral share on year-one contract value, reviewed annually\n• Meridian owns first-line qualification, HeartCount runs the demo\n• Co-branded one-pager, our logo secondary\n\nI'll send the partner one-pager to my team Monday unless you want changes to the tiering. Nothing here is binding until we both sign, obviously.\n\nBest,\nTom",
    why: "Recap awaiting your confirmation · Monday deadline"
  },
  {
    id: "t4", tier: "week", waited: "2d",
    name: "Sofia Bergström", org: "Nordic HR Forum", initials: "SB", av: "linear-gradient(135deg,#e9dcf7,#d3c3ef)",
    subject: "Speaking slot: October summit, Stockholm",
    snippet: "We have a 25-minute slot on the culture-measurement track and I'd love it to be you. Need a title and abstract by the 8th for the printed programme.",
    mailbox: "events@heartcount.com", time: "Tue 08:25",
    body: "Hi Ellen,\n\nWe have a 25-minute slot open on the culture-measurement track at the October summit in Stockholm, and I'd love it to be you, your Lisbon session had the highest rated Q&A of the day.\n\nI need a title and a three-line abstract by the 8th for the printed programme. Travel and two nights covered.\n\nWould also be a good room for the Thrivea partnership story if you want to work that in.\n\nSofia",
    why: "Invitation with a deadline · low urgency but time-boxed"
  }
];

const LOWCONF = [
  {
    id: "l1", tier: "fyi", waited: "1d", low: true,
    name: "Daniel Kovač", org: "Vector Talent Partners", initials: "DK", av: "linear-gradient(135deg,#dfe6f2,#c8d3e6)",
    subject: "Reseller agreement: who owns renewals?",
    snippet: "Before I take this to our leadership I need to know whether renewals sit with us or with you after year one.",
    mailbox: "bd@heartcount.com", time: "Thu 07:12",
    body: "Ellen,\n\nBefore I take this to our leadership I need clarity on one thing: after year one, who owns the renewal conversation, Vector or HeartCount?\n\nOur standard reseller paper assumes we do, but I don't want to assume with you.\n\nDaniel",
    why: "No prior thread with this sender in the scanned window, commercial terms may already be agreed elsewhere"
  },
  {
    id: "l2", tier: "fyi", waited: "2d", low: true,
    name: "Renata Alves", org: "unknown domain", initials: "RA", av: "linear-gradient(135deg,#f5dde8,#ecc6d8)",
    subject: "Following up on our conversation in Porto",
    snippet: "Great to meet you last month, wanted to pick up the thread on the survey pilot we discussed over dinner.",
    mailbox: "ellen@heartcount.com", time: "Wed 21:48",
    body: "Hi Ellen,\n\nGreat to meet you last month, wanted to pick up the thread on the survey pilot we discussed over dinner.\n\nIs the September start still realistic on your side?\n\nRenata",
    why: "Refers to an off-email conversation I can't see, unclear which company or pilot this is"
  }
];

const FOLLOWUPS = [
  {
    id: "f1", days: 9, sent: "Sent Jul 14", mailbox: "bd@heartcount.com",
    name: "Felix Brandt", org: "Continental Facilities", initials: "FB", av: "linear-gradient(135deg,#dfe6f2,#c8d3e6)",
    subject: "Intro to your Nordics HR lead?",
    snippet: "Asked Felix for a warm intro to Continental's Nordics HR lead after he offered one on the call. Nine business days, no reply.",
    body: "Hi Felix,\n\nGreat speaking on Tuesday. You mentioned you'd be happy to introduce me to whoever owns HR for the Nordics region, if that's still on the table I'd welcome it.\n\nHappy to send a short forwardable blurb so it's one click for you.\n\nBest,\nEllen",
    nudge: "He offered the intro himself, so a short one-line bump is low risk."
  },
  {
    id: "f2", days: 7, sent: "Sent Jul 16", mailbox: "bd@heartcount.com",
    name: "Daniel Kovač", org: "Vector Talent Partners", initials: "DK", av: "linear-gradient(135deg,#dfe6f2,#c8d3e6)",
    subject: "Reseller agreement: revised renewal tiering",
    snippet: "Sent Daniel the revised 40/25 tiering after his renewals question. He said he needed it for a leadership review that has now passed.",
    body: "Hi Daniel,\n\nAs promised, the revised tiering: 40% on year-one contract value, 25% on renewals while Vector stays first-line support.\n\nI've attached the one-pager in the same shape your leadership reviewed last quarter.\n\nLet me know if the renewal split works and I'll have our legal team draft.\n\nEllen",
    nudge: "His internal review date has passed, worth asking what came out of it."
  },
  {
    id: "f3", days: 5, sent: "Sent Jul 18", mailbox: "ellen@heartcount.com",
    name: "Renata Alves", org: "Adriano Group", initials: "RA", av: "linear-gradient(135deg,#f5dde8,#ecc6d8)",
    subject: "Pricing for the September survey pilot",
    snippet: "Sent the nonprofit-adjacent pricing for the 180-person pilot she asked about in Porto. No reply in five business days.",
    body: "Hi Renata,\n\nGood to reconnect. Pricing for a 180-person pilot, as discussed:\n\n• 8-week pilot, €9.50 per seat\n• Two pulse cycles included\n• Rolls into an annual agreement at €11 if you continue\n\nSeptember start is still open on our onboarding calendar for another two weeks.\n\nEllen",
    nudge: "Her September start window closes in two weeks, time-sensitive."
  },
  {
    id: "f4", days: 4, sent: "Sent Jul 21", mailbox: "partnerships@heartcount.com",
    name: "Ingrid Halvorsen", org: "Skyline Retail Group", initials: "IH", av: "linear-gradient(135deg,#cdeadd,#a9d8c4)",
    subject: "Recap + next steps from Thursday's call",
    snippet: "Recapped the co-selling motion and asked her to confirm the two pilot stores. Awaiting confirmation before we can scope.",
    body: "Hi Ingrid,\n\nRecapping Thursday:\n\n• Skyline picks two pilot stores, we run the baseline survey in both\n• HeartCount handles enablement for the store managers\n• Review at week six, decide on the full estate after\n\nCan you confirm the two stores so our team can scope the rollout?\n\nEllen",
    nudge: "We are blocked on her answer, everything downstream waits on the two store names."
  }
];

const SENT = [
  { id: "s1", name: "Hannah Weiss", org: "Braithwaite Group", initials: "HW", av: "linear-gradient(135deg,#cfe2f7,#b6cdf0)",
    subject: "Re: Pilot scope for the Munich team", mailbox: "partnerships@heartcount.com", time: "sent 14:22", origin: "edited from option A",
    body: "Hi Hannah, 6 weeks works. I'd keep the Munich team as the only cohort for the pilot so the baseline stays clean, then widen in October. Sending the scope doc tomorrow." },
  { id: "s2", name: "Oliver Grant", org: "Kestrel Advisory", initials: "OG", av: "linear-gradient(135deg,#cdeadd,#a9d8c4)",
    subject: "Re: Intro to Thrivea's implementation lead", mailbox: "ellen@heartcount.com", time: "sent 11:05", origin: "written directly by you",
    body: "Oliver, happy to make that intro. Copying Maya, who runs implementation at Thrivea. Maya, Oliver is looking at the combined engagement + HRIS setup for a 700-person client." },
  { id: "s3", name: "Amara Diallo", org: "Lumen Foundation", initials: "AD", av: "linear-gradient(135deg,#f7ddc4,#f3c9ae)",
    subject: "Re: NGO pricing for a 120-person team", mailbox: "ellen@heartcount.com", time: "sent Wed 17:40", origin: "edited from option B",
    body: "Amara, for a 120-person NGO team we can hold the nonprofit rate through the end of the year. I've attached the one-pager with the two tiers so you can share it internally." }
];

const SEEDS = [
  { id: "x1", name: "Growth Ledger Weekly", subject: "5 partnership plays we saw this month", mailbox: "ellen@heartcount.com", meta: "newsletter" },
  { id: "x2", name: "Cassie Moore", subject: "Quick 15 min about our SDR-as-a-service?", mailbox: "bd@heartcount.com", meta: "cold outbound" }
];

// Real persisted dismissed items (threads + sent-message follow-ups), loaded
// from /api/dashboard — replaces the old dismissedIds-only approach so the
// Dismissed tab survives a page reload instead of resetting every session.
const DISMISSED = [];

const DRAFTS = {
  t1: [
    { label: "Direct with numbers", tone: "#dcf0e6", toneText: "#2b7355",
      text: "Hi Marcus,\n\nGreat news on the MSA.\n\nFor the 400-employee tier we're looking at €11–14 per seat per year, with the lower end tied to a 24-month term. I'd take €12.50 to your steering group as the working number.\n\nThe pilot is 8 weeks, we shortened it after the Braithwaite run showed the baseline stabilises by week six.\n\nI'll send the one-pager with both scenarios today so your CFO can model it.\n\nBest,\nEllen" },
    { label: "Cautious, asks first", tone: "#e8e2f8", toneText: "#54459b",
      text: "Hi Marcus,\n\nThanks for pushing this through legal.\n\nBefore I put a range in writing: is the 400 figure headcount today, or including the two sites you're onboarding in Q4? It moves the tier, and I'd rather give you a number your CFO can hold us to.\n\nOn the pilot, 8 weeks is what I'd recommend.\n\nCan send the range within the day once you confirm.\n\nBest,\nEllen" }
  ],
  t2: [
    { label: "Warm intro, forwardable", tone: "#dcf0e6", toneText: "#2b7355",
      text: "Hi Priya,\n\nHappy to do it. Dana and I sat on the same panel in Lisbon and she's easy to reach.\n\nI'll send her a short note this week framing you as the person running the engagement survey side, no pitch, just the introduction. If she bites I'll loop you in directly.\n\nDon't write the blurb, I'd rather it read like me.\n\nEllen" },
    { label: "Yes, with a condition", tone: "#e8e2f8", toneText: "#54459b",
      text: "Hi Priya,\n\nI can make that intro, with one ask: let me go first and keep it to a two-line note, so it doesn't land as an inbound pitch.\n\nIf Dana replies I'll hand the thread to you the same day. If she doesn't within two weeks, we try the procurement route instead.\n\nSend me one line on what's in it for her team and I'll use it.\n\nEllen" }
  ],
  t3: [
    { label: "Confirms the terms", tone: "#dcf0e6", toneText: "#2b7355",
      text: "Hi Tom,\n\nRecap matches my notes: 40% year-one referral share reviewed annually, Meridian qualifying, us running the demo, co-branded with your logo secondary.\n\nOne clarification before Monday: the 40% applies to year-one contract value net of any implementation fee. Everything else is as written.\n\nGo ahead with the one-pager.\n\nEllen" },
    { label: "Asks for a tiering change", tone: "#e8e2f8", toneText: "#54459b",
      text: "Hi Tom,\n\nThanks for writing it up. One change before you circulate.\n\nI'd like the share tiered: 40% on year one, 25% on renewal while Meridian stays the account's first line of support. Flat 40% forever is hard for me to defend internally past year two.\n\nIf that works, send the one-pager Monday and I'll counter-sign.\n\nEllen" }
  ],
  t4: [
    { label: "Accepts with a title", tone: "#dcf0e6", toneText: "#2b7355",
      text: "Hi Sofia,\n\nYes, I'd love the slot.\n\nWorking title: \"What people actually tell you when nobody scores them.\" Abstract by the 8th, and yes, the Thrivea partnership makes a natural second half.\n\nCan you confirm room size and whether the Q&A is inside the 25 minutes?\n\nEllen" },
    { label: "Accepts, defers the abstract", tone: "#e8e2f8", toneText: "#54459b",
      text: "Hi Sofia,\n\nCount me in for the culture-measurement track.\n\nI'll have the title and abstract to you by the 6th so you have slack before the programme locks. Travel details whenever convenient.\n\nOne question: would you rather I keep it product-neutral, or is the Thrivea partnership story fair game for that room?\n\nEllen" }
  ],
  l1: [
    { label: "Answers, flags the gap", tone: "#dcf0e6", toneText: "#2b7355",
      text: "Hi Daniel,\n\nRenewals sit with HeartCount after year one, with Vector keeping a reduced share while you stay the account's first line of support.\n\nI don't have our earlier thread in front of me. If someone on my side already agreed different terms, send that note over and I'll honour it.\n\nEllen" },
    { label: "Buys time", tone: "#e8e2f8", toneText: "#54459b",
      text: "Hi Daniel,\n\nGood question, and I want to give you the answer that survives contact with our legal team rather than the fast one.\n\nGive me until Thursday. Short version: we expect to own renewals, you keep a share while you're first-line support.\n\nEllen" }
  ],
  l2: [
    { label: "Re-establishes context", tone: "#dcf0e6", toneText: "#2b7355",
      text: "Hi Renata,\n\nGood to hear from you.\n\nSo I pick this up correctly, which team were we scoping the pilot for, and roughly what headcount? Porto was a good evening and I'd rather check than guess.\n\nSeptember is still workable if we confirm scope in the next two weeks.\n\nEllen" },
    { label: "Short and neutral", tone: "#e8e2f8", toneText: "#54459b",
      text: "Hi Renata,\n\nThanks for following up.\n\nSeptember could work. Can you send a line on scope and headcount so I can check it against our onboarding calendar?\n\nEllen" }
  ]
};

const MEETINGS = [
  {
    id: "m1", meeting: true, state: "waiting",
    title: "Q2 renewal terms", name: "Marcus Delaney", org: "Northwind Logistics",
    initials: "MD", av: "linear-gradient(135deg,#cfe2f7,#b6cdf0)",
    ended: "Ended 11:42 · 12 min ago", mins: 12, of: 30, mailbox: "partnerships@heartcount.com",
    note: "Drafting starts on its own the moment a transcript lands, or 30 minutes after the call ends, whichever comes first.",
    subject: "Q2 renewal terms"
  },
  {
    id: "m2", meeting: true, state: "found", tool: "Optiverse",
    title: "Intro call: engagement survey rollout", name: "Priya Raghavan", org: "Aster Health Group",
    initials: "PR", av: "linear-gradient(135deg,#f7ddc4,#f3c9ae)",
    ended: "Ended 10:15 · 38 min call", mailbox: "ellen@heartcount.com",
    summary: "Priya's team wants a 6-week pilot across two clinical sites before the group-wide rollout. Procurement needs a security questionnaire before anything is signed.",
    actions: ["You: send the security questionnaire and the two-site pilot scope", "Priya: confirm which two clinical sites by Friday", "Both: hold Aug 12 for the readout"],
    subject: "Intro call: engagement survey rollout"
  },
  {
    id: "m3", meeting: true, state: "none",
    title: "Partner enablement sync", name: "Tom Okafor", org: "Meridian Consulting",
    initials: "TO", av: "linear-gradient(135deg,#cdeadd,#a9d8c4)",
    ended: "Ended 09:30 · 25 min call", mailbox: "partnerships@heartcount.com",
    fallback: "No recording or transcript reached us. This draft is inferred from your last 10 messages with Tom: the revenue-share recap and the one-pager thread.",
    subject: "Partner enablement sync"
  }
];

MEETINGS.push({
  id: "m4", meeting: true, state: "found", tool: "Otter", pendingHours: 51,
  title: "Renewal planning: Munich rollout", name: "Hannah Weiss", org: "Braithwaite Group",
  initials: "HW", av: "linear-gradient(135deg,#cfe2f7,#b6cdf0)",
  ended: "Ended Thu 16:05 · 42 min call", mailbox: "partnerships@heartcount.com",
  summary: "Hannah wants the Munich cohort renewed early so the budget lands in this fiscal year. She flagged that her CFO will ask for the week-six engagement delta before signing.",
  actions: ["You: send the week-six delta from the Munich pilot", "Hannah: get a renewal slot on the CFO's agenda", "Both: aim to sign before the fiscal close"],
  subject: "Renewal planning: Munich rollout"
});

const MEET_DRAFTS = {
  m2: [
    { label: "Action items first", tone: "#dcf0e6", toneText: "#2b7355",
      text: "Hi Priya,\n\nGood call. Recapping what we each own:\n\n• Me: security questionnaire + two-site pilot scope, with you today\n• You: confirm the two clinical sites by Friday\n• Both: Aug 12 held for the readout\n\nOn procurement, send me their questionnaire template and I'll fill it rather than send ours.\n\nEllen" },
    { label: "Warm and short", tone: "#e8e2f8", toneText: "#54459b",
      text: "Hi Priya,\n\nReally enjoyed that, the two-site approach is the right instinct, and it's how our best rollouts have started.\n\nSecurity questionnaire and pilot scope coming your way today. All I need back is the two site names by Friday.\n\nEllen" }
  ],
  m4: [
    { label: "Sends the delta", tone: "#dcf0e6", toneText: "#2b7355",
      text: "Hi Hannah,\n\nAttaching the week-six engagement delta from the Munich pilot: participation held at 87% and the manager-support score moved 11 points.\n\nThat should be what your CFO needs. If a renewal slot opens before fiscal close, I can turn paperwork around in two days.\n\nEllen" },
    { label: "Pushes for the date", tone: "#e8e2f8", toneText: "#54459b",
      text: "Hi Hannah,\n\nFollowing up on Thursday. The week-six delta is ready whenever you want it, but the thing that actually moves this is a date with your CFO.\n\nIs there a slot before fiscal close, or should we plan for the next cycle and stop pretending otherwise?\n\nEllen" }
  ],
  m3: [
    { label: "Cautious recap", tone: "#dcf0e6", toneText: "#2b7355",
      text: "Hi Tom,\n\nGood to sync. So we're aligned, here's what I took away, correct me where I've drifted:\n\n• Tiered share: 40% year one, 25% on renewal while you're first-line support\n• You circulate the co-branded one-pager internally\n• We revisit enablement once the first two referrals land\n\nEllen" },
    { label: "Asks for their notes", tone: "#e8e2f8", toneText: "#54459b",
      text: "Hi Tom,\n\nThanks for the time. My notes are thinner than I'd like, would you send me your version of the next steps so we're working from one list?\n\nWhat I have: revised tiering agreed in principle, one-pager going internal, enablement revisited after the first two referrals.\n\nEllen" }
  ]
};

const FU_DRAFTS = {
  f1: [
    { label: "One-line bump", tone: "#dcf0e6", toneText: "#2b7355",
      text: "Hi Felix,\n\nNudging this one gently, still keen on the intro to your Nordics HR lead if the offer stands.\n\nIf it's easier, say the word and I'll send two lines you can forward as-is.\n\nEllen" },
    { label: "Gives him an out", tone: "#e8e2f8", toneText: "#54459b",
      text: "Hi Felix,\n\nFollowing up on the Nordics intro, no pressure at all if the timing is wrong or the relationship isn't warm enough to trade on.\n\nIf that's the case, just tell me and I'll go the direct route instead. Either answer is a good answer.\n\nEllen" }
  ],
  f2: [
    { label: "Asks about the review", tone: "#dcf0e6", toneText: "#2b7355",
      text: "Hi Daniel,\n\nYour leadership review was last week, did the revised tiering land, or did it raise new questions?\n\nHappy to join a 20-minute call with whoever pushed back rather than trade documents.\n\nEllen" },
    { label: "Sets a decision date", tone: "#e8e2f8", toneText: "#54459b",
      text: "Hi Daniel,\n\nChecking in on the reseller terms. I'd like to either get this signed this month or park it until Q4 so neither of us is carrying it half-open.\n\nCan you tell me which is realistic? If it's Q4 that's genuinely fine, I'll stop chasing and diary it.\n\nEllen" }
  ],
  f3: [
    { label: "Flags the closing window", tone: "#dcf0e6", toneText: "#2b7355",
      text: "Hi Renata,\n\nQuick follow-up on the pilot pricing. Our September onboarding slots close in about a week, so I wanted to flag it rather than let the date pass quietly.\n\nIf September is no longer realistic, October works too, just let me know which to hold.\n\nEllen" },
    { label: "Short and low-pressure", tone: "#e8e2f8", toneText: "#54459b",
      text: "Hi Renata,\n\nJust making sure the pricing note reached you, inboxes being inboxes.\n\nNo rush on a decision. A one-line \"still interested\" or \"not this year\" is all I need.\n\nEllen" }
  ],
  f4: [
    { label: "Names the blocker", tone: "#dcf0e6", toneText: "#2b7355",
      text: "Hi Ingrid,\n\nOne thing is holding up scoping: the two pilot stores. As soon as I have the names our team can build the rollout plan and get you a timeline.\n\nIf picking them is the hard part, I'm happy to suggest two based on what you described on the call.\n\nEllen" },
    { label: "Offers to decide for her", tone: "#e8e2f8", toneText: "#54459b",
      text: "Hi Ingrid,\n\nFollowing up on the recap. Rather than wait on the store selection, shall I propose two and you veto if they're wrong?\n\nBased on Thursday I'd suggest the two highest-turnover locations, since the baseline will be most telling there.\n\nEllen" }
  ]
};

Object.assign(DRAFTS, FU_DRAFTS, MEET_DRAFTS);

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------

// The user-chosen default mailbox — Follow-ups/Post-meeting/Sent/Dismissed
// filter to this mailbox until the user manually picks a different filter.
// Changeable in Settings via the "Set as default" action on a mailbox row.
const DEFAULT_MAILBOX = "ellen@heartcount.com";

const state = {
  view: "home",
  fuAging: false,
  w: window.innerWidth,
  drawer: false,
  scanOff: [],
  openId: null,
  backTo: null,
  drafts: {},
  mInstr: {},
  chosen: {},
  instruction: "",
  sentIds: [],
  toast: null,
  expanded: {},
  feedback: {},
  feedbackNotes: {},
  feedbackTagsMap: {},
  feedbackPopup: null,
  sections: { lowConf: true, sent: true, dismissed: true, followUp: true, meetings: true, mcp: false, vipSuggestions: true },
  dismissedIds: ["x1", "x2"],
  inboxOpen: true,
  activeMailbox: DEFAULT_MAILBOX,
  activeNav: "inbox",
  openFilter: null,
  openMoveMenu: null,
  openMailboxMenu: null,
  editingProfile: false,
  profileNameDraft: "",
  draftVoiceDraft: "",
  ownerName: "",
  ownerEmail: "",
  replyPromiseHours: 24,
  draftVoice: "",
  confirmSend: null,
  confirmRescan: false,
  scanning: false,
  scanProgress: null,
  searchOpen: false,
  searchLoading: false,
  searchQuery: "",
  searchResults: [],
  defaultMailbox: DEFAULT_MAILBOX,
  filterVals: { priority: null, mailbox: DEFAULT_MAILBOX, date: null, sender: null },
  spin: 0,
  scanned: "2 min ago",
  mcpTokenVisible: false,
  mcpToken: null,
  vips: [],
  vipsLoaded: false,
  vipInput: "",
  vipSuggestions: [],
  vipSuggestLoading: false,
  dismissedSelected: [],
  confirmDeleteDismissed: false
};

let toastTimer = null;
let vipSuggestAbort = null;

// ---------------------------------------------------------------------------
// CORE STATE HELPERS (ported 1:1 from Component methods)
// ---------------------------------------------------------------------------

function setFilter(key, val) {
  state.filterVals = Object.assign({}, state.filterVals, { [key]: state.filterVals[key] === val ? null : val });
  state.openFilter = null;
}

// Shared thumb-button styling for both Sent cards and Dismissed cards —
// same up/down highlight rule either way.
function feedbackColors(fb) {
  return {
    upBg: fb === "up" ? "#dcf0e6" : "#fff",
    upBorder: fb === "up" ? "#bde3ce" : "#eceef1",
    upColor: fb === "up" ? "#2b7355" : "#9aa1ac",
    downBg: fb === "down" ? "#fce6d8" : "#fff",
    downBorder: fb === "down" ? "#f4d0ba" : "#eceef1",
    downColor: fb === "down" ? "#a5561b" : "#9aa1ac"
  };
}

function responsive() {
  const m = (state.w || 1440) < 900;
  const open = state.drawer;
  return {
    isMobile: m, notMobile: !m,
    drawerOpen: m && open,
    asDisplay: m ? (open ? "flex" : "none") : "flex",
    asPos: m ? "fixed" : "sticky",
    asZ: m ? "90" : "1",
    asShadow: m ? "24px 0 60px -20px rgba(16,24,40,.45)" : "none",
    asWidth: m ? "278px" : "266px",
    hdPad: m ? "10px 14px 10px" : "14px 28px 12px",
    hdWrap: m ? "wrap" : "nowrap",
    searchBasis: m ? "100%" : "560px",
    searchMax: m ? "none" : "560px",
    refreshLabel: m ? "" : "Refresh",
    refreshPad: m ? "0 12px" : "0 16px",
    fltWrap: m ? "nowrap" : "wrap",
    fltOverflow: m ? "auto" : "visible",
    mainPad: m ? "18px 14px 96px" : "26px 28px 44px",
    bannerDir: m ? "column" : "row",
    draftCols: m ? "1fr" : "1fr 1fr",
    acctCols: m ? "1fr" : "1fr 1fr 1fr",
    taMin: m ? "200px" : "290px",
    h2Size: m ? "19px" : "23px",
    cardPad: m ? "15px 15px 13px" : "18px 20px 16px",
    threadSubject: m ? "16px" : "18px",
    meetCols: m ? "1fr" : "repeat(auto-fit, minmax(290px,1fr))",
    toastBottom: m ? "78px" : "26px",
    threadHeadDir: m ? "column" : "row",
    cardHeadDir: m ? "column" : "row"
  };
}

function hdrStyle(p, open) {
  const o = {};
  o[p + "HdBg"] = open ? "transparent" : "#fff";
  o[p + "HdBorder"] = open ? "1px solid transparent" : "1px solid #eff0f3";
  o[p + "HdRadius"] = open ? "0" : "18px";
  o[p + "HdPad"] = open ? "0" : "15px 18px";
  o[p + "HdShadow"] = open ? "none" : "0 1px 2px rgba(16,24,40,.04)";
  return o;
}

function toggleSection(key) {
  state.sections = Object.assign({}, state.sections, { [key]: !state.sections[key] });
}

function draftText(id, i) {
  const key = id + "-" + i;
  return state.drafts[key] !== undefined ? state.drafts[key] : DRAFTS[id][i].text;
}

function addOnce(list, id) {
  return list.indexOf(id) < 0 ? list.concat([id]) : list;
}

function openThread(id) {
  state.backTo = state.view === "thread" ? (state.backTo || "inbox") : state.view;
  state.view = "thread";
  state.openId = id;
  state.instruction = "";
  state.toast = null;
}

function flash(msg, action, actionLabel) {
  state.toast = { msg: msg, action: action || null, label: actionLabel || "Undo" };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { state.toast = null; renderAll(); }, action ? 6000 : 3200);
}

// ---------------------------------------------------------------------------
// CATEGORY MOVE (needs-reply / low-confidence / follow-up / dismissed)
// ---------------------------------------------------------------------------
// Lets Ellen manually re-sort a card between categories from a dropdown next
// to the priority pill, without dismissing it — added per her 2026-07-29
// request, then extended into real dismiss/restore (Step 6, 2026-07-29):
// "dismissed" is just another category in this same state machine, so
// dismiss/restore reuse all of this rather than needing separate logic.
// Persists via PATCH /api/threads/:id/category so a manual choice sticks
// across rescans (the scan pipeline never touches status on an
// already-classified thread, so this can't be silently overwritten).

const CATEGORY_LABELS = {
  needs_reply: "Needs reply",
  low_confidence: "Low confidence",
  manual_followup: "Follow-up",
  dismissed: "Dismissed"
};

function categoryMoveOptions(id, currentStatus) {
  return Object.keys(CATEGORY_LABELS)
    .filter(status => status !== currentStatus)
    .map(status => ({ id: id, status: status, label: CATEGORY_LABELS[status] }));
}

function findLiveItem(id) {
  return THREADS.filter(t => t.id === id)[0] || LOWCONF.filter(t => t.id === id)[0] ||
    FOLLOWUPS.filter(t => t.id === id)[0] || DISMISSED.filter(t => t.id === id)[0];
}

function removeFromAllLists(id) {
  [THREADS, LOWCONF, FOLLOWUPS, DISMISSED].forEach(list => {
    const idx = list.findIndex(t => t.id === id);
    if (idx >= 0) list.splice(idx, 1);
  });
}

// Every item pushed by applyCategoryMove below stamps a `status` field
// matching exactly where it landed, so this never has to special-case shape.
function categoryOf(item) {
  return item.status || (item.low ? "low_confidence" : "needs_reply");
}

// Pure state-surgery + persistence, no toast — shared by the initial move
// and by the undo action, so undo is just "apply the reverse move" rather
// than special-cased revert logic. Also shared by restore-from-Dismissed,
// since restoring is just "move to needs_reply/low_confidence" from here.
function applyCategoryMove(id, newStatus, item) {
  state.dismissedIds = state.dismissedIds.filter(x => x !== id);
  removeFromAllLists(id);

  if (newStatus === "dismissed") {
    state.dismissedIds = addOnce(state.dismissedIds, id);
    // Resolve the "true home" from the low_confidence flag rather than
    // carrying forward item.origin as-is — a manual-followup card has
    // origin "manual", which isn't a valid restore target on its own
    // (mirrors the low_confidence-flag logic in dashboard.ts's
    // dismissedThreads mapping, so a fresh page load agrees with this).
    const trueHome = item.low ? "low_confidence" : "needs_reply";
    DISMISSED.push(Object.assign({}, item, {
      status: "dismissed",
      origin: trueHome,
      meta: trueHome === "low_confidence" ? "low confidence" : "needed reply"
    }));
  } else if (newStatus === "manual_followup") {
    FOLLOWUPS.push(Object.assign({}, item, {
      status: "manual_followup",
      origin: "manual",
      why: item.why || item.nudge,
      nudge: item.why || item.nudge,
      sent: "Flagged just now",
      days: 0
    }));
  } else if (newStatus === "low_confidence") {
    LOWCONF.push(Object.assign({}, item, { status: "low_confidence", origin: "low_confidence", low: true }));
  } else if (newStatus === "needs_reply") {
    THREADS.push(Object.assign({}, item, { status: "needs_reply", origin: "needs_reply", low: false }));
  }

  fetch("/api/threads/" + id + "/category", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus })
  }).catch(err => {
    console.error("Failed to save category move", err);
    flash("Couldn't save that move, refresh and try again");
    renderAll();
  });
}

function moveCardCategory(id, newStatus, name) {
  const item = findLiveItem(id);
  if (!item) return;

  const previousStatus = categoryOf(item);
  const snapshot = Object.assign({}, item);

  applyCategoryMove(id, newStatus, item);

  // Gmail-style undo-send pattern: toast carries an action that reverses
  // the exact move, rather than a generic "are you sure" confirmation.
  flash((name || "This thread") + " moved to " + CATEGORY_LABELS[newStatus], () => {
    applyCategoryMove(id, previousStatus, snapshot);
    renderAll();
  });
}

// "Stop chasing" on a follow-up card — real persistence + undo, same pattern
// as moveCardCategory above, but a manual-origin item (a threads row) and a
// sent-origin item (a followups row) live in different tables with
// different ids, so each needs its own endpoint rather than reusing
// /api/threads/:id/category.
function persistFollowupStatus(item, status) {
  const url = item.origin === "manual"
    ? "/api/threads/" + item.id + "/category"
    : "/api/followups/" + item.id + "/status";
  const body = item.origin === "manual"
    ? { status: status === "dismissed" ? "dismissed" : "manual_followup" }
    : { status: status === "dismissed" ? "dismissed" : "pending" };

  fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).catch(err => {
    console.error("Failed to save follow-up status", err);
    flash("Couldn't save, refresh and try again");
    renderAll();
  });
}

// Only for sent-origin (followups-table) items — manual-origin follow-up
// cards are threads rows and go through moveCardCategory instead (see the
// "dismissFu" action case), since they persist via a different endpoint.
function dismissFollowup(id, name) {
  const idx = FOLLOWUPS.findIndex(t => t.id === id);
  if (idx < 0) return;
  const item = FOLLOWUPS[idx];

  FOLLOWUPS.splice(idx, 1);
  state.dismissedIds = addOnce(state.dismissedIds, id);
  DISMISSED.push(Object.assign({}, item, { status: "dismissed", meta: "follow-up" }));
  persistFollowupStatus(item, "dismissed");

  flash((name || "This follow-up") + " moved to Dismissed", () => {
    const dIdx = DISMISSED.findIndex(t => t.id === id);
    if (dIdx >= 0) DISMISSED.splice(dIdx, 1);
    state.dismissedIds = state.dismissedIds.filter(x => x !== id);
    FOLLOWUPS.push(item);
    persistFollowupStatus(item, "pending");
    renderAll();
  });
}

// Post-meeting "Skip this call" — its own table/id/endpoint again, same
// reasoning as persistFollowupStatus above.
function persistMeetingStatus(item, meetingState) {
  fetch("/api/meetings/" + item.id + "/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: meetingState })
  }).catch(err => {
    console.error("Failed to save meeting status", err);
    flash("Couldn't save, refresh and try again");
    renderAll();
  });
}

function dismissMeeting(id, name) {
  const idx = MEETINGS.findIndex(t => t.id === id);
  if (idx < 0) return;
  const item = MEETINGS[idx];
  const previousState = item.state;

  MEETINGS.splice(idx, 1);
  state.dismissedIds = addOnce(state.dismissedIds, id);
  DISMISSED.push(Object.assign({}, item, { status: "dismissed", restoreState: previousState, meta: "post-meeting" }));
  persistMeetingStatus(item, "dismissed");

  flash((name || "This meeting") + " moved to Dismissed", () => {
    const dIdx = DISMISSED.findIndex(t => t.id === id);
    if (dIdx >= 0) DISMISSED.splice(dIdx, 1);
    state.dismissedIds = state.dismissedIds.filter(x => x !== id);
    MEETINGS.push(item);
    persistMeetingStatus(item, previousState);
    renderAll();
  });
}

// Dismissed-tab restore: threads-based items (needs-reply/low-confidence/
// manual-followup, all pre-dismiss) go back through moveCardCategory using
// the "true home" bucket dashboard.ts resolved from low_confidence; sent
// follow-ups and meetings each restore via their own endpoint instead.
function restoreFromDismissed(id, name) {
  const item = DISMISSED.filter(t => t.id === id)[0];
  if (!item) return;

  if (item.origin === "sent") {
    const idx = DISMISSED.findIndex(t => t.id === id);
    if (idx >= 0) DISMISSED.splice(idx, 1);
    state.dismissedIds = state.dismissedIds.filter(x => x !== id);
    FOLLOWUPS.push(item);
    persistFollowupStatus(item, "pending");
    flash((name || "This follow-up") + " restored", () => dismissFollowup(id, name));
    renderAll();
  } else if (item.origin === "meeting") {
    const idx = DISMISSED.findIndex(t => t.id === id);
    if (idx >= 0) DISMISSED.splice(idx, 1);
    state.dismissedIds = state.dismissedIds.filter(x => x !== id);
    const restored = Object.assign({}, item, { state: item.restoreState || "waiting" });
    MEETINGS.push(restored);
    persistMeetingStatus(item, restored.state);
    flash((name || "This meeting") + " restored", () => dismissMeeting(id, name));
    renderAll();
  } else {
    moveCardCategory(id, item.origin, name);
  }
}

// ---------------------------------------------------------------------------
// REAL SEND (Gmail API) — confirm dialog, then a delayed-send undo window
// ---------------------------------------------------------------------------

function removeFromLiveLists(id) {
  [THREADS, LOWCONF, FOLLOWUPS, MEETINGS].forEach(list => {
    const idx = list.findIndex(t => t.id === id);
    if (idx >= 0) list.splice(idx, 1);
  });
}

// Fires 6 seconds after confirmation (matching the toast's own undo-window
// duration in flash()) — an email can't be "unsent" via the Gmail API once
// it's actually transmitted, so Undo has to cancel the API call before it
// happens, not reverse it after. The card stays visible in its original
// list for the whole window; it's only removed once the send actually goes
// through.
function startDelayedSend(payload) {
  let cancelled = false;

  const timer = setTimeout(() => {
    if (cancelled) return;
    fetch(payload.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: payload.text, origin: payload.origin })
    }).then(async (res) => {
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Send failed");
      }
      return res.json();
    }).then((data) => {
      removeFromLiveLists(payload.id);
      SENT.push({
        id: data.sentId || payload.id,
        name: payload.name,
        org: payload.org || "",
        initials: payload.initials || "?",
        av: payload.av || "linear-gradient(135deg,#cfe2f7,#b6cdf0)",
        subject: payload.subject || "",
        mailbox: payload.mailbox || "",
        time: "sent just now",
        origin: payload.origin,
        body: payload.text,
        feedback: null,
        feedbackNote: ""
      });
      flash("Sent to " + (payload.name || "recipient"));
      renderAll();
    }).catch(err => {
      console.error("Failed to send", err);
      flash("Couldn't send: " + err.message);
      renderAll();
    });
  }, 6000);

  flash("Sending to " + (payload.name || "recipient") + "…", () => {
    cancelled = true;
    clearTimeout(timer);
    flash("Send cancelled");
    renderAll();
  }, "Undo");
  renderAll();
}

// ---------------------------------------------------------------------------
// VIEW-MODEL BUILDERS (ported 1:1 from Component methods)
// ---------------------------------------------------------------------------

function meetVals(m) {
  const s = state;
  const chosen = s.chosen[m.id] === undefined ? 0 : s.chosen[m.id];
  const instr = s.mInstr[m.id] || "";
  const o = {
    id: m.id, title: m.title, name: m.name, org: m.org, initials: m.initials, av: m.av,
    ended: m.ended,
    isWaiting: m.state === "waiting",
    hasDrafts: m.state !== "waiting",
    note: m.note || "", summary: m.summary || "", fallback: m.fallback || "",
    // "Drafted... check the recap below" is only true once a transcript or
    // fallback draft actually exists — showing it for a still-waiting
    // meeting implied a recap existed when the card had nothing below it yet.
    lead: m.summary || m.note || (m.state === "waiting"
      ? "Waiting to see if a transcript arrives before drafting a follow-up with " + m.name.split(" ")[0] + "."
      : "Drafted from your message history with " + m.name.split(" ")[0] + ", check the recap below before sending."),
    actions: (m.actions || []).map(a => ({ text: a })),
    hasActions: !!m.actions,
    isFallback: m.state === "none",
    pill: m.state === "waiting"
      ? "Waiting for transcript · " + m.mins + " of " + m.of + " min"
      : (m.state === "found" ? "Summary · via " + m.tool : "No transcript found · drafted from recent conversation history"),
    pillBg: m.state === "waiting" ? "#dce9fb" : (m.state === "found" ? "#e8e2f8" : "#f6ecd9"),
    pillColor: m.state === "waiting" ? "#0b6fb8" : (m.state === "found" ? "#54459b" : "#8a6a24"),
    pillIcon: m.state === "waiting" ? "ti-hourglass-low" : (m.state === "found" ? "ti-file-text" : "ti-file-alert"),
    progress: m.state === "waiting" ? Math.round((m.mins / m.of) * 100) + "%" : "0%",
    pending: (m.pendingHours || 0) >= 48 && m.state !== "waiting",
    pendingPill: "Still pending · " + Math.round((m.pendingHours || 0) / 24) + " days",
    instruction: instr,
    open: !!s.expanded["mt-" + m.id],
    toggleLabel: s.expanded["mt-" + m.id] ? "Hide details" : (m.state === "waiting" ? "Why it's waiting" : "View call notes"),
    toggleIcon: s.expanded["mt-" + m.id] ? "ti-chevron-up" : "ti-chevron-down"
  };
  o.options = (DRAFTS[m.id] || []).map((d, i) => ({
    letter: i === 0 ? "A" : "B", label: d.label, tone: d.tone, toneText: d.toneText,
    value: draftText(m.id, i),
    picked: chosen === i,
    border: chosen === i ? "#0b8ee8" : "#eff0f3",
    pickIcon: chosen === i ? "ti-circle-check-filled" : "ti-circle",
    pickColor: chosen === i ? "#0b8ee8" : "#a7adb8",
    pickLabel: chosen === i ? "Selected" : "Select"
  }));
  return o;
}

function fuVals(t) {
  const open = !!state.expanded["fu-" + t.id];
  // "manual" = an inbox thread Ellen moved here herself via the category
  // dropdown (see moveCardCategory) — different concept from "sent" (a
  // message she sent that hasn't gotten a reply), so it gets its own pill
  // and expanded-view treatment instead of a fake day count.
  const isManual = t.origin === "manual";
  return {
    id: t.id, name: t.name, org: t.org, initials: t.initials, av: t.av,
    subject: t.subject, snippet: t.snippet, body: t.body, nudge: t.nudge,
    sent: t.sent, mailbox: t.mailbox,
    isManual: isManual,
    pill: isManual ? "You flagged this" : "No reply · " + t.days + " business days",
    pillBg: isManual ? "#eef0f4" : (t.days >= 5 ? "#fce6d8" : "#dce9fb"),
    pillColor: isManual ? "#5d6470" : (t.days >= 5 ? "#a5561b" : "#0b6fb8"),
    pillDot: isManual ? "#9aa1ac" : (t.days >= 5 ? "#e8801f" : "#0b8ee8"),
    aging: !isManual && t.days >= 5,
    moveOptions: isManual ? categoryMoveOptions(t.id, "manual_followup") : null,
    open: open,
    toggleLabel: open ? "Hide follow-up options" : "View follow-up options",
    toggleIcon: open ? "ti-chevron-up" : "ti-chevron-down"
  };
}

function cardVals(t) {
  const tier = TIERS[t.tier];
  const open = !!state.expanded[t.id];
  const currentStatus = t.origin || (t.low ? "low_confidence" : "needs_reply");
  return {
    id: t.id, name: t.name, org: t.org, initials: t.initials, av: t.av,
    subject: t.subject, snippet: t.snippet, mailbox: t.mailbox, time: t.time,
    body: t.body, why: t.why, waited: "waiting " + t.waited,
    tierLabel: tier.label, tierBg: tier.bg, tierColor: tier.color, tierDot: tier.dot,
    open: open,
    toggleLabel: open ? "Hide email" : "View email",
    toggleIcon: open ? "ti-eye-off" : "ti-eye",
    draftLabel: t.low ? "Draft with caution" : "2 drafts ready",
    draftBg: t.low ? "#e8e2f8" : "#dce9fb",
    draftIconColor: t.low ? "#8b7fd4" : "#0b8ee8",
    draftIcon: t.low ? "ti-help-circle" : "ti-sparkles",
    cta: t.low ? "Add context & draft" : "Review drafts",
    moveOpen: state.openMoveMenu === t.id,
    moveOptions: categoryMoveOptions(t.id, currentStatus)
  };
}

function renderVals() {
  const s = state;
  const gone = id => s.dismissedIds.indexOf(id) >= 0 || s.sentIds.indexOf(id) >= 0;
  const mbF = s.filterVals.mailbox;
  const prF = s.filterVals.priority;
  const live = t => !gone(t.id) && (!mbF || t.mailbox === mbF);
  const liveT = t => live(t) && (!prF || TIERS[t.tier].label === prF);
  const liveFu = t => live(t) && (!s.fuAging || t.days >= 5);
  const hrs = w => (w.slice(-1) === "d" ? parseInt(w, 10) * 24 : parseInt(w, 10));
  const ALL = THREADS.concat(LOWCONF).concat(FOLLOWUPS).concat(MEETINGS);
  const cur = ALL.filter(t => t.id === s.openId)[0];

  let thread = null;
  if (cur) {
    const chosen = s.chosen[cur.id] === undefined ? 0 : s.chosen[cur.id];
    const fu = !!cur.days;
    const mtg = !!cur.meeting;
    const tier = (fu || mtg) ? null : TIERS[cur.tier];
    const mPill = mtg
      ? (cur.tool
          ? { label: "Summary · via " + cur.tool, bg: "#e8e2f8", color: "#54459b", dot: "#8b7fd4" }
          : { label: "No transcript found", bg: "#f6ecd9", color: "#8a6a24", dot: "#c9932a" })
      : null;
    thread = {
      id: cur.id, name: cur.name, org: cur.org, initials: cur.initials, av: cur.av,
      subject: cur.subject, mailbox: cur.mailbox, time: cur.time, body: cur.body || "",
      why: mtg
        ? (cur.tool ? "The draft covers every action item from the call." : "Inferred context, read it before sending.")
        : (fu ? cur.nudge : cur.why),
      whyIcon: mtg ? (cur.tool ? "ti-list-check" : "ti-history") : (fu ? "ti-bulb" : "ti-target-arrow"),
      isFu: fu,
      isMeeting: mtg,
      notMeeting: !mtg,
      mSummary: cur.summary || "",
      mActions: (cur.actions || []).map(a => ({ text: a })),
      hasMActions: !!cur.actions,
      mFallback: cur.fallback || "",
      isMFallback: mtg && !cur.tool,
      ctxBadge: mtg
        ? (cur.tool ? "Transcript summary · via " + cur.tool : "No transcript found · inferred from recent conversation history")
        : (fu ? "Following up on: sent with no reply" : "Their message"),
      ctxIcon: mtg ? (cur.tool ? "ti-file-text" : "ti-file-alert") : (fu ? "ti-send" : "ti-mail-opened"),
      metaLine: mtg
        ? cur.ended
        : (fu
          ? cur.sent + " from " + cur.mailbox + " · no reply in " + cur.days + " business days"
          : cur.time + " · to " + cur.mailbox),
      heading: mtg ? "Choose a follow-up note, then edit it" : (fu ? "Choose a nudge, then edit it" : "Choose a reply, then edit it"),
      subhead: fu ? "Nothing sends until you press Send" : "Nothing sends until you press Send",
      sendLabel: mtg ? "Send follow-up note" : (fu ? "Send follow-up" : "Send reply"),
      instrPlaceholder: mtg
        ? "Describe a different note: “shorter, confirm the Aug 12 readout only”"
        : (fu
          ? "Describe a different nudge: “warmer, mention the October slot, two lines max”"
          : "Describe a different reply: “shorter, push the call to next week, no pricing”"),
      dismissLabel: mtg ? "Skip this call · reversible" : (fu ? "Stop chasing · reversible" : "Not interested · reversible"),
      tierLabel: mtg ? mPill.label : (fu ? "No reply · " + cur.days + " business days" : tier.label),
      tierBg: mtg ? mPill.bg : (fu ? "#dce9fb" : tier.bg),
      tierColor: mtg ? mPill.color : (fu ? "#0b6fb8" : tier.color),
      tierDot: mtg ? mPill.dot : (fu ? "#0b8ee8" : tier.dot),
      chosenLabel: DRAFTS[cur.id][chosen].label,
      options: DRAFTS[cur.id].map((d, i) => ({
        i: i, letter: i === 0 ? "A" : "B", label: d.label, tone: d.tone, toneText: d.toneText,
        value: draftText(cur.id, i),
        words: String(draftText(cur.id, i).trim().split(/\s+/).length) + " words",
        picked: chosen === i,
        border: chosen === i ? "#0b8ee8" : "#eff0f3",
        ring: chosen === i ? "0 0 0 3px rgba(11,142,232,.12),0 10px 26px -18px rgba(16,24,40,.16)" : "0 1px 2px rgba(16,24,40,.04)",
        pickLabel: chosen === i ? "Selected to send" : "Select this draft",
        pickIcon: chosen === i ? "ti-circle-check-filled" : "ti-circle",
        pickColor: chosen === i ? "#0b8ee8" : "#a7adb8"
      }))
    };
  }

  const defs = [
    { key: "priority", icon: "ti-flag", label: "Priority", opts: [
      { label: "Reply today", dot: "#e8801f" },
      { label: "This week", dot: "#8b7fd4" },
      { label: "FYI only", dot: "#7fc4a8" }
    ]},
    { key: "mailbox", icon: "ti-at", label: "Mailbox", opts: MAILBOXES.map(m => ({ label: m.address, dot: m.dot })) },
    { key: "date", icon: "ti-calendar", label: "Date range", opts: [
      { label: "Last 24 hours", dot: "#9cc7ee" },
      { label: "Last 7 days", dot: "#9cc7ee" },
      { label: "Last 30 days", dot: "#9cc7ee" }
    ]},
    { key: "sender", icon: "ti-user", label: "Sender", opts: [
      { label: "Marcus Delaney", dot: "#c9b8ea" },
      { label: "Priya Raghavan", dot: "#f3c9ae" },
      { label: "Tom Okafor", dot: "#a9d8c4" }
    ]}
  ];

  const out = {
    inboxOpen: s.inboxOpen,
    inboxChevron: s.inboxOpen ? "ti-chevron-up" : "ti-chevron-down",
    totalUnread: MAILBOXES.reduce((a, m) => a + m.count, 0),
    lastScanned: s.scanned,
    scanning: s.scanning,
    scanProgress: s.scanProgress,
    scanSteps: !s.scanProgress ? [] : (() => {
      const { done, total } = s.scanProgress;
      const steps = [];
      for (let i = 0; i < total; i++) {
        const label = (MAILBOXES[i] && MAILBOXES[i].address) || `Mailbox ${i + 1}`;
        steps.push({ label, status: i < done ? "done" : i === done ? "active" : "pending" });
      }
      return steps;
    })(),
    searchOpen: s.searchOpen,
    searchLoading: s.searchLoading,
    searchQuery: s.searchQuery,
    searchResults: s.searchResults,
    confirmRescan: s.confirmRescan,
    spin: s.spin,

    navItems: [
      { key: "meetings", icon: "ti-microphone-2", label: "Post meeting", meta: String(MEETINGS.filter(live).length),
        badge: MEETINGS.filter(m => live(m) && (m.pendingHours || 0) >= 48 && m.state !== "waiting").length },
      { key: "sent", icon: "ti-send", label: "Sent",
        meta: String(SENT.filter(m => !mbF || m.mailbox === mbF).length
          + s.sentIds.filter(id => { const t = ALL.filter(x => x.id === id)[0]; return t && (!mbF || t.mailbox === mbF); }).length) },
      { key: "dismissed", icon: "ti-archive", label: "Dismissed",
        meta: String(DISMISSED.filter(d => !mbF || d.mailbox === mbF).length) },
      { key: "settings", icon: "ti-settings", label: "Settings", meta: "" }
    ].map(n => {
      const on = s.view === n.key;
      return Object.assign({}, n, {
        hasBadge: !!n.badge,
        badge: String(n.badge || ""),
        bg: on ? "#f4f6f8" : "transparent",
        color: on ? "#13161c" : "#40464f",
        iconColor: on ? "#0b8ee8" : "#9aa1ac"
      });
    }),

    isSettings: s.view === "settings",
    inboxBg: s.view === "inbox" ? "#f4f6f8" : "transparent",
    inboxIconColor: s.view === "inbox" ? "#0b8ee8" : "#9aa1ac",
    scanToggles: MAILBOXES.map(m => {
      const st = MB_STATE[m.state];
      const on = s.scanOff.indexOf(m.address) < 0;
      return {
        id: m.id, address: m.address, role: m.role, sync: m.sync, dot: m.dot,
        initial: m.address.slice(0, 1).toUpperCase(),
        stLabel: st.label, stBg: st.bg, stColor: st.color, stIcon: st.icon,
        needsFix: m.state === "reauth",
        on: on,
        switchBg: on ? "#13161c" : "#e1e4e9",
        knobLeft: on ? "17px" : "3px",
        switchLabel: on ? "Scanning" : "Paused",
        isDefault: m.address === s.defaultMailbox,
        menuOpen: s.openMailboxMenu === m.id
      };
    }),
    mailboxTotal: MAILBOXES.length,
    ownerName: s.ownerName || "Your name",
    ownerEmail: s.ownerEmail,
    ownerInitials: (s.ownerName || s.ownerEmail || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase(),
    editingProfile: s.editingProfile,
    profileNameDraft: s.profileNameDraft,
    replyPromiseHours: s.replyPromiseHours,
    draftVoice: s.draftVoice,
    draftVoiceDraft: s.draftVoiceDraft,
    vips: s.vips,
    vipInput: s.vipInput,
    vipSuggestions: s.vipSuggestions,
    vipSuggestLoading: s.vipSuggestLoading,
    vipSuggestOpen: s.sections.vipSuggestions,
    vipSuggestChevron: s.sections.vipSuggestions ? "ti-chevron-up" : "ti-chevron-down",

    filters: defs.filter(d => d.key !== "priority" || s.view === "inbox").map(d => {
      const val = s.filterVals[d.key];
      return {
        key: d.key,
        label: val || d.label,
        icon: d.icon,
        open: s.openFilter === d.key,
        bg: val ? "#f1f7fd" : "#fff",
        border: val ? "#bfdcf6" : "#eceef1",
        color: val ? "#0b6fb8" : "#40464f",
        iconColor: val ? "#0b8ee8" : "#9aa1ac",
        options: d.opts.map(o => ({
          label: o.label,
          dot: o.dot,
          bg: val === o.label ? "#f5f7f9" : "transparent",
          check: val === o.label ? "ti-check" : "ti-blank"
        }))
      };
    }),
    followTotal: String(
      THREADS.filter(liveT).length + LOWCONF.filter(liveT).length + FOLLOWUPS.filter(liveFu).length
    ),

    isHome: s.view === "home",
    showFilters: s.view !== "home" && s.view !== "settings",
    scopeLabel: s.filterVals.mailbox || "All mailboxes",
    scopeNote: s.filterVals.mailbox ? "Counts below are for this mailbox" : "Counts below span every mailbox",
    isTab: s.view !== "thread" && s.view !== "settings" && s.view !== "home",
    homeBg: s.view === "home" ? "#f4f6f8" : "transparent",
    homeIconColor: s.view === "home" ? "#0b8ee8" : "#9aa1ac",
    homeGreeting: "Here's where every mailbox stands",
    summaryCards: (() => {
      const need = THREADS.filter(t => !gone(t.id));
      const today = need.filter(t => t.tier === "today");
      const lowConf = LOWCONF.filter(t => !gone(t.id));
      const calls = MEETINGS.filter(m => !gone(m.id));
      const allFu = FOLLOWUPS.filter(t => !gone(t.id));
      const older = allFu.filter(t => t.days >= 5);
      // Low confidence had no tile at all, and "Older follow-ups" only ever
      // showed the aged subset — together that made the sidebar's combined
      // "Follow ups" badge (needs-reply + low-confidence + all follow-ups)
      // impossible to reconcile from Home alone (confirmed via user
      // feedback 2026-08-02: e.g. sidebar showed 26 with no way to see
      // where the other 12 came from). Low confidence gets its own tile,
      // and Older follow-ups now states the total it's a subset of.
      const cardDefs = [
        { k: "need", n: need.length, label: "Needs reply", sub: "drafted and waiting", icon: "ti-bolt", bg: "#dce9fb", fg: "#0b6fb8",
          go: "home-need" },
        { k: "today", n: today.length, label: "Reply today", sub: "inside the promise window", icon: "ti-flame", bg: "#fce6d8", fg: "#a5561b",
          go: "home-today" },
        { k: "lowconf", n: lowConf.length, label: "Low confidence", sub: "needs a judgment call", icon: "ti-help-circle", bg: "#e8e2f8", fg: "#8b7fd4",
          go: "home-lowconf" },
        { k: "calls", n: calls.length,
          label: "Post-meeting",
          sub: calls.filter(m => (m.pendingHours || 0) >= 48 && m.state !== "waiting").length
            ? calls.filter(m => (m.pendingHours || 0) >= 48 && m.state !== "waiting").length + " still pending 48h+"
            : "notes to send",
          icon: "ti-microphone-2", bg: "#e8e2f8", fg: "#54459b",
          go: "home-calls" },
        { k: "older", n: older.length, label: "Older follow-ups", sub: "5+ business days, no reply (of " + allFu.length + " total)", icon: "ti-clock-exclamation", bg: "#f6ecd9", fg: "#8a6a24",
          go: "home-older" },
        { k: "sent", n: SENT.length + s.sentIds.length, label: "Sent", sub: "rate the drafts", icon: "ti-send", bg: "#dcf0e6", fg: "#2b7355",
          go: "home-sent" },
        { k: "dismissed", n: s.dismissedIds.length, label: "Dismissed", sub: "restore any time", icon: "ti-archive", bg: "#f1f2f5", fg: "#5d6470",
          go: "home-dismissed" }
      ];
      return cardDefs.map(d => Object.assign({}, d, { n: String(d.n) }));
    })(),
    mailboxRows: MAILBOXES.map(m => {
      const need = THREADS.filter(t => !gone(t.id) && t.mailbox === m.address);
      const mbFu = FOLLOWUPS.filter(x => !gone(x.id) && x.mailbox === m.address);
      const stats = [
        { label: "Needs reply", n: need.length, fg: "#0b6fb8", bg: "#dce9fb", go: "mb-need", mailbox: m.address },
        { label: "Reply today", n: need.filter(t => t.tier === "today").length, fg: "#a5561b", bg: "#fce6d8", go: "mb-today", mailbox: m.address },
        { label: "Low confidence", n: LOWCONF.filter(x => !gone(x.id) && x.mailbox === m.address).length, fg: "#8b7fd4", bg: "#e8e2f8", go: "mb-lowconf", mailbox: m.address },
        { label: "Post-meeting", n: MEETINGS.filter(x => !gone(x.id) && x.mailbox === m.address).length, fg: "#54459b", bg: "#e8e2f8", go: "mb-calls", mailbox: m.address },
        { label: "Older follow-ups", n: mbFu.filter(x => x.days >= 5).length, fg: "#8a6a24", bg: "#f6ecd9", go: "mb-older", mailbox: m.address }
      ];
      // Matches the sidebar's combined "Follow ups" badge formula exactly
      // (needs-reply + low-confidence + all follow-ups) so this card's
      // total is reconcilable against it — previously excluded low
      // confidence entirely and only counted the aged subset of follow-ups.
      const total = stats[0].n + stats[2].n + stats[3].n + mbFu.length;
      return {
        address: m.address, dot: m.dot, initial: m.address.slice(0, 1).toUpperCase(),
        role: m.role,
        totalLabel: total === 0 ? "All clear" : total + " open",
        totalBg: total === 0 ? "#dcf0e6" : "#f4f6f8",
        totalColor: total === 0 ? "#2b7355" : "#40464f",
        stats: stats.map(x => Object.assign({}, x, {
          n: String(x.n),
          fg: x.n === 0 ? "#a7adb8" : x.fg,
          bg: x.n === 0 ? "#f7f8fa" : x.bg
        }))
      };
    }),
    isInbox: s.view === "inbox",
    isMeetings: s.view === "meetings",
    isFollowups: s.view === "followups",
    isSentTab: s.view === "sent",
    isDismissedTab: s.view === "dismissed",
    isThread: s.view === "thread" && !!thread,
    thread: thread,
    backLabel: s.backTo === "meetings" ? "Back to post-meeting follow-ups"
      : s.backTo === "followups" ? "Back to follow-ups"
      : s.backTo === "sent" ? "Back to sent"
      : s.backTo === "dismissed" ? "Back to dismissed"
      : "Back to follow-ups",
    toast: s.toast ? s.toast.msg : "",
    hasToast: !!s.toast,
    hasToastAction: !!(s.toast && s.toast.action),
    toastActionLabel: s.toast ? s.toast.label : "Undo",

    needsReply: THREADS.filter(liveT).map(t => cardVals(t)),
    needsCount: THREADS.filter(liveT).length,
    needsBadge: THREADS.filter(liveT).length === 0 ? "Queue clear" : THREADS.filter(liveT).length + " drafted and waiting",
    needsEmpty: THREADS.filter(liveT).length === 0,
    lowEmpty: LOWCONF.filter(liveT).length === 0,
    lowBadge: LOWCONF.filter(liveT).length === 0 ? "Nothing ambiguous right now" : LOWCONF.filter(liveT).length + " need context from you",
    bannerIcon: THREADS.filter(t => t.tier === "today" && !gone(t.id)).length === 0 ? "ti-circle-check" : "ti-alert-triangle",
    bannerIconColor: THREADS.filter(t => t.tier === "today" && !gone(t.id)).length === 0 ? "#3fb27f" : "#e8801f",
    overdueLine: (function () {
      const od = THREADS.filter(t => t.tier === "today" && liveT(t));
      if (od.length === 0) return "Every promise-window thread is answered";
      return od.length === 1
        ? "1 partner thread is past your 24-hour promise"
        : od.length + " partner threads are past your 24-hour promise";
    })(),
    overdueBody: (function () {
      const open = THREADS.filter(liveT);
      if (open.length === 0) return "Nothing is waiting on you. Drafts will appear here as new partner mail arrives.";
      const oldest = open.slice().sort((a, b) => hrs(b.waited) - hrs(a.waited))[0];
      return oldest.name.split(" ")[0] + " at " + oldest.org + " has been waiting " + oldest.waited + ". Drafts are ready for every thread below, review, edit, send.";
    })(),
    hasOpen: THREADS.filter(liveT).length > 0,

    meetings: MEETINGS.filter(live).map(m => meetVals(m)),
    meetCount: MEETINGS.filter(live).length,
    hasMeetings: MEETINGS.filter(live).length > 0,
    meetEmpty: MEETINGS.filter(live).length === 0,
    meetBadge: MEETINGS.filter(live).length === 1
      ? "1 call to follow up"
      : MEETINGS.filter(live).length + " calls to follow up",
    mtgOpen: s.sections.meetings,
    mtgChevron: s.sections.meetings ? "ti-chevron-up" : "ti-chevron-down",
    mtgToggleLabel: s.sections.meetings ? "Collapse" : "Expand",
    ...hdrStyle("mtg", s.sections.meetings),

    followUps: FOLLOWUPS.filter(liveFu).map(t => fuVals(t)),
    fuEmpty: FOLLOWUPS.filter(liveFu).length === 0,
    fuBadge: FOLLOWUPS.filter(liveFu).length === 0
      ? "Every sent thread got an answer"
      : FOLLOWUPS.filter(liveFu).length + " sent, still no reply",
    fuAging: s.fuAging,
    fuOpen: s.sections.followUp,
    fuChevron: s.sections.followUp ? "ti-chevron-up" : "ti-chevron-down",
    fuToggleLabel: s.sections.followUp ? "Collapse" : "Expand",
    ...hdrStyle("fu", s.sections.followUp),
    ...hdrStyle("low", s.sections.lowConf),
    ...hdrStyle("snt", s.sections.sent),
    ...hdrStyle("dsm", s.sections.dismissed),
    lowToggleLabel: s.sections.lowConf ? "Collapse" : "Expand",
    sentToggleLabel: s.sections.sent ? "Collapse" : "Expand",
    dismissedToggleLabel: s.sections.dismissed ? "Collapse" : "Expand",

    lowConf: LOWCONF.filter(liveT).map(t => cardVals(t)),
    lowCount: LOWCONF.filter(liveT).length,
    lowOpen: s.sections.lowConf,
    lowChevron: s.sections.lowConf ? "ti-chevron-up" : "ti-chevron-down",

    sentOpen: s.sections.sent,
    sentChevron: s.sections.sent ? "ti-chevron-up" : "ti-chevron-down",

    mcpOpen: s.sections.mcp,
    mcpChevron: s.sections.mcp ? "ti-chevron-up" : "ti-chevron-down",
    sentCount: SENT.filter(m => !mbF || m.mailbox === mbF).length
      + s.sentIds.filter(id => { const t = ALL.filter(x => x.id === id)[0]; return t && (!mbF || t.mailbox === mbF); }).length,
    sent: s.sentIds.filter(id => { const t = ALL.filter(x => x.id === id)[0]; return t && (!mbF || t.mailbox === mbF); }).map(id => {
      const t = ALL.filter(x => x.id === id)[0];
      return { id: id, name: t.name, org: t.org, initials: t.initials, av: t.av,
        subject: (t.days ? "Follow-up: " : (t.meeting ? "Post-meeting: " : (/^re:\s/i.test(t.subject) ? "" : "Re: "))) + t.subject,
        time: "sent just now",
        origin: "reviewed by you · option " + ((s.chosen[id] || 0) === 1 ? "B" : "A"),
        body: draftText(id, s.chosen[id] || 0) };
    }).concat(SENT.filter(m => !mbF || m.mailbox === mbF)).map(m => {
      const open = !!s.expanded["sent-" + m.id];
      // Falls back to the server-persisted value so a rating survives a
      // reload instead of only reflecting clicks made this session.
      const fb = s.feedback[m.id] !== undefined ? s.feedback[m.id] : (m.feedback || null);
      return {
        id: m.id, name: m.name, org: m.org, initials: m.initials, av: m.av,
        subject: m.subject, time: m.time, origin: m.origin, body: m.body,
        open: open,
        toggleIcon: open ? "ti-eye-off" : "ti-eye",
        ...feedbackColors(fb)
      };
    }),

    dismissedOpen: s.sections.dismissed,
    dismissedChevron: s.sections.dismissed ? "ti-chevron-up" : "ti-chevron-down",
    dismissedCount: DISMISSED.filter(d => !mbF || d.mailbox === mbF).length,
    hasDismissed: DISMISSED.length > 0,
    noDismissed: DISMISSED.filter(d => !mbF || d.mailbox === mbF).length === 0,
    dismissedSelectedCount: s.dismissedSelected.length,
    dismissedAllSelected: DISMISSED.filter(d => !mbF || d.mailbox === mbF).length > 0 &&
      DISMISSED.filter(d => !mbF || d.mailbox === mbF).every(d => s.dismissedSelected.indexOf(d.id) >= 0),
    confirmDeleteDismissed: s.confirmDeleteDismissed,
    dismissed: DISMISSED.filter(d => !mbF || d.mailbox === mbF).map(d => {
      // Dismissed items merge threads (origin needs_reply/low_confidence),
      // sent-follow-ups (origin "sent"), and meetings (origin "meeting") —
      // origin already discriminates which feedback route each one needs.
      const kind = d.origin === "sent" ? "followup" : d.origin === "meeting" ? "meeting" : "thread";
      const fb = s.feedback[d.id] !== undefined ? s.feedback[d.id] : (d.feedback || null);
      return {
        id: d.id, name: d.name, subject: d.subject, meta: d.meta || "dismissed",
        kind: kind,
        selected: s.dismissedSelected.indexOf(d.id) >= 0,
        ...feedbackColors(fb)
      };
    }),

    bottomNav: [
      { key: "home", icon: "ti-layout-grid", label: "Inbox" },
      { key: "inbox", icon: "ti-inbox", label: "Follow-ups" },
      { key: "meetings", icon: "ti-microphone-2", label: "Calls" },
      { key: "sent", icon: "ti-send", label: "Sent" },
      { key: "settings", icon: "ti-settings", label: "Settings" }
    ].map(n => {
      const on = s.view === n.key;
      return {
        key: n.key, icon: n.icon, label: n.label,
        color: on ? "#0b8ee8" : "#a7adb8",
        weight: on ? "700" : "600"
      };
    }),

    ...responsive()
  };

  return out;
}

// ---------------------------------------------------------------------------
// SMALL DOM HELPERS
// ---------------------------------------------------------------------------

function esc(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Some emails (long transcript exports, forwarded threads with tracking-pixel
// URLs) run to many thousands of characters — showing all of it inline made
// a card unreadably long. Cap the inline preview; "Open in Gmail" already
// covers reading the full thing.
const BODY_PREVIEW_LIMIT = 2000;

function nl2body(str) {
  // used inside <p style="white-space:pre-wrap"> so we can just escape
  const text = str || "";
  if (text.length <= BODY_PREVIEW_LIMIT) return esc(text);
  return esc(text.slice(0, BODY_PREVIEW_LIMIT).trimEnd()) +
    '<span style="color:#9aa1ac"> … (truncated, open in Gmail for the full message)</span>';
}

function avatar(av, initials, size) {
  return `<div style="width:${size}px;height:${size}px;flex:none;border-radius:999px;background:${av};display:flex;align-items:center;justify-content:center;font-size:${size <= 32 ? 11.5 : 13}px;font-weight:700;color:#3c4a5c">${esc(initials)}</div>`;
}

// ---------------------------------------------------------------------------
// APP SHELL (built once; top-level screens stay permanently mounted)
// ---------------------------------------------------------------------------

const root = document.getElementById("app");

root.innerHTML = `
<div id="drawerScrim" class="drawer-scrim hidden" data-action="closeDrawer"></div>

<aside id="sidebar">
  <div style="padding:22px 20px 16px;display:flex;align-items:center;gap:10px">
    <div style="width:34px;height:34px;flex:none;border-radius:11px;background:linear-gradient(135deg,#0b8ee8 0%,#7f9ec4 52%,#f08a20 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px -3px rgba(11,142,232,.45)">
      <i class="ti ti-heart-filled" style="font-size:17px;color:#fff"></i>
    </div>
    <div style="line-height:1.05">
      <div style="font-size:14.5px;font-weight:800;letter-spacing:-.2px">FollowUp</div>
      <div style="font-size:11px;font-weight:600;color:#9aa1ac;letter-spacing:.02em">OS</div>
    </div>
    <button id="closeDrawerBtn" data-action="closeDrawer" aria-label="Close menu" class="hidden hover-close-drawer" style="margin-left:auto;width:34px;height:34px;flex:none;display:flex;align-items:center;justify-content:center;border:1px solid #eceef1;border-radius:11px;background:#fff;cursor:pointer">
      <i class="ti ti-x" style="font-size:17px;color:#40464f"></i>
    </button>
  </div>

  <div style="padding:2px 20px 12px">
    <div style="display:flex;align-items:center;gap:7px;background:#f4f6f8;border-radius:11px;padding:8px 10px">
      <i class="ti ti-at" style="font-size:14px;color:#0b8ee8;flex:none"></i>
      <div style="min-width:0">
        <div id="scopeLabel" style="font-size:11.5px;font-weight:700;color:#13161c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></div>
        <div id="scopeNote" style="font-size:10px;font-weight:600;color:#9aa1ac;line-height:1.3"></div>
      </div>
    </div>
  </div>

  <nav data-role="sidebar-nav" style="padding:6px 12px;display:flex;flex-direction:column;gap:2px;flex:1;min-height:0;overflow-y:auto">
    <button data-action="goHome" style="display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border:0;border-radius:11px;cursor:pointer;text-align:left;color:#13161c;margin-bottom:2px" class="hover-sidebar-item" id="navHome">
      <i class="ti ti-layout-grid" id="navHomeIcon" style="font-size:18px"></i>
      <span style="font-size:13.5px;font-weight:600;flex:1">Inbox</span>
      <span style="font-size:11px;font-weight:600;color:#a7adb8">Overview</span>
    </button>

    <button data-action="toggleInbox" style="display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border:0;border-radius:11px;cursor:pointer;text-align:left;color:#13161c" id="navInbox">
      <i class="ti ti-inbox" id="navInboxIcon" style="font-size:18px"></i>
      <span style="font-size:13px;font-weight:600;flex:1;min-width:0;line-height:1.3">Follow ups</span>
      <span id="followTotal" style="font-size:11px;font-weight:600;color:#a7adb8"></span>
    </button>

    <div id="navItemsList"></div>
  </nav>

  <div style="margin-top:auto;padding:14px 16px 16px">
    <div style="border-top:1px solid #eeeff2;padding-top:12px;display:flex;align-items:center;gap:10px">
      <div id="ownerAvatar" style="width:32px;height:32px;flex:none;border-radius:999px;background:linear-gradient(135deg,#cfe2f7,#f7ddc4);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#3c4a5c"></div>
      <div style="min-width:0;flex:1">
        <div id="ownerNameLabel" style="font-size:12.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></div>
        <div id="ownerEmailLabel" style="font-size:11px;color:#9aa1ac;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></div>
      </div>
      <i class="ti ti-selector" style="font-size:15px;color:#c3c8d1"></i>
    </div>
  </div>
</aside>

<div style="flex:1;min-width:0;display:flex;flex-direction:column">
  <header id="appHeader" style="position:sticky;top:0;z-index:20;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom:1px solid #eeeff2">
    <div id="headerTopRow" style="display:flex;align-items:center;gap:10px;margin-bottom:11px">
      <button id="openDrawerBtn" data-action="openDrawer" aria-label="Open menu" class="hidden" style="width:40px;height:40px;flex:none;display:flex;align-items:center;justify-content:center;border:1px solid #eceef1;border-radius:13px;background:#fff;cursor:pointer">
        <i class="ti ti-menu-2" style="font-size:19px;color:#40464f"></i>
      </button>
      <div id="mobileLogo" class="hidden" style="display:flex;align-items:center;gap:9px;flex:none;white-space:nowrap">
        <div style="width:30px;height:30px;flex:none;border-radius:10px;background:linear-gradient(135deg,#0b8ee8 0%,#7f9ec4 52%,#f08a20 100%);display:flex;align-items:center;justify-content:center"><i class="ti ti-heart-filled" style="font-size:15px;color:#fff"></i></div>
        <span style="font-size:14px;font-weight:800;letter-spacing:-.2px">FollowUp OS</span>
      </div>
      <div id="searchWrap" style="min-width:0;position:relative;display:flex;align-items:center;background:#f4f6f8;border:1px solid #eceef1;border-radius:999px;padding:0 14px;height:42px">
        <i class="ti ti-search" style="font-size:16px;color:#9aa1ac;margin-right:9px"></i>
        <input id="searchInput" type="text" placeholder="Did I ever reply to Marcus about the Q3 pilot pricing?" style="flex:1;min-width:0;border:0;background:transparent;outline:none;font-size:13px;font-weight:500;color:#13161c">
        <span style="font-size:10.5px;font-weight:700;color:#9aa1ac;background:#fff;border:1px solid #e7e9ed;border-radius:6px;padding:2px 6px">⌘K</span>
        <div id="searchResultsPanel" class="hidden" style="position:absolute;top:48px;left:0;right:0;z-index:80;max-height:360px;overflow-y:auto;background:#fff;border:1px solid #eceef1;border-radius:16px;box-shadow:0 18px 40px -12px rgba(16,24,40,.18),0 2px 6px rgba(16,24,40,.05)"></div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-left:auto;flex:none;padding:5px 11px 5px 8px;border:1px solid #eceef1;border-radius:999px;background:#fff">
        <span style="width:6px;height:6px;border-radius:999px;background:#3fb27f;box-shadow:0 0 0 3px rgba(63,178,127,.15)"></span>
        <span style="font-size:11.5px;font-weight:600;color:#5d6470">Last scanned <span id="lastScanned"></span></span>
      </div>
      <button id="refreshBtn" data-action="refresh" class="hover-refresh" style="display:flex;align-items:center;gap:7px;height:38px;flex:none;border:0;border-radius:999px;background:#13161c;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer">
        <i class="ti ti-refresh refresh-icon" id="refreshIcon" style="font-size:15px"></i><span id="refreshLabel"></span>
      </button>
    </div>
    <div id="filtersRow" style="display:flex;align-items:center;gap:8px;padding-bottom:2px">
      <span style="font-size:11.5px;font-weight:700;color:#a7adb8;letter-spacing:.04em;text-transform:uppercase;margin-right:2px;flex:none">Filter</span>
      <div id="filtersList" style="display:flex;align-items:center;gap:8px"></div>
      <button data-action="clearFilters" class="hover-clear" style="height:32px;padding:0 12px;border:0;background:transparent;border-radius:999px;font-size:12px;font-weight:600;color:#9aa1ac;cursor:pointer">Clear all</button>
    </div>
  </header>


  <main id="mainArea" style="flex:1">
    <div id="view-home" class="view-container"></div>
    <div id="view-inbox" class="view-container hidden"></div>
    <div id="view-meetings" class="view-container hidden"></div>
    <div id="view-sent" class="view-container hidden"></div>
    <div id="view-dismissed" class="view-container hidden"></div>
    <div id="view-settings" class="view-container hidden"></div>
    <div id="view-thread" class="view-container hidden"></div>
  </main>
</div>

<nav id="bottomNav" class="hidden" style="position:fixed;bottom:0;left:0;right:0;z-index:70;background:rgba(255,255,255,.96);backdrop-filter:blur(10px);border-top:1px solid #eeeff2;display:flex;padding:7px 6px 10px"></nav>

<div id="toastEl" class="hidden" style="position:fixed;left:50%;transform:translateX(-50%);z-index:95;display:flex;align-items:center;gap:10px;background:#13161c;color:#fff;border-radius:999px;padding:11px 18px 11px 14px;box-shadow:0 18px 40px -12px rgba(16,24,40,.4)">
  <i class="ti ti-circle-check" style="font-size:17px;color:#7fd4ab"></i>
  <span id="toastMsg" style="font-size:12.5px;font-weight:600"></span>
  <button id="toastActionBtn" data-action="toastAction" class="hidden hover-toast-action" style="margin-left:4px;height:26px;padding:0 11px;border:1px solid rgba(255,255,255,.28);border-radius:999px;background:transparent;font-size:11.5px;font-weight:700;color:#fff;cursor:pointer"></button>
</div>

<div id="confirmSendRoot"></div>
<div id="confirmRescanRoot"></div>
<div id="confirmDeleteDismissedRoot"></div>
<div id="scanModalRoot"></div>
<div id="feedbackPopupRoot"></div>
`;

// ---------------------------------------------------------------------------
// SHELL RENDER (sidebar, header, mobile drawer/bottom-nav, toast)
// ---------------------------------------------------------------------------

function renderShell(v) {
  // ----- responsive shell tokens -----
  document.getElementById("sidebar").setAttribute("style",
    `width:${v.asWidth};flex:none;background:#ffffff;border-right:1px solid #eeeff2;display:${v.asDisplay};flex-direction:column;position:${v.asPos};top:0;left:0;height:100vh;z-index:${v.asZ};box-shadow:${v.asShadow}`);
  document.getElementById("drawerScrim").classList.toggle("hidden", !v.drawerOpen);
  document.getElementById("closeDrawerBtn").classList.toggle("hidden", !v.isMobile);
  document.getElementById("openDrawerBtn").classList.toggle("hidden", !v.isMobile);
  document.getElementById("mobileLogo").classList.toggle("hidden", !v.isMobile);
  document.getElementById("appHeader").style.padding = v.hdPad;
  document.getElementById("headerTopRow").style.flexWrap = v.hdWrap;
  document.getElementById("searchWrap").style.flex = `1 1 ${v.searchBasis}`;
  document.getElementById("searchWrap").style.maxWidth = v.searchMax;
  document.getElementById("refreshBtn").style.padding = v.refreshPad;
  document.getElementById("refreshLabel").textContent = v.refreshLabel;
  document.getElementById("refreshIcon").style.transform = `rotate(${v.spin}deg)`;
  document.getElementById("lastScanned").textContent = v.lastScanned;
  document.getElementById("filtersRow").style.flexWrap = v.fltWrap;
  document.getElementById("filtersRow").style.overflowX = v.fltOverflow;
  document.getElementById("filtersRow").classList.toggle("hidden", !v.showFilters);
  document.getElementById("mainArea").style.padding = v.mainPad;
  document.getElementById("bottomNav").classList.toggle("hidden", !v.isMobile);
  // ----- scope pill -----
  document.getElementById("scopeLabel").textContent = v.scopeLabel;
  document.getElementById("scopeNote").textContent = v.scopeNote;

  // ----- sidebar account footer -----
  document.getElementById("ownerAvatar").textContent = v.ownerInitials;
  document.getElementById("ownerNameLabel").textContent = v.ownerName;
  document.getElementById("ownerEmailLabel").textContent = v.ownerEmail;

  // ----- nav: home / inbox highlighting -----
  document.getElementById("navHome").style.background = v.homeBg;
  document.getElementById("navHomeIcon").style.color = v.homeIconColor;
  document.getElementById("navInbox").style.background = v.inboxBg;
  document.getElementById("navInboxIcon").style.color = v.inboxIconColor;
  document.getElementById("followTotal").textContent = v.followTotal;

  // ----- nav items (meetings/sent/dismissed/settings) -----
  document.getElementById("navItemsList").innerHTML = v.navItems.map(n => `
    <button data-action="navTo" data-view="${n.key}" style="display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border:0;background:${n.bg};border-radius:11px;cursor:pointer;text-align:left" class="hover-sidebar-item">
      <i class="ti ${n.icon}" style="font-size:18px;color:${n.iconColor}"></i>
      <span style="font-size:13px;font-weight:600;flex:1;min-width:0;line-height:1.3;color:${n.color}">${n.label}</span>
      ${n.hasBadge ? `<span style="font-size:10.5px;font-weight:800;color:#a5561b;background:#fce6d8;border-radius:999px;padding:2px 7px;flex:none">${n.badge}</span>` : ""}
      <span style="font-size:11px;font-weight:600;color:#a7adb8">${n.meta}</span>
    </button>
  `).join("");

  // ----- filter pills -----
  // On mobile the filter row scrolls horizontally (fltOverflow), which clips any
  // absolutely-positioned child that hangs below the row (same class of bug as the
  // thread header: a wrapping/overflow rule doesn't help because the scroll
  // container clips before the wrap/overflow can show through). So on mobile we
  // render the open dropdown as position:fixed (escapes the scroll clip) and
  // compute its on-screen position from the toggle button's rect after paint.
  document.getElementById("filtersList").innerHTML = v.filters.map(f => `
    <div style="position:relative;flex:none">
      <button id="filterBtn-${f.key}" data-action="toggleFilter" data-filter="${f.key}" class="hover-filter-btn" style="display:flex;align-items:center;gap:7px;height:32px;padding:0 12px;border:1px solid ${f.border};border-radius:999px;background:${f.bg};cursor:pointer">
        <i class="ti ${f.icon}" style="font-size:14px;color:${f.iconColor}"></i>
        <span style="font-size:12px;font-weight:600;color:${f.color}">${esc(f.label)}</span>
        <i class="ti ti-chevron-down" style="font-size:13px;color:#a7adb8"></i>
      </button>
      ${f.open ? `
      <div id="filterPanel-${f.key}" style="position:${v.isMobile ? "fixed" : "absolute"};top:38px;left:0;z-index:96;min-width:206px;background:#fff;border:1px solid #eceef1;border-radius:16px;box-shadow:0 18px 40px -12px rgba(16,24,40,.18),0 2px 6px rgba(16,24,40,.05);padding:6px">
        ${f.options.map(o => `
        <button data-action="pickFilter" data-filter="${f.key}" data-value="${esc(o.label)}" class="hover-filter-opt" style="display:flex;align-items:center;gap:9px;width:100%;padding:8px 10px;border:0;background:${o.bg};border-radius:10px;cursor:pointer;text-align:left">
          <span style="width:8px;height:8px;flex:none;border-radius:999px;background:${o.dot}"></span>
          <span style="flex:1;font-size:12.5px;font-weight:600;color:#13161c">${esc(o.label)}</span>
          <i class="ti ${o.check}" style="font-size:15px;color:#0b8ee8"></i>
        </button>`).join("")}
      </div>` : ""}
    </div>
  `).join("");

  // Position the fixed-mode dropdown against its trigger button now that both
  // are in the DOM. Clamp left so the 206px-min panel never runs past the
  // right edge of narrow viewports.
  if (v.isMobile) {
    const openFilterDef = v.filters.filter(f => f.open)[0];
    if (openFilterDef) {
      const btn = document.getElementById("filterBtn-" + openFilterDef.key);
      const panel = document.getElementById("filterPanel-" + openFilterDef.key);
      if (btn && panel) {
        const r = btn.getBoundingClientRect();
        const panelWidth = Math.max(panel.offsetWidth, 206);
        const left = Math.min(r.left, window.innerWidth - panelWidth - 12);
        panel.style.top = (r.bottom + 6) + "px";
        panel.style.left = Math.max(12, left) + "px";
      }
    }
  }

  // ----- bottom nav (mobile) -----
  document.getElementById("bottomNav").innerHTML = v.bottomNav.map(b => `
    <button data-action="navTo" data-view="${b.key}" style="flex:1;min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:0;background:transparent;cursor:pointer;padding:6px 2px">
      <i class="ti ${b.icon}" style="font-size:20px;color:${b.color}"></i>
      <span style="font-size:10.5px;font-weight:${b.weight};color:${b.color}">${b.label}</span>
    </button>
  `).join("");

  // ----- toast -----
  const toastEl = document.getElementById("toastEl");
  toastEl.classList.toggle("hidden", !v.hasToast);
  toastEl.style.bottom = v.toastBottom;
  document.getElementById("toastMsg").textContent = v.toast;
  const toastActionBtn = document.getElementById("toastActionBtn");
  toastActionBtn.classList.toggle("hidden", !v.hasToastAction);
  toastActionBtn.textContent = v.toastActionLabel;

  // ----- view switching (top-level containers always mounted) -----
  ["home", "inbox", "meetings", "sent", "dismissed", "settings", "thread"].forEach(key => {
    document.getElementById("view-" + key).classList.toggle("hidden", state.view !== key);
  });
}

// ---------------------------------------------------------------------------
// HOME VIEW
// ---------------------------------------------------------------------------

function renderHome(v) {
  const el = document.getElementById("view-home");
  el.innerHTML = `
  <div style="max-width:980px;margin:0 auto">
    <div style="margin-bottom:22px">
      <div style="display:inline-flex;align-items:center;gap:7px;border:1px solid #e5e8ed;border-radius:999px;padding:4px 12px 4px 5px;margin-bottom:10px">
        <span style="width:19px;height:19px;border-radius:999px;background:linear-gradient(135deg,#0b8ee8,#f08a20);display:flex;align-items:center;justify-content:center"><i class="ti ti-layout-grid" style="font-size:11px;color:#fff"></i></span>
        <span style="font-size:11.5px;font-weight:700;color:#13161c">All mailboxes · scanned ${esc(v.lastScanned)}</span>
      </div>
      <h1 style="margin:0 0 5px;font-size:26px;font-weight:800;letter-spacing:-.6px">Good morning, Ellen</h1>
      <p style="margin:0;font-size:13.5px;color:#5d6470">${esc(v.homeGreeting)}</p>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:13px;margin-bottom:34px">
      ${v.summaryCards.map(c => `
      <button data-action="homeCard" data-go="${c.go}" class="hover-card" style="text-align:left;background:#fff;border:1px solid #eff0f3;border-radius:20px;padding:16px 17px;box-shadow:0 1px 2px rgba(16,24,40,.04),0 10px 26px -18px rgba(16,24,40,.16);cursor:pointer;display:flex;flex-direction:column;gap:11px;min-width:0">
        <div style="display:flex;align-items:center;gap:9px">
          <span style="width:30px;height:30px;flex:none;border-radius:10px;background:${c.bg};display:flex;align-items:center;justify-content:center"><i class="ti ${c.icon}" style="font-size:15px;color:${c.fg}"></i></span>
          <span style="font-size:12.5px;font-weight:700;color:#13161c;flex:1;min-width:0">${esc(c.label)}</span>
          <i class="ti ti-arrow-up-right" style="font-size:15px;color:#c3c8d1"></i>
        </div>
        <div style="display:flex;align-items:baseline;gap:8px">
          <span style="font-size:30px;font-weight:800;letter-spacing:-1px;line-height:1;color:#13161c">${c.n}</span>
          <span style="font-size:11.5px;font-weight:600;color:#9aa1ac;text-wrap:pretty">${esc(c.sub)}</span>
        </div>
      </button>
      `).join("")}
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px">
      <div>
        <div style="display:inline-flex;align-items:center;gap:7px;border:1px solid #e5e8ed;border-radius:999px;padding:4px 12px 4px 5px;margin-bottom:8px">
          <span style="width:19px;height:19px;border-radius:999px;background:linear-gradient(135deg,#3fb27f,#0b8ee8);display:flex;align-items:center;justify-content:center"><i class="ti ti-at" style="font-size:11px;color:#fff"></i></span>
          <span style="font-size:11.5px;font-weight:700;color:#13161c">${v.mailboxTotal} connected accounts</span>
        </div>
        <h2 style="margin:0;font-size:${v.h2Size};font-weight:800;letter-spacing:-.5px">By mailbox</h2>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:10px">
      ${v.mailboxRows.map(r => `
      <div style="background:#fff;border:1px solid #eff0f3;border-radius:18px;padding:14px 16px;box-shadow:0 1px 2px rgba(16,24,40,.04)">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div style="width:32px;height:32px;flex:none;border-radius:10px;background:#f4f6f8;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:${r.dot}">${r.initial}</div>
          <button data-action="mailboxRowOpen" data-mailbox="${esc(r.address)}" style="flex:1;min-width:170px;text-align:left;border:0;background:transparent;cursor:pointer;padding:0">
            <span style="display:block;font-size:13.5px;font-weight:700;color:#13161c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.address)}</span>
            <span style="display:block;margin-top:2px;font-size:11.5px;font-weight:500;color:#9aa1ac">${esc(r.role)}</span>
          </button>
          <span style="flex:none;font-size:11px;font-weight:700;border-radius:999px;padding:4px 10px;background:${r.totalBg};color:${r.totalColor}">${esc(r.totalLabel)}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid #f2f3f6">
          ${r.stats.map(st => `
          <button data-action="mailboxStat" data-go="${st.go}" data-mailbox="${esc(st.mailbox)}" class="hover-pill-btn" style="display:flex;align-items:center;gap:7px;height:30px;padding:0 11px;border:1px solid #eff0f3;border-radius:999px;background:${st.bg};cursor:pointer">
            <span style="font-size:12.5px;font-weight:800;color:${st.fg}">${st.n}</span>
            <span style="font-size:11.5px;font-weight:600;color:#5d6470">${esc(st.label)}</span>
          </button>
          `).join("")}
        </div>
      </div>
      `).join("")}
    </div>
  </div>
  `;
}

// ---------------------------------------------------------------------------
// FOLLOW-UPS (inbox) VIEW — Needs-reply, Low-confidence, Needs-follow-up
// ---------------------------------------------------------------------------

// Small chevron + dropdown next to the priority pill letting Ellen manually
// re-sort a needs-reply/low-confidence/manually-flagged card into a
// different category without dismissing it (added 2026-07-29). Shared
// between needsCardHtml, lowConfCardHtml, and manual-origin follow-up cards.
function moveMenuHtml(t) {
  return `
  <div style="position:relative">
    <button data-action="toggleMoveMenu" data-id="${t.id}" title="Move to a different category" style="display:inline-flex;align-items:center;gap:4px;height:22px;flex:none;padding:0 9px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:10.5px;font-weight:700;color:#5d6470;cursor:pointer;white-space:nowrap">
      Move<i class="ti ti-chevron-down" style="font-size:12px;color:#9aa1ac"></i>
    </button>
    ${t.moveOpen ? `
    <div style="position:absolute;top:26px;right:0;z-index:50;min-width:174px;background:#fff;border:1px solid #eceef1;border-radius:14px;box-shadow:0 18px 40px -12px rgba(16,24,40,.18),0 2px 6px rgba(16,24,40,.05);padding:6px">
      ${t.moveOptions.map(o => `
      <button data-action="moveCard" data-id="${o.id}" data-status="${o.status}" data-name="${esc(t.name)}" class="hover-filter-opt" style="display:flex;align-items:center;width:100%;padding:8px 10px;border:0;background:transparent;border-radius:10px;cursor:pointer;text-align:left">
        <span style="font-size:12.5px;font-weight:600;color:#13161c">Move to ${esc(o.label)}</span>
      </button>`).join("")}
    </div>` : ""}
  </div>
  `;
}

function needsCardHtml(t, v) {
  return `
  <article class="card" style="padding:${v.cardPad}">
    <div style="display:flex;gap:13px;align-items:flex-start">
      ${avatar(t.av, t.initials, 40)}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px">
          <span style="font-size:14.5px;font-weight:700;letter-spacing:-.15px">${esc(t.name)}</span>
          <span style="font-size:12.5px;font-weight:500;color:#9aa1ac">${esc(t.org)}</span>
          <span style="display:inline-flex;align-items:center;gap:8px;white-space:nowrap">
            <span style="width:3px;height:3px;border-radius:999px;background:#d3d7de"></span>
            <span style="font-size:12px;font-weight:500;color:#9aa1ac">${esc(t.time)}</span>
          </span>
        </div>
        <p style="margin:0 0 6px;font-size:13.5px;font-weight:600;color:#13161c">${esc(t.subject)}</p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#5d6470;text-wrap:pretty">${esc(t.snippet)}</p>
      </div>
      <div style="display:flex;align-items:flex-start;gap:6px;flex:none">
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:7px">
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;border-radius:999px;padding:5px 11px;background:${t.tierBg};color:${t.tierColor};white-space:nowrap">
            <span style="width:6px;height:6px;border-radius:999px;background:${t.tierDot}"></span>${esc(t.tierLabel)}</span>
          <span style="font-size:11px;font-weight:600;color:#a7adb8;white-space:nowrap">${esc(t.waited)}</span>
        </div>
        ${moveMenuHtml(t)}
      </div>
    </div>

    <div class="expand-wrap${t.open ? " expand-wrap--open" : ""}" style="margin-top:${t.open ? "14" : "0"}px">
      <div class="expand-inner">
        <div style="background:#f7f8fa;border-radius:14px;padding:14px 16px;margin-top:${t.open ? "0" : "0"}px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px;padding-bottom:9px;border-bottom:1px solid #ebedf1">
            <i class="ti ti-mail-opened" style="font-size:14px;color:#9aa1ac"></i>
            <span style="font-size:11.5px;font-weight:600;color:#5d6470">to ${esc(t.mailbox)}</span>
          </div>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#3a404a;white-space:pre-wrap">${nl2body(t.body)}</p>
        </div>
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px;padding-top:13px;border-top:1px solid #f2f3f6">
      <button data-action="toggleCard" data-id="${t.id}" class="hover-pill-btn-color" style="display:flex;align-items:center;gap:6px;height:33px;padding:0 13px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:12px;font-weight:600;color:#40464f;cursor:pointer">
        <i class="ti ${t.toggleIcon}" style="font-size:14px;color:#9aa1ac"></i>${t.toggleLabel}
      </button>
      <a href="https://mail.google.com/mail/u/0/#all/${t.id}" target="_blank" class="hover-pill-btn-color" style="display:flex;align-items:center;gap:6px;height:33px;padding:0 13px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:12px;font-weight:600;color:#40464f">
        <i class="ti ti-external-link" style="font-size:14px;color:#9aa1ac"></i>Open in Gmail
      </a>
      <button data-action="dismissCard" data-id="${t.id}" data-name="${esc(t.name)}" class="hover-dismiss" style="display:flex;align-items:center;gap:6px;height:33px;padding:0 13px;border:0;border-radius:999px;background:transparent;font-size:12px;font-weight:600;color:#9aa1ac;cursor:pointer">
        <i class="ti ti-x" style="font-size:14px"></i>Not interested
      </button>
      <div style="margin-left:auto;display:flex;align-items:center;gap:9px">
        <span style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:#5d6470;background:${t.draftBg};border-radius:999px;padding:5px 10px"><i class="ti ${t.draftIcon}" style="font-size:12px;color:${t.draftIconColor}"></i>${esc(t.draftLabel)}</span>
        <button data-action="openThread" data-id="${t.id}" class="hover-dark-btn" style="display:flex;align-items:center;gap:6px;height:34px;padding:0 16px;border:0;border-radius:999px;background:#13161c;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap">${esc(t.cta)}<i class="ti ti-arrow-right" style="font-size:14px"></i></button>
      </div>
    </div>
  </article>
  `;
}

function lowConfCardHtml(t, v) {
  return `
  <article class="card" style="padding:${v.cardPad}">
    <div style="display:flex;gap:13px;align-items:flex-start">
      ${avatar(t.av, t.initials, 40)}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px">
          <span style="font-size:14.5px;font-weight:700;letter-spacing:-.15px">${esc(t.name)}</span>
          <span style="font-size:12.5px;font-weight:500;color:#9aa1ac">${esc(t.org)}</span>
          <span style="display:inline-flex;align-items:center;gap:8px;white-space:nowrap">
            <span style="width:3px;height:3px;border-radius:999px;background:#d3d7de"></span>
            <span style="font-size:12px;font-weight:500;color:#9aa1ac">${esc(t.time)}</span>
          </span>
        </div>
        <p style="margin:0 0 6px;font-size:13.5px;font-weight:600;color:#13161c">${esc(t.subject)}</p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#5d6470;text-wrap:pretty">${esc(t.snippet)}</p>
      </div>
      <div style="display:flex;align-items:flex-start;gap:6px;flex:none">
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:7px">
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;border-radius:999px;padding:5px 11px;background:${t.tierBg};color:${t.tierColor};white-space:nowrap">
            <span style="width:6px;height:6px;border-radius:999px;background:${t.tierDot}"></span>${esc(t.tierLabel)}</span>
          <span style="font-size:11px;font-weight:600;color:#a7adb8;white-space:nowrap">${esc(t.waited)}</span>
        </div>
        ${moveMenuHtml(t)}
      </div>
    </div>

    <div style="margin-top:13px;display:flex;gap:9px;align-items:flex-start;background:#f6f4fc;border-radius:14px;padding:12px 14px">
      <i class="ti ti-alert-circle" style="font-size:16px;color:#8b7fd4;margin-top:1px"></i>
      <p style="margin:0;font-size:12.5px;line-height:1.55;color:#54459b;flex:1;text-wrap:pretty">${esc(t.why)}</p>
      <button data-action="searchMailbox" data-name="${esc(t.name)}" class="hover-search-btn" style="flex:none;height:29px;padding:0 12px;border:1px solid #d8cff0;border-radius:999px;background:#fff;font-size:11.5px;font-weight:700;color:#54459b;cursor:pointer;white-space:nowrap">Search full mailbox</button>
    </div>

    <div class="expand-wrap${t.open ? " expand-wrap--open" : ""}" style="margin-top:${t.open ? "12" : "0"}px">
      <div class="expand-inner">
        <div style="background:#f7f8fa;border-radius:14px;padding:14px 16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px;padding-bottom:9px;border-bottom:1px solid #ebedf1">
            <i class="ti ti-mail-opened" style="font-size:14px;color:#9aa1ac"></i>
            <span style="font-size:11.5px;font-weight:600;color:#5d6470">to ${esc(t.mailbox)}</span>
          </div>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#3a404a;white-space:pre-wrap">${nl2body(t.body)}</p>
        </div>
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px;padding-top:13px;border-top:1px solid #f2f3f6">
      <button data-action="toggleCard" data-id="${t.id}" class="hover-pill-btn-color" style="display:flex;align-items:center;gap:6px;height:33px;padding:0 13px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:12px;font-weight:600;color:#40464f;cursor:pointer">
        <i class="ti ${t.toggleIcon}" style="font-size:14px;color:#9aa1ac"></i>${t.toggleLabel}
      </button>
      <a href="https://mail.google.com/mail/u/0/#all/${t.id}" target="_blank" class="hover-pill-btn-color" style="display:flex;align-items:center;gap:6px;height:33px;padding:0 13px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:12px;font-weight:600;color:#40464f">
        <i class="ti ti-external-link" style="font-size:14px;color:#9aa1ac"></i>Open in Gmail
      </a>
      <button data-action="dismissCard" data-id="${t.id}" data-name="${esc(t.name)}" class="hover-dismiss" style="display:flex;align-items:center;gap:6px;height:33px;padding:0 13px;border:0;border-radius:999px;background:transparent;font-size:12px;font-weight:600;color:#9aa1ac;cursor:pointer">
        <i class="ti ti-x" style="font-size:14px"></i>Not interested
      </button>
      <div style="margin-left:auto;display:flex;align-items:center;gap:9px">
        <span style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:#5d6470;background:${t.draftBg};border-radius:999px;padding:5px 10px"><i class="ti ${t.draftIcon}" style="font-size:12px;color:${t.draftIconColor}"></i>${esc(t.draftLabel)}</span>
        <button data-action="openThread" data-id="${t.id}" class="hover-dark-btn" style="display:flex;align-items:center;gap:6px;height:34px;padding:0 16px;border:0;border-radius:999px;background:#13161c;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap">${esc(t.cta)}<i class="ti ti-arrow-right" style="font-size:14px"></i></button>
      </div>
    </div>
  </article>
  `;
}

function fuCardHtml(f, v) {
  return `
  <article class="card" style="padding:${v.cardPad}">
    <div style="display:flex;flex-direction:${v.cardHeadDir};gap:13px;align-items:${v.isMobile ? "stretch" : "flex-start"}">
      <div style="display:flex;gap:13px;align-items:flex-start;min-width:0">
        ${avatar(f.av, f.initials, 40)}
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px">
            <span style="font-size:14.5px;font-weight:700;letter-spacing:-.15px">${esc(f.name)}</span>
            <span style="font-size:12.5px;font-weight:500;color:#9aa1ac">${esc(f.org)}</span>
            <span style="display:inline-flex;align-items:center;gap:8px;white-space:nowrap">
              <span style="width:3px;height:3px;border-radius:999px;background:#d3d7de"></span>
              <span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:500;color:#9aa1ac"><i class="ti ti-arrow-up-right" style="font-size:13px"></i>${esc(f.sent)}</span>
            </span>
          </div>
          <p style="margin:0 0 6px;font-size:13.5px;font-weight:600;color:#13161c">${esc(f.subject)}</p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#5d6470;text-wrap:pretty">${esc(f.snippet)}</p>
        </div>
      </div>
      <div style="flex:none;display:flex;align-items:flex-start;gap:6px">
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:7px">
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;border-radius:999px;padding:5px 11px;background:${f.pillBg};color:${f.pillColor};white-space:nowrap">
            <span style="width:6px;height:6px;border-radius:999px;background:${f.pillDot}"></span>${esc(f.pill)}</span>
          ${f.aging ? `
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;border-radius:999px;padding:5px 11px;background:#fce6d8;color:#a5561b;white-space:nowrap">
            <i class="ti ti-alarm" style="font-size:12px"></i>Still no reply</span>` : ""}
        </div>
        ${f.isManual ? moveMenuHtml(f) : ""}
      </div>
    </div>

    <div class="expand-wrap${f.open ? " expand-wrap--open" : ""}" style="margin-top:${f.open ? "13" : "0"}px">
      <div class="expand-inner">
        <div style="background:#f7f8fa;border-radius:14px;padding:14px 16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px;padding-bottom:9px;border-bottom:1px solid #ebedf1">
            <i class="ti ${f.isManual ? "ti-mail-opened" : "ti-send"}" style="font-size:14px;color:#9aa1ac"></i>
            <span style="font-size:11.5px;font-weight:600;color:#5d6470">${f.isManual ? "From " + esc(f.name) : "What you sent from " + esc(f.mailbox)}</span>
            <span style="margin-left:auto;font-size:11.5px;font-weight:600;color:#9aa1ac">${esc(f.sent)}</span>
          </div>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#3a404a;white-space:pre-wrap">${nl2body(f.body)}</p>
        </div>
        <div style="margin-top:11px;display:flex;gap:9px;align-items:flex-start;background:#f2f7fd;border-radius:14px;padding:12px 14px">
          <i class="ti ti-bulb" style="font-size:16px;color:#0b8ee8;margin-top:1px"></i>
          <p style="margin:0;font-size:12.5px;line-height:1.55;color:#0b6fb8;flex:1;text-wrap:pretty">${esc(f.nudge)}</p>
        </div>
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px;padding-top:13px;border-top:1px solid #f2f3f6">
      <button data-action="toggleFu" data-id="${f.id}" class="hover-pill-btn-color" style="display:flex;align-items:center;gap:6px;height:33px;padding:0 13px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:12px;font-weight:600;color:#40464f;cursor:pointer">
        <i class="ti ${f.toggleIcon}" style="font-size:14px;color:#9aa1ac"></i>${f.toggleLabel}
      </button>
      <a href="https://mail.google.com/mail/u/0/#all/${f.id}" target="_blank" class="hover-pill-btn-color" style="display:flex;align-items:center;gap:6px;height:33px;padding:0 13px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:12px;font-weight:600;color:#40464f">
        <i class="ti ti-external-link" style="font-size:14px;color:#9aa1ac"></i>Open in Gmail
      </a>
      <button data-action="dismissFu" data-id="${f.id}" data-name="${esc(f.name)}" class="hover-dismiss" style="display:flex;align-items:center;gap:6px;height:33px;padding:0 13px;border:0;border-radius:999px;background:transparent;font-size:12px;font-weight:600;color:#9aa1ac;cursor:pointer">
        <i class="ti ti-x" style="font-size:14px"></i>Stop chasing
      </button>
      <div style="margin-left:auto;display:flex;align-items:center;gap:9px">
        <span style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:#5d6470;background:#dcf0e6;border-radius:999px;padding:5px 10px"><i class="ti ti-sparkles" style="font-size:12px;color:#3fb27f"></i>2 nudges ready</span>
        <button data-action="draftFu" data-id="${f.id}" class="hover-dark-btn" style="display:flex;align-items:center;gap:6px;height:34px;padding:0 16px;border:0;border-radius:999px;background:#13161c;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap">Draft follow-up<i class="ti ti-arrow-right" style="font-size:14px"></i></button>
      </div>
    </div>
  </article>
  `;
}

function renderInbox(v) {
  const el = document.getElementById("view-inbox");
  el.innerHTML = `
  <div style="max-width:980px;margin:0 auto">

    <div style="display:flex;flex-direction:${v.bannerDir};gap:14px;align-items:stretch;border-radius:20px;background:linear-gradient(105deg,#f2f7fd 0%,#fdf3ea 100%);border:1px solid #f0e7dd;padding:18px 20px;margin-bottom:30px">
      <div style="width:38px;height:38px;flex:none;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px -2px rgba(16,24,40,.12)">
        <i class="ti ${v.bannerIcon}" style="font-size:19px;color:${v.bannerIconColor}"></i>
      </div>
      <div style="flex:1;min-width:0">
        <p style="margin:0 0 3px;font-size:14.5px;font-weight:700;letter-spacing:-.15px">${esc(v.overdueLine)}</p>
        <p style="margin:0;font-size:13px;line-height:1.55;color:#5d6470;text-wrap:pretty">${esc(v.overdueBody)}</p>
      </div>
      ${v.hasOpen ? `
      <div style="display:flex;align-items:center;gap:8px;flex:none">
        <button data-action="openOldest" style="height:36px;padding:0 15px;border:0;border-radius:999px;background:#13161c;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap" class="hover-dark-btn">Review oldest first</button>
      </div>` : ""}
    </div>

    <!-- Needs your reply -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px">
      <div>
        <div style="display:inline-flex;align-items:center;gap:7px;border:1px solid #e5e8ed;border-radius:999px;padding:4px 12px 4px 5px;margin-bottom:8px">
          <span style="width:19px;height:19px;border-radius:999px;background:linear-gradient(135deg,#0b8ee8,#f08a20);display:flex;align-items:center;justify-content:center"><i class="ti ti-bolt" style="font-size:11px;color:#fff"></i></span>
          <span style="font-size:11.5px;font-weight:700;color:#13161c">${esc(v.needsBadge)}</span>
        </div>
        <h2 style="margin:0;font-size:${v.h2Size};font-weight:800;letter-spacing:-.5px">Needs your reply</h2>
      </div>
      <span style="font-size:12.5px;font-weight:600;color:#9aa1ac;flex:none">Sorted by promise deadline</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:38px">
      ${v.needsReply.map(t => needsCardHtml(t, v)).join("")}
      ${v.needsEmpty ? `
      <div style="display:flex;align-items:center;gap:10px;background:#fbfbfc;border:1px dashed #e5e8ed;border-radius:16px;padding:16px 18px">
        <i class="ti ti-inbox-off" style="font-size:17px;color:#c3c8d1"></i>
        <p style="margin:0;font-size:12.5px;font-weight:600;color:#9aa1ac">No threads waiting on a reply. Next scan runs in 12 minutes.</p>
      </div>` : ""}
    </div>

    <!-- Low confidence -->
    <div style="margin-bottom:38px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;background:${v.lowHdBg};border:${v.lowHdBorder};border-radius:${v.lowHdRadius};padding:${v.lowHdPad};box-shadow:${v.lowHdShadow}">
        <div>
          <div style="display:inline-flex;align-items:center;gap:7px;border:1px solid #e5e8ed;border-radius:999px;padding:4px 12px 4px 5px;margin-bottom:8px">
            <span style="width:19px;height:19px;border-radius:999px;background:linear-gradient(135deg,#8b7fd4,#0b8ee8);display:flex;align-items:center;justify-content:center"><i class="ti ti-help-circle" style="font-size:11px;color:#fff"></i></span>
            <span style="font-size:11.5px;font-weight:700;color:#13161c">${esc(v.lowBadge)}</span>
          </div>
          <h2 style="margin:0;font-size:${v.h2Size};font-weight:800;letter-spacing:-.5px">Low confidence</h2>
        </div>
        <button data-action="toggleSection" data-key="lowConf" style="width:32px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;border:1px solid #eceef1;border-radius:999px;background:#fff;cursor:pointer" class="hover-pill-btn">
          <i class="ti ${v.lowChevron}" style="font-size:16px;color:#40464f"></i>
        </button>
      </div>
      <div class="expand-wrap${v.lowOpen ? " expand-wrap--open" : ""}">
        <div class="expand-inner">
          <div style="display:flex;flex-direction:column;gap:14px">
            ${v.lowConf.map(t => lowConfCardHtml(t, v)).join("")}
            ${v.lowEmpty ? `
            <div style="display:flex;align-items:center;gap:10px;background:#fbfbfc;border:1px dashed #e5e8ed;border-radius:16px;padding:16px 18px">
              <i class="ti ti-mood-check" style="font-size:17px;color:#c3c8d1"></i>
              <p style="margin:0;font-size:12.5px;font-weight:600;color:#9aa1ac">Nothing ambiguous in this scan. Threads land here when I can't find prior context.</p>
            </div>` : ""}
          </div>
        </div>
      </div>
    </div>

    <!-- Needs follow-up -->
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;background:${v.fuHdBg};border:${v.fuHdBorder};border-radius:${v.fuHdRadius};padding:${v.fuHdPad};box-shadow:${v.fuHdShadow}">
        <div>
          <div style="display:inline-flex;align-items:center;gap:7px;border:1px solid #e5e8ed;border-radius:999px;padding:4px 12px 4px 5px;margin-bottom:8px">
            <span style="width:19px;height:19px;border-radius:999px;background:linear-gradient(135deg,#0b8ee8,#3fb27f);display:flex;align-items:center;justify-content:center"><i class="ti ti-clock-play" style="font-size:11px;color:#fff"></i></span>
            <span style="font-size:11.5px;font-weight:700;color:#13161c">${esc(v.fuBadge)}</span>
          </div>
          <h2 style="margin:0;font-size:${v.h2Size};font-weight:800;letter-spacing:-.5px">Needs follow-up</h2>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex:none">
          ${v.fuAging ? `
          <button data-action="clearAging" style="display:flex;align-items:center;gap:7px;height:31px;padding:0 12px;border:1px solid #f4d0ba;border-radius:999px;background:#fce6d8;font-size:11.5px;font-weight:700;color:#a5561b;cursor:pointer;flex:none">
            Showing 5+ days only<i class="ti ti-x" style="font-size:13px"></i>
          </button>` : ""}
          <button data-action="toggleSection" data-key="followUp" style="width:32px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;border:1px solid #eceef1;border-radius:999px;background:#fff;cursor:pointer" class="hover-pill-btn">
            <i class="ti ${v.fuChevron}" style="font-size:16px;color:#40464f"></i>
          </button>
        </div>
      </div>
      <div class="expand-wrap${v.fuOpen ? " expand-wrap--open" : ""}">
        <div class="expand-inner">
          <div style="display:flex;flex-direction:column;gap:11px">
            ${v.followUps.map(f => fuCardHtml(f, v)).join("")}
            ${v.fuEmpty ? `
            <div style="display:flex;align-items:center;gap:10px;background:#fbfbfc;border:1px dashed #e5e8ed;border-radius:16px;padding:16px 18px">
              <i class="ti ti-mail-check" style="font-size:17px;color:#c3c8d1"></i>
              <p style="margin:0;font-size:12.5px;font-weight:600;color:#9aa1ac">Nothing you sent is waiting on a reply.</p>
            </div>` : ""}
          </div>
        </div>
      </div>
    </div>

  </div>
  `;
}

// ---------------------------------------------------------------------------
// POST-MEETING VIEW
// ---------------------------------------------------------------------------

function meetCardHtml(mt, v) {
  return `
  <article class="card" style="padding:${v.cardPad}">
    <div style="display:flex;flex-direction:${v.cardHeadDir};gap:13px;align-items:${v.isMobile ? "stretch" : "flex-start"}">
      <div style="display:flex;gap:13px;align-items:flex-start;min-width:0">
        ${avatar(mt.av, mt.initials, 40)}
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px">
            <span style="font-size:14.5px;font-weight:700;letter-spacing:-.15px">${esc(mt.name)}</span>
            <span style="font-size:12.5px;font-weight:500;color:#9aa1ac">${esc(mt.org)}</span>
            <span style="display:inline-flex;align-items:center;gap:8px;white-space:nowrap">
              <span style="width:3px;height:3px;border-radius:999px;background:#d3d7de"></span>
              <span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:500;color:#9aa1ac"><i class="ti ti-video" style="font-size:13px"></i>${esc(mt.ended)}</span>
            </span>
          </div>
          <p style="margin:0 0 6px;font-size:13.5px;font-weight:600;color:#13161c">${esc(mt.title)}</p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#5d6470;text-wrap:pretty">${esc(mt.lead)}</p>
        </div>
      </div>
      <div style="flex:none;${v.isMobile ? "" : "max-width:240px;"}display:flex;flex-direction:column;align-items:${v.isMobile ? "flex-start" : "flex-end"};gap:7px">
        <span style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;border-radius:999px;padding:5px 11px;background:${mt.pillBg};color:${mt.pillColor};line-height:1.35;text-wrap:pretty">
          <i class="ti ${mt.pillIcon}" style="font-size:12px;flex:none"></i>${esc(mt.pill)}</span>
        ${mt.pending ? `
        <span style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;border-radius:999px;padding:5px 11px;background:#fce6d8;color:#a5561b;white-space:nowrap">
          <i class="ti ti-alarm" style="font-size:12px"></i>${esc(mt.pendingPill)}</span>` : ""}
      </div>
    </div>

    <div class="expand-wrap${mt.open ? " expand-wrap--open" : ""}" style="margin-top:${mt.open ? "13" : "0"}px">
      <div class="expand-inner">
        ${mt.isWaiting ? `
        <div style="display:flex;align-items:center;gap:13px;background:#f2f7fd;border-radius:14px;padding:12px 15px">
          <div style="flex:1;min-width:0">
            <div style="height:6px;border-radius:999px;background:#dbe7f4;overflow:hidden">
              <div style="height:100%;width:${mt.progress};border-radius:999px;background:linear-gradient(90deg,#0b8ee8,#f08a20)"></div>
            </div>
          </div>
          <span style="flex:none;font-size:11.5px;font-weight:700;color:#0b6fb8">${mt.progress} of the wait window</span>
        </div>` : ""}

        ${mt.hasActions ? `
        <div style="margin-top:13px;background:#f7f8fa;border-radius:14px;padding:14px 16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:9px;border-bottom:1px solid #ebedf1">
            <i class="ti ti-list-check" style="font-size:14px;color:#8b7fd4"></i>
            <span style="font-size:11.5px;font-weight:700;color:#5d6470">Action items from the call</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${mt.actions.map(a => `
            <div style="display:flex;gap:8px;align-items:flex-start">
              <i class="ti ti-point-filled" style="font-size:13px;color:#8b7fd4;margin-top:2px;flex:none"></i>
              <span style="font-size:12.5px;font-weight:600;color:#3a404a;line-height:1.55;text-wrap:pretty">${esc(a.text)}</span>
            </div>`).join("")}
          </div>
        </div>` : ""}

        ${mt.isFallback ? `
        <div style="margin-top:13px;display:flex;gap:9px;align-items:flex-start;background:#fdf7ec;border-radius:14px;padding:12px 14px">
          <i class="ti ti-history" style="font-size:16px;color:#c9932a;margin-top:1px;flex:none"></i>
          <p style="margin:0;font-size:12.5px;line-height:1.55;color:#8a6a24;flex:1;text-wrap:pretty">${esc(mt.fallback)}</p>
        </div>` : ""}
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px;padding-top:13px;border-top:1px solid #f2f3f6">
      <button data-action="toggleMeet" data-id="${mt.id}" class="hover-pill-btn-color" style="display:flex;align-items:center;gap:6px;height:33px;padding:0 13px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:12px;font-weight:600;color:#40464f;cursor:pointer">
        <i class="ti ${mt.toggleIcon}" style="font-size:14px;color:#9aa1ac"></i>${mt.toggleLabel}
      </button>
      <button data-action="dismissMeet" data-id="${mt.id}" data-name="${esc(mt.name)}" class="hover-dismiss" style="display:flex;align-items:center;gap:6px;height:33px;padding:0 13px;border:0;border-radius:999px;background:transparent;font-size:12px;font-weight:600;color:#9aa1ac;cursor:pointer">
        <i class="ti ti-x" style="font-size:14px"></i>Skip this call
      </button>
      ${mt.hasDrafts ? `
      <div style="margin-left:auto;display:flex;align-items:center;gap:9px">
        <span style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;color:#5d6470;background:#e8e2f8;border-radius:999px;padding:5px 10px"><i class="ti ti-sparkles" style="font-size:12px;color:#8b7fd4"></i>2 drafts ready</span>
        <button data-action="openThread" data-id="${mt.id}" class="hover-dark-btn" style="display:flex;align-items:center;gap:6px;height:34px;padding:0 16px;border:0;border-radius:999px;background:#13161c;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap">View drafts<i class="ti ti-arrow-right" style="font-size:14px"></i></button>
      </div>` : ""}
    </div>
  </article>
  `;
}

function renderMeetings(v) {
  const el = document.getElementById("view-meetings");
  el.innerHTML = `
  <div style="max-width:980px;margin:0 auto">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;background:${v.mtgHdBg};border:${v.mtgHdBorder};border-radius:${v.mtgHdRadius};padding:${v.mtgHdPad};box-shadow:${v.mtgHdShadow}">
      <div>
        <div style="display:inline-flex;align-items:center;gap:7px;border:1px solid #e5e8ed;border-radius:999px;padding:4px 12px 4px 5px;margin-bottom:8px">
          <span style="width:19px;height:19px;border-radius:999px;background:linear-gradient(135deg,#8b7fd4,#f08a20);display:flex;align-items:center;justify-content:center"><i class="ti ti-microphone-2" style="font-size:11px;color:#fff"></i></span>
          <span style="font-size:11.5px;font-weight:700;color:#13161c">${esc(v.meetBadge)}</span>
        </div>
        <h2 style="margin:0;font-size:${v.h2Size};font-weight:800;letter-spacing:-.5px">Post-meeting follow-ups</h2>
      </div>
      <button data-action="toggleSection" data-key="meetings" style="width:32px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;border:1px solid #eceef1;border-radius:999px;background:#fff;cursor:pointer" class="hover-pill-btn">
        <i class="ti ${v.mtgChevron}" style="font-size:16px;color:#40464f"></i>
      </button>
    </div>

    <div class="expand-wrap${v.mtgOpen ? " expand-wrap--open" : ""}">
      <div class="expand-inner">
        <div style="display:flex;flex-direction:column;gap:14px">
          ${v.meetings.map(mt => meetCardHtml(mt, v)).join("")}
          ${v.meetEmpty ? `
          <div style="display:flex;align-items:center;gap:10px;background:#fbfbfc;border:1px dashed #e5e8ed;border-radius:16px;padding:16px 18px">
            <i class="ti ti-calendar-off" style="font-size:17px;color:#c3c8d1"></i>
            <p style="margin:0;font-size:12.5px;font-weight:600;color:#9aa1ac">No calls waiting on a follow-up note.</p>
          </div>` : ""}
        </div>
      </div>
    </div>
  </div>
  `;
}

// ---------------------------------------------------------------------------
// SENT VIEW
// ---------------------------------------------------------------------------

function sentRowHtml(m) {
  return `
  <div style="background:#fff;border:1px solid #eff0f3;border-radius:16px;padding:13px 15px">
    <div style="display:flex;align-items:center;gap:12px">
      ${avatar(m.av, m.initials, 32)}
      <div style="flex:1;min-width:0">
        <p style="margin:0;font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.name)} · ${esc(m.subject)}</p>
        <p style="margin:2px 0 0;font-size:11.5px;font-weight:500;color:#a7adb8">${esc(m.time)} · ${esc(m.origin)}</p>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex:none">
        <button data-action="toggleSent" data-id="${m.id}" aria-label="Preview sent reply" class="hover-pill-btn" style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:1px solid #eceef1;border-radius:999px;background:#fff;cursor:pointer">
          <i class="ti ${m.toggleIcon}" style="font-size:14px;color:#9aa1ac"></i>
        </button>
        <button data-action="openFeedback" data-id="${m.id}" data-kind="sent" data-val="up" aria-label="Good draft" style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:1px solid ${m.upBorder};border-radius:999px;background:${m.upBg};cursor:pointer">
          <i class="ti ti-thumb-up" style="font-size:14px;color:${m.upColor}"></i>
        </button>
        <button data-action="openFeedback" data-id="${m.id}" data-kind="sent" data-val="down" aria-label="Bad draft" style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:1px solid ${m.downBorder};border-radius:999px;background:${m.downBg};cursor:pointer">
          <i class="ti ti-thumb-down" style="font-size:14px;color:${m.downColor}"></i>
        </button>
      </div>
    </div>
    <div class="expand-wrap${m.open ? " expand-wrap--open" : ""}" style="margin-top:${m.open ? "11" : "0"}px">
      <div class="expand-inner">
        <div style="background:#f7f8fa;border-radius:12px;padding:12px 14px">
          <p style="margin:0 0 9px;font-size:13px;line-height:1.65;color:#3a404a">${esc(m.body)}</p>
          <a href="https://mail.google.com/mail/u/0/#all/${m.id}" target="_blank" style="font-size:11.5px;font-weight:700">Open in Gmail <i class="ti ti-external-link" style="font-size:12px"></i></a>
        </div>
      </div>
    </div>
  </div>
  `;
}

function renderSent(v) {
  const el = document.getElementById("view-sent");
  el.innerHTML = `
  <div style="max-width:980px;margin:0 auto">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;background:${v.sntHdBg};border:${v.sntHdBorder};border-radius:${v.sntHdRadius};padding:${v.sntHdPad};box-shadow:${v.sntHdShadow}">
      <div>
        <div style="display:inline-flex;align-items:center;gap:7px;border:1px solid #e5e8ed;border-radius:999px;padding:4px 12px 4px 5px;margin-bottom:8px">
          <span style="width:19px;height:19px;border-radius:999px;background:linear-gradient(135deg,#3fb27f,#0b8ee8);display:flex;align-items:center;justify-content:center"><i class="ti ti-send" style="font-size:11px;color:#fff"></i></span>
          <span style="font-size:11.5px;font-weight:700;color:#13161c">${v.sentCount} sent today · rate the drafts</span>
        </div>
        <h2 style="margin:0;font-size:${v.h2Size};font-weight:800;letter-spacing:-.5px">Sent</h2>
      </div>
      <button data-action="toggleSection" data-key="sent" style="width:32px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;border:1px solid #eceef1;border-radius:999px;background:#fff;cursor:pointer" class="hover-pill-btn">
        <i class="ti ${v.sentChevron}" style="font-size:16px;color:#40464f"></i>
      </button>
    </div>
    <div class="expand-wrap${v.sentOpen ? " expand-wrap--open" : ""}">
      <div class="expand-inner">
        <div style="display:flex;flex-direction:column;gap:9px">
          ${v.sent.map(m => sentRowHtml(m)).join("")}
        </div>
      </div>
    </div>
  </div>
  `;
}

// ---------------------------------------------------------------------------
// DISMISSED VIEW
// ---------------------------------------------------------------------------

function renderDismissed(v) {
  const el = document.getElementById("view-dismissed");
  el.innerHTML = `
  <div style="max-width:980px;margin:0 auto">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;background:${v.dsmHdBg};border:${v.dsmHdBorder};border-radius:${v.dsmHdRadius};padding:${v.dsmHdPad};box-shadow:${v.dsmHdShadow}">
      <div>
        <div style="display:inline-flex;align-items:center;gap:7px;border:1px solid #e5e8ed;border-radius:999px;padding:4px 12px 4px 5px;margin-bottom:8px">
          <span style="width:19px;height:19px;border-radius:999px;background:linear-gradient(135deg,#a7adb8,#e8801f);display:flex;align-items:center;justify-content:center"><i class="ti ti-archive" style="font-size:11px;color:#fff"></i></span>
          <span style="font-size:11.5px;font-weight:700;color:#13161c">${v.dismissedCount} dismissed · restore any time</span>
        </div>
        <h2 style="margin:0;font-size:${v.h2Size};font-weight:800;letter-spacing:-.5px">Dismissed</h2>
      </div>
      <button data-action="toggleSection" data-key="dismissed" style="width:32px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;border:1px solid #eceef1;border-radius:999px;background:#fff;cursor:pointer" class="hover-pill-btn">
        <i class="ti ${v.dismissedChevron}" style="font-size:16px;color:#40464f"></i>
      </button>
    </div>
    <div class="expand-wrap${v.dismissedOpen ? " expand-wrap--open" : ""}">
      <div class="expand-inner">
        ${v.hasDismissed ? `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;padding:0 2px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" data-action="toggleSelectAllDismissed" ${v.dismissedAllSelected ? "checked" : ""} style="width:16px;height:16px;accentColor:#13161c">
            <span style="font-size:12px;font-weight:700;color:#5d6470">Select all</span>
          </label>
          ${v.dismissedSelectedCount > 0 ? `
          <button data-action="confirmDeleteDismissedSelected" style="display:flex;align-items:center;gap:6px;height:30px;padding:0 13px;border:1px solid #f3c9c9;border-radius:999px;background:#fdf3f3;font-size:11.5px;font-weight:700;color:#c0392b;cursor:pointer">
            <i class="ti ti-trash" style="font-size:13px"></i>Delete ${v.dismissedSelectedCount} selected
          </button>` : ""}
        </div>` : ""}
        <div style="display:flex;flex-direction:column;gap:7px">
          ${v.dismissed.map(d => `
          <div style="display:flex;align-items:center;gap:12px;background:#fbfbfc;border:1px solid #f0f1f4;border-radius:14px;padding:10px 14px">
            <input type="checkbox" data-action="toggleSelectDismissed" data-id="${d.id}" ${d.selected ? "checked" : ""} style="flex:none;width:16px;height:16px;accentColor:#13161c">
            <i class="ti ti-mail-off" style="font-size:15px;color:#c3c8d1;flex:none"></i>
            <div style="flex:1;min-width:0">
              <p style="margin:0;font-size:13px;font-weight:600;color:#5d6470;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(d.name)} · ${esc(d.subject)}</p>
            </div>
            <span style="flex:none;font-size:11px;font-weight:600;color:#a7adb8;background:#f1f2f5;border-radius:999px;padding:3px 9px">${esc(d.meta)}</span>
            <button data-action="openFeedback" data-id="${d.id}" data-kind="${d.kind}" data-val="up" aria-label="Good call" style="flex:none;width:29px;height:29px;display:flex;align-items:center;justify-content:center;border:1px solid ${d.upBorder};border-radius:999px;background:${d.upBg};cursor:pointer">
              <i class="ti ti-thumb-up" style="font-size:13px;color:${d.upColor}"></i>
            </button>
            <button data-action="openFeedback" data-id="${d.id}" data-kind="${d.kind}" data-val="down" aria-label="Bad call" style="flex:none;width:29px;height:29px;display:flex;align-items:center;justify-content:center;border:1px solid ${d.downBorder};border-radius:999px;background:${d.downBg};cursor:pointer">
              <i class="ti ti-thumb-down" style="font-size:13px;color:${d.downColor}"></i>
            </button>
            <button data-action="restoreDismissed" data-id="${d.id}" data-name="${esc(d.name)}" class="hover-restore" style="flex:none;display:flex;align-items:center;gap:5px;height:29px;padding:0 12px;border:1px solid #e5e8ed;border-radius:999px;background:#fff;font-size:11.5px;font-weight:700;color:#40464f;cursor:pointer">
              <i class="ti ti-rotate-2" style="font-size:13px;color:#9aa1ac"></i>Restore
            </button>
          </div>
          `).join("")}
          ${v.noDismissed ? `<p style="margin:0;font-size:12.5px;color:#a7adb8">Nothing dismissed yet.</p>` : ""}
        </div>
      </div>
    </div>
  </div>
  `;
}

// Full-screen "processing" modal replacing the old thin top banner — same
// per-mailbox progress stream (see scanAndLoad), just presented as a real
// checklist instead of a single bar, since a bar alone reads as frozen for
// the long stretch between mailbox ticks with nothing else to look at.
function renderScanModal(v) {
  const el = document.getElementById("scanModalRoot");
  if (!v.scanning) {
    el.innerHTML = "";
    return;
  }
  const pct = v.scanProgress && v.scanProgress.total > 0
    ? Math.round((v.scanProgress.done / v.scanProgress.total) * 100)
    : 0;
  const barWidth = v.scanProgress ? pct + "%" : "30%";
  const barAnimation = v.scanProgress ? "scan-bar-pulse 1.4s ease-in-out infinite" : "scan-bar-sweep 1.1s ease-in-out infinite";
  el.innerHTML = `
  <div style="position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;background:rgba(15,18,24,.5);padding:20px">
    <div style="background:#fff;border-radius:22px;padding:32px 30px;max-width:400px;width:100%;box-shadow:0 24px 60px -12px rgba(16,24,40,.35);text-align:center">
      <div style="width:60px;height:60px;margin:0 auto 18px;border-radius:17px;background:linear-gradient(135deg,#0b8ee8,#f08a20);display:flex;align-items:center;justify-content:center">
        <i class="ti ti-mail-check" style="font-size:26px;color:#fff"></i>
      </div>
      <h3 style="margin:0 0 16px;font-size:18px;font-weight:800;letter-spacing:-.3px;color:#13161c">Scanning your inbox</h3>
      <div class="scan-bar-track" style="height:8px;border-radius:999px;margin-bottom:10px">
        <div class="scan-bar-fill" style="height:8px;border-radius:999px;width:${barWidth};animation:${barAnimation}"></div>
      </div>
      <p style="margin:0 0 20px;font-size:13.5px;font-weight:800;color:#0b8ee8">${v.scanProgress ? pct + "% complete" : "Getting started…"}</p>
      ${v.scanSteps.length > 0 ? `
      <div style="display:flex;flex-direction:column;gap:10px;text-align:left;margin-bottom:18px">
        ${v.scanSteps.map(step => `
        <div style="display:flex;align-items:center;gap:10px">
          <span style="width:8px;height:8px;flex:none;border-radius:999px;background:${step.status === "pending" ? "#dfe3e9" : "#0b8ee8"};${step.status === "active" ? "animation:scan-bar-pulse 1.1s ease-in-out infinite" : ""}"></span>
          <span style="font-size:13px;font-weight:600;color:${step.status === "pending" ? "#a7adb8" : "#3a404a"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(step.label)}</span>
        </div>`).join("")}
      </div>` : ""}
      <p style="margin:0;font-size:12px;font-weight:600;color:#9aa1ac">Classifying threads and drafting replies, this can take a moment.</p>
    </div>
  </div>
  `;
}

function renderConfirmDeleteDismissedModal(v) {
  const el = document.getElementById("confirmDeleteDismissedRoot");
  if (!v.confirmDeleteDismissed) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = `
  <div style="position:fixed;inset:0;z-index:110;display:flex;align-items:center;justify-content:center;background:rgba(15,18,24,.45);padding:20px">
    <div style="background:#fff;border-radius:20px;padding:22px;max-width:380px;width:100%;box-shadow:0 24px 60px -12px rgba(16,24,40,.35)">
      <h3 style="margin:0 0 8px;font-size:16px;font-weight:800;letter-spacing:-.2px">Delete ${v.dismissedSelectedCount} dismissed item${v.dismissedSelectedCount === 1 ? "" : "s"}?</h3>
      <p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:#5d6470">This permanently removes them. Unlike Restore, this can't be undone.</p>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button data-action="cancelDeleteDismissed" class="hover-pill-btn-color" style="height:38px;padding:0 16px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:12.5px;font-weight:700;color:#40464f;cursor:pointer">Cancel</button>
        <button data-action="confirmDeleteDismissedYes" class="hover-dark-btn" style="height:38px;padding:0 18px;border:0;border-radius:999px;background:#c0392b;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer">Delete</button>
      </div>
    </div>
  </div>
  `;
}

// ---------------------------------------------------------------------------
// THREAD (draft review & send) VIEW
// ---------------------------------------------------------------------------

function threadOptionHtml(o, v) {
  return `
  <div style="background:#fff;border:1.5px solid ${o.border};border-radius:20px;padding:16px 17px 14px;box-shadow:${o.ring};display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;gap:9px;margin-bottom:11px">
      <span style="font-size:11.5px;font-weight:800;color:#13161c">Option ${o.letter}</span>
      <span style="font-size:11px;font-weight:700;border-radius:999px;padding:4px 10px;background:${o.tone};color:${o.toneText}">${esc(o.label)}</span>
      <span id="draftWords-${o.i}" style="margin-left:auto;font-size:11px;font-weight:600;color:#a7adb8">${esc(o.words)}</span>
    </div>
    <textarea id="draftTa-${o.i}" data-action="editDraft" data-id="${v.thread.id}" data-i="${o.i}" spellcheck="false" class="hover-textarea" style="width:100%;min-height:${v.taMin};resize:vertical;border:1px solid #eceef1;border-radius:14px;background:#fcfcfd;padding:14px 15px;font-size:13px;line-height:1.7;color:#22272f;outline:none">${esc(o.value)}</textarea>
    <div style="display:flex;align-items:center;gap:8px;margin-top:11px">
      <button data-action="pickDraft" data-id="${v.thread.id}" data-i="${o.i}" class="hover-pill-btn-color" style="display:flex;align-items:center;gap:6px;height:32px;padding:0 12px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:11.5px;font-weight:700;color:#40464f;cursor:pointer">
        <i class="ti ${o.pickIcon}" style="font-size:14px;color:${o.pickColor}"></i>${esc(o.pickLabel)}
      </button>
      <button data-action="resetDraft" data-id="${v.thread.id}" data-i="${o.i}" class="hover-dismiss" style="margin-left:auto;height:32px;padding:0 11px;border:0;background:transparent;border-radius:999px;font-size:11.5px;font-weight:600;color:#9aa1ac;cursor:pointer">Reset edits</button>
    </div>
  </div>
  `;
}

function renderThread(v) {
  const el = document.getElementById("view-thread");
  if (!v.isThread) {
    el.innerHTML = "";
    return;
  }
  const t = v.thread;
  el.innerHTML = `
  <div style="max-width:1060px;margin:0 auto">

  <button data-action="backThread" class="hover-pill-btn-color" style="display:flex;align-items:center;gap:7px;height:32px;padding:0 13px 0 10px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:12px;font-weight:600;color:#40464f;cursor:pointer;margin-bottom:18px">
    <i class="ti ti-arrow-left" style="font-size:14px;color:#9aa1ac"></i>${esc(v.backLabel)}
  </button>

  <article style="background:#fff;border:1px solid #eff0f3;border-radius:20px;padding:20px 22px;box-shadow:0 1px 2px rgba(16,24,40,.04),0 10px 26px -18px rgba(16,24,40,.16);margin-bottom:26px">
    <div style="display:flex;flex-direction:${v.threadHeadDir};gap:13px;align-items:${v.isMobile ? "stretch" : "flex-start"};margin-bottom:14px">
      <div style="display:flex;gap:13px;align-items:flex-start;min-width:0">
        ${avatar(t.av, t.initials, 42)}
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:3px">
            <span style="font-size:15.5px;font-weight:800;letter-spacing:-.2px">${esc(t.name)}</span>
            <span style="font-size:12.5px;font-weight:500;color:#9aa1ac">${esc(t.org)}</span>
            <span style="display:inline-flex;align-items:center;gap:8px">
              <span style="width:3px;height:3px;border-radius:999px;background:#d3d7de;flex:none"></span>
              <span style="font-size:12px;font-weight:500;color:#9aa1ac">${esc(t.metaLine)}</span>
            </span>
          </div>
          <h1 style="margin:0;font-size:${v.threadSubject};font-weight:700;letter-spacing:-.3px">${esc(t.subject)}</h1>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex:none;${v.isMobile ? "justify-content:space-between;" : ""}">
        <span style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;border-radius:999px;padding:5px 11px;background:${t.tierBg};color:${t.tierColor};white-space:nowrap">
          <span style="width:6px;height:6px;border-radius:999px;background:${t.tierDot}"></span>${esc(t.tierLabel)}</span>
        <a href="https://mail.google.com/mail/u/0/#all/${t.id}" target="_blank" aria-label="Open in Gmail" class="hover-pill-btn-color" style="width:30px;height:30px;flex:none;display:flex;align-items:center;justify-content:center;border:1px solid #eceef1;border-radius:999px;background:#fff">
          <i class="ti ti-external-link" style="font-size:14px;color:#9aa1ac"></i></a>
      </div>
    </div>
    <div style="background:#f7f8fa;border-radius:14px;padding:16px 18px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:11px;padding-bottom:10px;border-bottom:1px solid #ebedf1">
        <i class="ti ${t.ctxIcon}" style="font-size:14px;color:#9aa1ac"></i>
        <span style="font-size:11.5px;font-weight:700;color:#5d6470;letter-spacing:.01em">${esc(t.ctxBadge)}</span>
      </div>
      ${t.notMeeting ? `
      <p style="margin:0;font-size:13.5px;line-height:1.75;color:#3a404a;white-space:pre-wrap">${nl2body(t.body)}</p>
      ` : ""}
      ${t.isMeeting ? `
      <div>
        ${t.hasMActions ? `
        <div>
          <p style="margin:0 0 13px;font-size:13.5px;line-height:1.75;color:#3a404a;text-wrap:pretty">${esc(t.mSummary)}</p>
          <div style="display:flex;flex-direction:column;gap:7px;padding-top:12px;border-top:1px solid #ebedf1">
            <span style="font-size:11.5px;font-weight:700;color:#5d6470;margin-bottom:1px">Action items</span>
            ${t.mActions.map(a => `
            <div style="display:flex;gap:9px;align-items:flex-start">
              <i class="ti ti-point-filled" style="font-size:13px;color:#8b7fd4;margin-top:3px;flex:none"></i>
              <span style="font-size:13px;font-weight:600;color:#3a404a;line-height:1.6;text-wrap:pretty">${esc(a.text)}</span>
            </div>`).join("")}
          </div>
        </div>` : ""}
        ${t.isMFallback ? `
        <div style="display:flex;gap:10px;align-items:flex-start;background:#fdf7ec;border:1px solid #f3e6cd;border-radius:13px;padding:13px 14px">
          <i class="ti ti-history" style="font-size:17px;color:#c9932a;margin-top:1px;flex:none"></i>
          <p style="margin:0;font-size:13px;line-height:1.65;color:#8a6a24;flex:1;text-wrap:pretty">${esc(t.mFallback)}</p>
        </div>` : ""}
      </div>` : ""}
    </div>
    <div style="display:flex;align-items:center;gap:7px;margin-top:12px">
      <i class="ti ${t.whyIcon}" style="font-size:15px;color:#0b8ee8"></i>
      <span style="font-size:12px;font-weight:600;color:#5d6470">${esc(t.why)}</span>
    </div>
  </article>

  <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:14px">
    <div>
      <div style="display:inline-flex;align-items:center;gap:7px;border:1px solid #e5e8ed;border-radius:999px;padding:4px 12px 4px 5px;margin-bottom:10px">
        <span style="width:19px;height:19px;border-radius:999px;background:linear-gradient(135deg,#0b8ee8,#f08a20);display:flex;align-items:center;justify-content:center"><i class="ti ti-pencil" style="font-size:11px;color:#fff"></i></span>
        <span style="font-size:11.5px;font-weight:700;color:#13161c">Both drafts are fully editable</span>
      </div>
      <h2 style="margin:0;font-size:21px;font-weight:800;letter-spacing:-.45px">${esc(t.heading)}</h2>
    </div>
    <span style="font-size:12px;font-weight:600;color:#9aa1ac;padding-bottom:4px">Nothing sends until you press Send</span>
  </div>

  <div style="display:grid;grid-template-columns:${v.draftCols};gap:16px;margin-bottom:18px">
    ${t.options.map(o => threadOptionHtml(o, v)).join("")}
  </div>

  <div style="background:#fff;border:1px solid #eff0f3;border-radius:20px;padding:12px 12px 12px 18px;box-shadow:0 1px 2px rgba(16,24,40,.04);display:flex;align-items:center;gap:12px;margin-bottom:20px">
    <i class="ti ti-message-2-bolt" style="font-size:18px;color:#8b7fd4;flex:none"></i>
    <input id="instructionInput" type="text" data-action="instructionField" placeholder="${esc(t.instrPlaceholder)}" style="flex:1;min-width:0;border:0;background:transparent;outline:none;font-size:13.5px;font-weight:500;color:#13161c">
    <button data-action="regenerateThread" aria-label="Regenerate draft" style="width:38px;height:38px;flex:none;border:0;border-radius:999px;background:linear-gradient(135deg,#0b8ee8,#f08a20);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 5px 14px -4px rgba(11,142,232,.45)">
      <i class="ti ti-arrow-up" style="font-size:17px;color:#fff"></i>
    </button>
  </div>

  <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-top:4px">
    <button data-action="sendThread" class="hover-dark-btn" style="display:flex;align-items:center;gap:8px;height:44px;padding:0 22px;border:0;border-radius:999px;background:#13161c;color:#fff;font-size:13.5px;font-weight:700;cursor:pointer">
      <i class="ti ti-send" style="font-size:16px"></i>${esc(t.sendLabel)}
    </button>
    <button data-action="saveDraftThread" class="hover-restore" style="display:flex;align-items:center;gap:8px;height:44px;padding:0 20px;border:1px solid #e5e8ed;border-radius:999px;background:#fff;font-size:13.5px;font-weight:700;color:#13161c;cursor:pointer">
      <i class="ti ti-file-text" style="font-size:16px;color:#9aa1ac"></i>Save as draft
    </button>
    <span style="font-size:12px;font-weight:600;color:#9aa1ac">Sending option ${esc(t.chosenLabel)} as edited</span>
    <button data-action="dismissThread" class="hover-dismiss" style="margin-left:auto;display:flex;align-items:center;gap:7px;height:40px;padding:0 15px;border:0;border-radius:999px;background:transparent;font-size:12.5px;font-weight:600;color:#9aa1ac;cursor:pointer">
      <i class="ti ti-x" style="font-size:15px"></i>${esc(t.dismissLabel)}
    </button>
  </div>
  </div>
  `;

  // Restore the in-progress custom instruction text and cursor-safe focus:
  // we intentionally do NOT re-render on every keystroke (see input listener
  // below), so this only matters right after a full re-render (e.g. reset).
  const instrEl = document.getElementById("instructionInput");
  if (instrEl) instrEl.value = state.instruction || "";
}

// ---------------------------------------------------------------------------
// SETTINGS VIEW — Mailboxes + Your account + AI assistant connectors
// ---------------------------------------------------------------------------

function mailboxRowHtml(mb) {
  return `
  <div style="background:#fff;border:1px solid #eff0f3;border-radius:18px;padding:15px 17px;box-shadow:0 1px 2px rgba(16,24,40,.04)">
    <div style="display:flex;align-items:center;gap:13px;flex-wrap:wrap">
      <div style="width:36px;height:36px;flex:none;border-radius:11px;background:#f4f6f8;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:${mb.dot}">${esc(mb.initial)}</div>
      <div style="flex:1;min-width:190px">
        <p style="margin:0;font-size:13.5px;font-weight:700;letter-spacing:-.1px">${esc(mb.address)}</p>
        <p style="margin:2px 0 0;font-size:11.5px;font-weight:500;color:#9aa1ac">${esc(mb.role)} · ${esc(mb.sync)}</p>
        ${mb.isDefault
          ? `<span style="display:inline-flex;align-items:center;gap:4px;margin-top:5px;font-size:10.5px;font-weight:700;color:#0b6fb8;background:#f1f7fd;border-radius:999px;padding:2px 8px"><i class="ti ti-star-filled" style="font-size:10px"></i>Default mailbox</span>`
          : `<button data-action="setDefaultMailbox" data-address="${esc(mb.address)}" class="hover-restore" style="margin-top:5px;display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 9px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:10.5px;font-weight:700;color:#5d6470;cursor:pointer"><i class="ti ti-star" style="font-size:11px;color:#9aa1ac"></i>Set as default</button>`}
      </div>
      <span style="display:inline-flex;align-items:center;gap:6px;flex:none;font-size:11.5px;font-weight:700;border-radius:999px;padding:5px 11px;background:${mb.stBg};color:${mb.stColor}">
        <i class="ti ${mb.stIcon}" style="font-size:13px"></i>${esc(mb.stLabel)}</span>
      <div style="display:flex;align-items:center;gap:9px;flex:none">
        <span style="font-size:11.5px;font-weight:600;color:#9aa1ac;min-width:56px;text-align:right">${esc(mb.switchLabel)}</span>
        <button data-action="toggleScan" data-mailbox="${esc(mb.address)}" aria-label="Toggle scanning" style="position:relative;width:36px;height:21px;flex:none;border:0;border-radius:999px;background:${mb.switchBg};cursor:pointer;padding:0;transition:background .18s">
          <span style="position:absolute;top:3px;left:${mb.knobLeft};width:15px;height:15px;border-radius:999px;background:#fff;transition:left .18s;box-shadow:0 1px 3px rgba(0,0,0,.25)"></span>
        </button>
        <div style="position:relative">
          <button data-action="toggleMailboxMenu" data-id="${esc(mb.id)}" aria-label="Mailbox options" class="hover-pill-btn" style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:1px solid #eceef1;border-radius:999px;background:#fff;cursor:pointer">
            <i class="ti ti-dots" style="font-size:15px;color:#9aa1ac"></i></button>
          ${mb.menuOpen ? `
          <div style="position:absolute;top:36px;right:0;z-index:50;min-width:174px;background:#fff;border:1px solid #eceef1;border-radius:14px;box-shadow:0 18px 40px -12px rgba(16,24,40,.18),0 2px 6px rgba(16,24,40,.05);padding:6px">
            <button data-action="reconnectMailbox" data-address="${esc(mb.address)}" class="hover-filter-opt" style="display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border:0;background:transparent;border-radius:10px;cursor:pointer;text-align:left">
              <i class="ti ti-refresh" style="font-size:14px;color:#9aa1ac"></i>
              <span style="font-size:12.5px;font-weight:600;color:#13161c">Reconnect</span>
            </button>
            <button data-action="removeMailbox" data-id="${esc(mb.id)}" data-address="${esc(mb.address)}" class="hover-filter-opt" style="display:flex;align-items:center;gap:8px;width:100%;padding:8px 10px;border:0;background:transparent;border-radius:10px;cursor:pointer;text-align:left">
              <i class="ti ti-trash" style="font-size:14px;color:#c0392b"></i>
              <span style="font-size:12.5px;font-weight:600;color:#c0392b">Remove mailbox</span>
            </button>
          </div>` : ""}
        </div>
      </div>
    </div>
    ${mb.needsFix ? `
    <div style="margin-top:12px;display:flex;align-items:center;gap:10px;background:#fdf3ea;border-radius:13px;padding:11px 13px">
      <i class="ti ti-key" style="font-size:15px;color:#e8801f;flex:none"></i>
      <p style="margin:0;flex:1;font-size:12.5px;font-weight:600;color:#a5561b">Google revoked the token after a password change. Nothing from this inbox has been scanned since.</p>
      <button data-action="reconnectMailbox" data-address="${esc(mb.address)}" class="hover-dark-btn" style="flex:none;height:31px;padding:0 14px;border:0;border-radius:999px;background:#13161c;color:#fff;font-size:11.5px;font-weight:700;cursor:pointer;white-space:nowrap">Reconnect</button>
    </div>` : ""}
  </div>
  `;
}

function renderSettings(v) {
  const el = document.getElementById("view-settings");
  const tokenType = state.mcpTokenVisible ? "text" : "password";
  const tokenEyeIcon = state.mcpTokenVisible ? "ti-eye-off" : "ti-eye";
  el.innerHTML = `
  <div style="max-width:860px;margin:0 auto">

  <div style="margin-bottom:24px">
    <div style="display:inline-flex;align-items:center;gap:7px;border:1px solid #e5e8ed;border-radius:999px;padding:4px 12px 4px 5px;margin-bottom:8px">
      <span style="width:19px;height:19px;border-radius:999px;background:linear-gradient(135deg,#0b8ee8,#f08a20);display:flex;align-items:center;justify-content:center"><i class="ti ti-plug-connected" style="font-size:11px;color:#fff"></i></span>
      <span style="font-size:11.5px;font-weight:700;color:#13161c">${v.mailboxTotal} mailboxes connected</span>
    </div>
    <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;letter-spacing:-.6px">Mailboxes</h1>
    <p style="margin:0;max-width:520px;font-size:13.5px;line-height:1.6;color:#5d6470;text-wrap:pretty">Every connected inbox is scanned on the same cycle. Pause one and its threads drop out of triage without disconnecting the account.</p>
  </div>

  <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">
    ${v.scanToggles.map(mb => mailboxRowHtml(mb)).join("")}
  </div>

  <button data-action="addMailbox" class="hover-add-mailbox" style="width:100%;display:flex;align-items:center;gap:12px;background:#fbfbfc;border:1.5px dashed #dfe3e9;border-radius:18px;padding:15px 17px;cursor:pointer;text-align:left;margin-bottom:34px">
    <span style="width:36px;height:36px;flex:none;border-radius:11px;background:linear-gradient(135deg,#0b8ee8,#f08a20);display:flex;align-items:center;justify-content:center"><i class="ti ti-plus" style="font-size:17px;color:#fff"></i></span>
    <span style="flex:1">
      <span style="display:block;font-size:13.5px;font-weight:700;color:#13161c">Add mailbox</span>
      <span style="display:block;margin-top:2px;font-size:11.5px;font-weight:500;color:#9aa1ac">Connect any Google account: personal, shared or alias. No limit on how many.</span>
    </span>
    <i class="ti ti-arrow-right" style="font-size:16px;color:#9aa1ac"></i>
  </button>

  <div style="margin-bottom:16px">
    <h2 style="margin:0 0 4px;font-size:19px;font-weight:800;letter-spacing:-.4px">Your account</h2>
    <p style="margin:0;font-size:13px;color:#5d6470">Used to sign drafts and as the reply-from identity.</p>
  </div>

  <div style="background:#fff;border:1px solid #eff0f3;border-radius:20px;padding:20px;box-shadow:0 1px 2px rgba(16,24,40,.04);margin-bottom:34px">
    <div style="display:flex;align-items:center;gap:14px;padding-bottom:16px;border-bottom:1px solid #f2f3f6">
      <div style="width:52px;height:52px;flex:none;border-radius:999px;background:linear-gradient(135deg,#cfe2f7,#f7ddc4);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;color:#3c4a5c">${esc(v.ownerInitials)}</div>
      <div style="flex:1;min-width:0">
        ${v.editingProfile
          ? `<input id="profileNameInput" type="text" value="${esc(v.profileNameDraft)}" style="width:100%;max-width:280px;padding:7px 10px;font-size:14px;font-weight:700;border:1px solid #bfdcf6;border-radius:9px;outline:none">`
          : `<p style="margin:0;font-size:15.5px;font-weight:800;letter-spacing:-.2px">${esc(v.ownerName)}</p>`}
        <p style="margin:2px 0 0;font-size:12.5px;font-weight:500;color:#9aa1ac">${esc(v.ownerEmail)}</p>
      </div>
      ${v.editingProfile
        ? `<button data-action="cancelEditProfile" class="hover-restore" style="flex:none;height:34px;padding:0 15px;border:1px solid #e5e8ed;border-radius:999px;background:#fff;font-size:12px;font-weight:700;color:#13161c;cursor:pointer">Cancel</button>
           <button data-action="saveEditProfile" class="hover-dark-btn" style="flex:none;height:34px;padding:0 15px;border:0;border-radius:999px;background:#13161c;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Save</button>`
        : `<button data-action="editProfile" class="hover-restore" style="flex:none;height:34px;padding:0 15px;border:1px solid #e5e8ed;border-radius:999px;background:#fff;font-size:12px;font-weight:700;color:#13161c;cursor:pointer">Edit profile</button>
           <button data-action="signOut" class="hover-restore" style="flex:none;height:34px;padding:0 15px;border:1px solid #e5e8ed;border-radius:999px;background:#fff;font-size:12px;font-weight:700;color:#c0392b;cursor:pointer">Sign out</button>`}
    </div>
    <div style="display:grid;grid-template-columns:${v.acctCols};gap:14px;padding-top:16px">
      <div>
        <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#a7adb8;letter-spacing:.04em;text-transform:uppercase">Scan cycle</p>
        <p style="margin:0;font-size:13px;font-weight:600">On open, or manual refresh</p>
      </div>
      <div>
        <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#a7adb8;letter-spacing:.04em;text-transform:uppercase">Reply promise</p>
        ${v.editingProfile
          ? `<div style="display:flex;align-items:center;gap:6px"><input id="replyPromiseInput" type="number" min="1" max="720" value="${esc(String(v.replyPromiseHours))}" style="width:64px;padding:6px 8px;font-size:13px;font-weight:600;border:1px solid #bfdcf6;border-radius:8px;outline:none"><span style="font-size:12.5px;color:#9aa1ac">hours</span></div>`
          : `<p style="margin:0;font-size:13px;font-weight:600">${esc(String(v.replyPromiseHours))} hours</p>`}
      </div>
      <div>
        <p style="margin:0 0 3px;font-size:11px;font-weight:700;color:#a7adb8;letter-spacing:.04em;text-transform:uppercase">Draft voice</p>
        ${v.editingProfile
          ? `<input id="draftVoiceInput" type="text" value="${esc(v.draftVoiceDraft)}" placeholder="e.g. Direct, warm, no em dashes" style="width:100%;padding:6px 8px;font-size:13px;font-weight:600;border:1px solid #bfdcf6;border-radius:8px;outline:none">`
          : `<p style="margin:0;font-size:13px;font-weight:600">${esc(v.draftVoice || "Warm-but-concrete (default)")}</p>`}
      </div>
    </div>
  </div>

  <div style="margin-bottom:16px">
    <h2 style="margin:0 0 4px;font-size:19px;font-weight:800;letter-spacing:-.4px">VIP senders</h2>
    <p style="margin:0;font-size:13px;color:#5d6470">Threads from these people always show as needing a reply, regardless of how the AI would otherwise classify them.</p>
  </div>

  <div style="background:#fff;border:1px solid #eff0f3;border-radius:20px;padding:20px;box-shadow:0 1px 2px rgba(16,24,40,.04);margin-bottom:34px">
    ${v.vips.length === 0
      ? `<p style="margin:0 0 16px;font-size:13px;color:#9aa1ac">No VIPs yet, add someone below, or pull suggestions from your recent inbox activity.</p>`
      : `<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
          ${v.vips.map(p => `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid #f2f3f6;border-radius:12px">
              ${avatar(p.av, p.initials, 32)}
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700;color:#13161c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.name || p.address)}</div>
                ${p.name ? `<div style="font-size:11.5px;font-weight:500;color:#9aa1ac">${esc(p.address)}</div>` : ""}
              </div>
              <button data-action="removeVip" data-id="${esc(p.id)}" aria-label="Remove VIP" class="hover-restore" style="flex:none;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:1px solid #e5e8ed;border-radius:999px;background:#fff;cursor:pointer">
                <i class="ti ti-x" style="font-size:14px;color:#9aa1ac"></i>
              </button>
            </div>`).join("")}
        </div>`}

    <div style="display:flex;gap:8px">
      <input id="vipAddInput" type="email" placeholder="Add by email address" value="${esc(v.vipInput)}" style="flex:1;height:38px;border:1px solid #eceef1;border-radius:11px;background:#f7f8fa;padding:0 13px;font-size:12.5px;font-weight:600;color:#13161c;outline:none">
      <button data-action="addVipManual" class="hover-dark-btn" style="flex:none;height:38px;padding:0 16px;border:0;border-radius:999px;background:#13161c;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Add</button>
    </div>

    ${v.vipSuggestions.length
      ? `<div style="margin-top:18px;padding-top:16px;border-top:1px solid #f2f3f6">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:${v.vipSuggestOpen ? "10px" : "0"}">
            <p style="margin:0;font-size:11px;font-weight:700;color:#a7adb8;letter-spacing:.04em;text-transform:uppercase">Suggested from your inbox</p>
            <button data-action="toggleSection" data-key="vipSuggestions" aria-label="${v.vipSuggestOpen ? "Collapse" : "Expand"}" style="flex:none;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:1px solid #eceef1;border-radius:999px;background:#fff;cursor:pointer" class="hover-pill-btn">
              <i class="ti ${v.vipSuggestChevron}" style="font-size:14px;color:#40464f"></i>
            </button>
          </div>
          <div class="expand-wrap${v.vipSuggestOpen ? " expand-wrap--open" : ""}">
            <div class="expand-inner">
              <div style="display:flex;flex-direction:column;gap:8px">
                ${v.vipSuggestions.map(c => `
                  <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid #f2f3f6;border-radius:12px">
                    <div style="flex:1;min-width:0">
                      <div style="font-size:13px;font-weight:700;color:#13161c;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.name || c.address)}</div>
                      <div style="font-size:11.5px;font-weight:500;color:#9aa1ac">${c.sentCount} sent · ${c.receivedCount} received</div>
                    </div>
                    <button data-action="addVipSuggestion" data-address="${esc(c.address)}" data-name="${esc(c.name || "")}" class="hover-restore" style="flex:none;height:30px;padding:0 13px;border:1px solid #e5e8ed;border-radius:999px;background:#fff;font-size:11.5px;font-weight:700;color:#13161c;cursor:pointer">+ Add</button>
                  </div>`).join("")}
              </div>
            </div>
          </div>
        </div>`
      : v.vipSuggestLoading
        ? `<div style="display:flex;align-items:center;gap:8px;margin-top:16px">
            <span style="flex:1;display:flex;align-items:center;justify-content:center;height:36px;border:1px dashed #dfe3e9;border-radius:11px;background:#fbfbfc;font-size:12px;font-weight:700;color:#5d6470">Scanning your inbox…</span>
            <button data-action="stopVipSuggestions" style="flex:none;height:36px;padding:0 14px;border:1px solid #e5e8ed;border-radius:11px;background:#fff;font-size:12px;font-weight:700;color:#c0392b;cursor:pointer">Stop</button>
          </div>`
        : `<button data-action="loadVipSuggestions" class="hover-restore" style="width:100%;margin-top:16px;height:36px;border:1px dashed #dfe3e9;border-radius:11px;background:#fbfbfc;font-size:12px;font-weight:700;color:#5d6470;cursor:pointer">
            Suggest contacts from my inbox
          </button>`}
  </div>

  <div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:16px">
    <div>
      <h2 style="margin:0 0 4px;font-size:19px;font-weight:800;letter-spacing:-.4px">AI assistant connectors</h2>
      <p style="margin:0;font-size:13px;color:#5d6470">Let an AI assistant query this dashboard directly, e.g. "did I reply to Marcus about the Q3 pricing?", without opening the app.</p>
    </div>
    <button data-action="toggleSection" data-key="mcp" style="width:32px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;border:1px solid #eceef1;border-radius:999px;background:#fff;cursor:pointer" class="hover-pill-btn">
      <i class="ti ${v.mcpChevron}" style="font-size:16px;color:#40464f"></i>
    </button>
  </div>

  <div class="expand-wrap${v.mcpOpen ? " expand-wrap--open" : ""}">
    <div class="expand-inner">
  <div style="background:#fff;border:1px solid #eff0f3;border-radius:20px;padding:20px;box-shadow:0 1px 2px rgba(16,24,40,.04)">
    <div style="display:flex;align-items:center;gap:13px;flex-wrap:wrap;padding-bottom:16px;border-bottom:1px solid #f2f3f6">
      <div style="width:36px;height:36px;flex:none;border-radius:11px;background:linear-gradient(135deg,#0b8ee8,#f08a20);display:flex;align-items:center;justify-content:center"><i class="ti ti-sparkles" style="font-size:16px;color:#fff"></i></div>
      <div style="flex:1;min-width:190px">
        <p style="margin:0;font-size:13.5px;font-weight:700;letter-spacing:-.1px">AI assistant (MCP)</p>
        <p style="margin:2px 0 0;font-size:11.5px;font-weight:500;color:#9aa1ac">Works with Claude and other MCP-compatible assistants · read-only access to this dashboard</p>
      </div>
      <span style="display:inline-flex;align-items:center;gap:6px;flex:none;font-size:11.5px;font-weight:700;border-radius:999px;padding:5px 11px;background:#f1f2f5;color:#5d6470">
        <i class="ti ti-plug-off" style="font-size:13px"></i>Not connected</span>
    </div>

    <div style="display:grid;grid-template-columns:1fr;gap:16px;padding-top:16px">
      <div>
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#a7adb8;letter-spacing:.04em;text-transform:uppercase">Server URL</p>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <input id="mcpServerUrl" type="text" readonly value="${esc(window.location.origin)}/api/mcp" style="flex:1;min-width:160px;height:38px;border:1px solid #eceef1;border-radius:11px;background:#f7f8fa;padding:0 13px;font-size:12.5px;font-weight:600;color:#40464f;outline:none">
          <button data-action="copyMcpUrl" aria-label="Copy server URL" class="hover-pill-btn" style="width:38px;height:38px;flex:none;display:flex;align-items:center;justify-content:center;border:1px solid #eceef1;border-radius:11px;background:#fff;cursor:pointer">
            <i class="ti ti-copy" style="font-size:15px;color:#9aa1ac"></i>
          </button>
        </div>
        <p style="margin:6px 0 0;font-size:11px;font-weight:500;color:#9aa1ac">Add this as a custom connector in Claude (or another MCP client). A local URL only works for tools running on this same machine, deploy the app for Claude itself to reach it.</p>
      </div>
      <div>
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#a7adb8;letter-spacing:.04em;text-transform:uppercase">Auth token</p>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <input id="mcpAuthToken" type="${tokenType}" readonly value="${esc(state.mcpToken || "")}" placeholder="Not yet generated" style="flex:1;min-width:160px;height:38px;border:1px solid #eceef1;border-radius:11px;background:#f7f8fa;padding:0 13px;font-size:12.5px;font-weight:600;color:#40464f;outline:none">
          <button data-action="toggleMcpTokenVisible" aria-label="Toggle token visibility" class="hover-pill-btn" style="width:38px;height:38px;flex:none;display:flex;align-items:center;justify-content:center;border:1px solid #eceef1;border-radius:11px;background:#fff;cursor:pointer">
            <i class="ti ${tokenEyeIcon}" style="font-size:15px;color:#9aa1ac"></i>
          </button>
          <button data-action="generateMcpToken" class="hover-restore" style="flex:none;height:38px;padding:0 15px;border:1px solid #e5e8ed;border-radius:999px;background:#fff;font-size:12px;font-weight:700;color:#13161c;cursor:pointer;white-space:nowrap">Generate token</button>
        </div>
        ${state.mcpToken ? `<p style="margin:6px 0 0;font-size:11px;font-weight:600;color:#a5561b">Copy this now, it won't be shown again. Regenerating replaces it.</p>` : ""}
      </div>
    </div>

    <p style="margin:16px 0 0;font-size:11.5px;font-weight:500;color:#9aa1ac">ChatGPT, Gemini, Perplexity, and additional transcript-tool connectors are planned for a later phase.</p>
  </div>
    </div>
  </div>

  </div>
  `;
}

// ---------------------------------------------------------------------------
// SEND CONFIRMATION MODAL
// ---------------------------------------------------------------------------
// Explicit two-step send per Ellen's 2026-08-02 request: click Send opens
// this confirm dialog (nothing sends yet), confirming here starts a 6-second
// undo window (see startDelayedSend) before the Gmail API call actually
// fires — real sends can't be "undone" after the fact the way a category
// move can, so the only honest way to offer Undo is to delay the send
// itself, same mechanism as Gmail's own Undo Send.
function renderConfirmSendModal() {
  const el = document.getElementById("confirmSendRoot");
  const c = state.confirmSend;
  if (!c) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = `
  <div style="position:fixed;inset:0;z-index:110;display:flex;align-items:center;justify-content:center;background:rgba(15,18,24,.45);padding:20px">
    <div style="background:#fff;border-radius:20px;padding:22px;max-width:380px;width:100%;box-shadow:0 24px 60px -12px rgba(16,24,40,.35)">
      <h3 style="margin:0 0 8px;font-size:16px;font-weight:800;letter-spacing:-.2px">${esc(c.label)} to ${esc(c.name || "this recipient")}?</h3>
      <p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:#5d6470">This sends for real through Gmail. You'll get a few seconds to undo right after confirming, before it actually goes out.</p>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button data-action="cancelSendConfirm" class="hover-pill-btn-color" style="height:38px;padding:0 16px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:12.5px;font-weight:700;color:#40464f;cursor:pointer">Cancel</button>
        <button data-action="confirmSendYes" class="hover-dark-btn" style="height:38px;padding:0 18px;border:0;border-radius:999px;background:#13161c;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer">${esc(c.label)}</button>
      </div>
    </div>
  </div>
  `;
}

function renderConfirmRescanModal(v) {
  const el = document.getElementById("confirmRescanRoot");
  if (!v.confirmRescan) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = `
  <div style="position:fixed;inset:0;z-index:110;display:flex;align-items:center;justify-content:center;background:rgba(15,18,24,.45);padding:20px">
    <div style="background:#fff;border-radius:20px;padding:22px;max-width:380px;width:100%;box-shadow:0 24px 60px -12px rgba(16,24,40,.35)">
      <h3 style="margin:0 0 8px;font-size:16px;font-weight:800;letter-spacing:-.2px">Rescan your inbox now?</h3>
      <p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:#5d6470">Last scanned ${esc(v.lastScanned)}. This re-checks every connected mailbox for new mail, it can take a moment.</p>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button data-action="cancelRescan" class="hover-pill-btn-color" style="height:38px;padding:0 16px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:12.5px;font-weight:700;color:#40464f;cursor:pointer">Cancel</button>
        <button data-action="confirmRescanYes" class="hover-dark-btn" style="height:38px;padding:0 18px;border:0;border-radius:999px;background:#13161c;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer">Rescan</button>
      </div>
    </div>
  </div>
  `;
}

// Claude-style feedback pattern: thumb up/down -> a matching set of 5
// toggleable reason tags -> optional comment -> Save. Every step after the
// thumb is skippable — a bare thumb + Save is a fully valid submission.
// Shared by Dismissed cards (threads/followups/meetings) and Sent cards.
const FEEDBACK_TAGS = {
  up: ["Accurate", "Good tone", "Right call", "Relevant", "Saved time"],
  down: ["Inaccurate", "Wrong tone", "Wrong call", "Not relevant", "Missed context"]
};

const FEEDBACK_ROUTE_BY_KIND = {
  thread: "/api/threads/",
  followup: "/api/followups/",
  meeting: "/api/meetings/",
  sent: "/api/sent/"
};

function renderFeedbackPopupModal() {
  const el = document.getElementById("feedbackPopupRoot");
  const p = state.feedbackPopup;
  if (!p) {
    el.innerHTML = "";
    return;
  }
  const tags = p.val ? FEEDBACK_TAGS[p.val] : [];
  el.innerHTML = `
  <div style="position:fixed;inset:0;z-index:110;display:flex;align-items:center;justify-content:center;background:rgba(15,18,24,.45);padding:20px">
    <div style="background:#fff;border-radius:20px;padding:22px;max-width:400px;width:100%;box-shadow:0 24px 60px -12px rgba(16,24,40,.35)">
      <h3 style="margin:0 0 14px;font-size:16px;font-weight:800;letter-spacing:-.2px">How was this?</h3>
      <div style="display:flex;gap:8px">
        <button data-action="pickFeedbackValue" data-val="up" aria-label="Good" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:1px solid ${p.val === "up" ? "#bde3ce" : "#eceef1"};border-radius:999px;background:${p.val === "up" ? "#dcf0e6" : "#fff"};cursor:pointer">
          <i class="ti ti-thumb-up" style="font-size:17px;color:${p.val === "up" ? "#2b7355" : "#9aa1ac"}"></i>
        </button>
        <button data-action="pickFeedbackValue" data-val="down" aria-label="Bad" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:1px solid ${p.val === "down" ? "#f4d0ba" : "#eceef1"};border-radius:999px;background:${p.val === "down" ? "#fce6d8" : "#fff"};cursor:pointer">
          <i class="ti ti-thumb-down" style="font-size:17px;color:${p.val === "down" ? "#a5561b" : "#9aa1ac"}"></i>
        </button>
      </div>
      <div class="expand-wrap${p.val ? " expand-wrap--open" : ""}">
        <div class="expand-inner">
          <div style="display:flex;flex-wrap:wrap;gap:7px;padding-top:14px">
            ${tags.map(tag => {
              const on = p.tags.indexOf(tag) >= 0;
              return `<button data-action="toggleFeedbackTag" data-tag="${esc(tag)}" style="height:30px;padding:0 12px;border:1px solid ${on ? "#c7d8ee" : "#eceef1"};border-radius:999px;background:${on ? "#eaf3fd" : "#fff"};font-size:12px;font-weight:700;color:${on ? "#0b6fb8" : "#5d6470"};cursor:pointer">${esc(tag)}</button>`;
            }).join("")}
          </div>
          <textarea id="feedbackPopupNoteInput" data-action="feedbackPopupNote" placeholder="Add a comment (optional)" style="margin-top:11px;width:100%;min-height:64px;resize:vertical;border:1px solid #eceef1;border-radius:12px;background:#fcfcfd;padding:10px 12px;font-size:12.5px;line-height:1.6;color:#22272f;outline:none">${esc(p.note)}</textarea>
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px">
        <button data-action="closeFeedbackPopup" class="hover-pill-btn-color" style="height:38px;padding:0 16px;border:1px solid #eceef1;border-radius:999px;background:#fff;font-size:12.5px;font-weight:700;color:#40464f;cursor:pointer">Cancel</button>
        <button data-action="saveFeedbackPopup" ${p.val ? "" : "disabled"} class="hover-dark-btn" style="height:38px;padding:0 18px;border:0;border-radius:999px;background:${p.val ? "#13161c" : "#c3c8d1"};color:#fff;font-size:12.5px;font-weight:700;cursor:${p.val ? "pointer" : "default"}">Save</button>
      </div>
    </div>
  </div>
  `;
}

const SEARCH_SOURCE_LABELS = {
  needs_reply: "Needs reply",
  low_confidence: "Low confidence",
  follow_up: "Follow-up",
  sent: "Sent",
  dismissed: "Dismissed",
};

// openThread's shared detail view only covers threads/lowConf/followUps/
// meetings (see the `ALL` array built elsewhere in this file) — sent and
// dismissed items aren't in it, so a result from either of those jumps to
// its tab instead of the (unsupported) detail view.
const SEARCH_JUMPABLE_SOURCES = { needs_reply: true, low_confidence: true, follow_up: true };
const SEARCH_TAB_BY_SOURCE = { sent: "sent", dismissed: "dismissed" };

function renderSearchResults(v) {
  const el = document.getElementById("searchResultsPanel");
  if (!v.searchOpen) {
    el.classList.add("hidden");
    el.innerHTML = "";
    return;
  }
  el.classList.remove("hidden");

  if (v.searchLoading) {
    el.innerHTML = `<div style="padding:16px;font-size:12.5px;font-weight:600;color:#9aa1ac">Searching…</div>`;
    return;
  }
  if (v.searchResults.length === 0) {
    el.innerHTML = `<div style="padding:16px;font-size:12.5px;font-weight:600;color:#9aa1ac">No matches for "${esc(v.searchQuery)}"</div>`;
    return;
  }
  el.innerHTML = v.searchResults
    .slice(0, 12)
    .map((r) => `
    <button data-action="openSearchResult" data-id="${esc(r.id)}" data-source="${esc(r.source)}" class="hover-filter-opt" style="display:flex;align-items:center;gap:10px;width:100%;padding:11px 14px;border:0;border-bottom:1px solid #f2f3f6;background:transparent;cursor:pointer;text-align:left">
      <span style="flex:none;font-size:10px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:#0b8ee8;background:#e8f4fd;border-radius:6px;padding:3px 7px;white-space:nowrap">${esc(SEARCH_SOURCE_LABELS[r.source] || r.source)}</span>
      <span style="flex:1;min-width:0">
        <span style="display:block;font-size:13px;font-weight:700;color:#13161c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.subject || r.title || "(no subject)")}</span>
        <span style="display:block;margin-top:1px;font-size:11.5px;font-weight:500;color:#9aa1ac;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc([r.name, r.mailbox].filter(Boolean).join(" · "))}</span>
      </span>
    </button>`)
    .join("");
}

// ---------------------------------------------------------------------------
// MASTER RENDER
// ---------------------------------------------------------------------------

function renderAll() {
  const v = renderVals();
  renderShell(v);
  renderHome(v);
  renderInbox(v);
  renderMeetings(v);
  renderSent(v);
  renderDismissed(v);
  renderConfirmSendModal();
  renderConfirmRescanModal(v);
  renderConfirmDeleteDismissedModal(v);
  renderScanModal(v);
  renderFeedbackPopupModal();
  renderSearchResults(v);
  renderSettings(v);
  renderThread(v);
}

// ---------------------------------------------------------------------------
// DELEGATED CLICK HANDLER
// ---------------------------------------------------------------------------

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;

  switch (action) {
    case "closeDrawer":
      state.drawer = false;
      renderAll();
      break;

    case "openDrawer":
      state.drawer = true;
      renderAll();
      break;

    case "goHome":
      state.view = "home";
      state.activeNav = "home";
      state.openId = null;
      state.drawer = false;
      renderAll();
      break;

    case "toggleInbox":
      state.inboxOpen = state.view === "inbox" ? !state.inboxOpen : true;
      state.activeNav = "inbox";
      state.view = "inbox";
      state.openId = null;
      state.drawer = false;
      renderAll();
      break;

    case "navTo":
      state.activeNav = el.dataset.view;
      state.view = el.dataset.view;
      state.drawer = false;
      state.openId = null;
      renderAll();
      if (el.dataset.view === "settings" && !state.vipsLoaded) {
        state.vipsLoaded = true;
        loadVips();
      }
      break;

    case "refresh":
      state.confirmRescan = true;
      renderAll();
      break;

    case "cancelRescan":
      state.confirmRescan = false;
      renderAll();
      break;

    case "confirmRescanYes":
      state.confirmRescan = false;
      state.spin += 360;
      renderAll();
      scanAndLoad();
      break;

    case "openSearchResult": {
      const source = el.dataset.source;
      state.searchOpen = false;
      const input = document.getElementById("searchInput");
      if (input) input.value = "";
      if (SEARCH_JUMPABLE_SOURCES[source]) {
        openThread(el.dataset.id);
      } else {
        goTab(SEARCH_TAB_BY_SOURCE[source] || "home");
      }
      renderAll();
      break;
    }

    case "toggleFilter":
      state.openFilter = state.openFilter === el.dataset.filter ? null : el.dataset.filter;
      renderAll();
      break;

    case "pickFilter":
      setFilter(el.dataset.filter, el.dataset.value);
      renderAll();
      break;

    case "clearFilters":
      state.filterVals = { priority: null, mailbox: state.defaultMailbox, date: null, sender: null };
      state.openFilter = null;
      state.fuAging = false;
      renderAll();
      break;

    case "toggleSection":
      toggleSection(el.dataset.key);
      renderAll();
      break;

    case "clearAging":
      state.fuAging = false;
      renderAll();
      break;

    // ---------- Home summary-card / mailbox-row navigation ----------
    case "homeCard":
      handleHomeGo(el.dataset.go);
      renderAll();
      break;

    case "mailboxRowOpen":
      state.view = "inbox"; state.activeNav = "inbox"; state.drawer = false; state.openId = null;
      state.filterVals = Object.assign({}, state.filterVals, { mailbox: el.dataset.mailbox });
      state.activeMailbox = el.dataset.mailbox;
      renderAll();
      break;

    case "mailboxStat":
      handleMailboxStatGo(el.dataset.go, el.dataset.mailbox);
      renderAll();
      break;

    // ---------- Follow-ups: needs-reply / low-confidence cards ----------
    case "toggleCard":
      state.expanded = Object.assign({}, state.expanded, { [el.dataset.id]: !state.expanded[el.dataset.id] });
      renderAll();
      break;

    case "dismissCard":
      moveCardCategory(el.dataset.id, "dismissed", el.dataset.name);
      renderAll();
      break;

    case "toggleMoveMenu":
      state.openMoveMenu = state.openMoveMenu === el.dataset.id ? null : el.dataset.id;
      renderAll();
      break;

    case "moveCard":
      moveCardCategory(el.dataset.id, el.dataset.status, el.dataset.name);
      state.openMoveMenu = null;
      renderAll();
      break;

    case "openThread":
      openThread(el.dataset.id);
      renderAll();
      break;

    case "searchMailbox":
      flash("Searching full mailbox history for " + el.dataset.name);
      renderAll();
      break;

    // ---------- Follow-ups: needs-follow-up cards ----------
    case "toggleFu":
      state.expanded = Object.assign({}, state.expanded, { ["fu-" + el.dataset.id]: !state.expanded["fu-" + el.dataset.id] });
      renderAll();
      break;

    case "dismissFu": {
      // Manual-origin cards are threads rows (persist via moveCardCategory);
      // sent-origin ones are followups rows (persist via dismissFollowup).
      const fuItem = FOLLOWUPS.filter(t => t.id === el.dataset.id)[0];
      if (fuItem && fuItem.origin === "manual") {
        moveCardCategory(el.dataset.id, "dismissed", el.dataset.name);
      } else {
        dismissFollowup(el.dataset.id, el.dataset.name);
      }
      renderAll();
      break;
    }

    case "draftFu":
      openThread(el.dataset.id);
      renderAll();
      break;

    case "openOldest": {
      const gone = id => state.dismissedIds.indexOf(id) >= 0 || state.sentIds.indexOf(id) >= 0;
      const mbF = state.filterVals.mailbox;
      const prF = state.filterVals.priority;
      const liveT = t => !gone(t.id) && (!mbF || t.mailbox === mbF) && (!prF || TIERS[t.tier].label === prF);
      const hrs = w => (w.slice(-1) === "d" ? parseInt(w, 10) * 24 : parseInt(w, 10));
      const open = THREADS.filter(liveT);
      if (open.length) openThread(open.slice().sort((a, b) => hrs(b.waited) - hrs(a.waited))[0].id);
      renderAll();
      break;
    }

    // ---------- Post-meeting cards ----------
    case "toggleMeet":
      state.expanded = Object.assign({}, state.expanded, { ["mt-" + el.dataset.id]: !state.expanded["mt-" + el.dataset.id] });
      renderAll();
      break;

    case "dismissMeet":
      dismissMeeting(el.dataset.id, el.dataset.name);
      renderAll();
      break;

    // ---------- Sent ----------
    case "toggleSent":
      state.expanded = Object.assign({}, state.expanded, { ["sent-" + el.dataset.id]: !state.expanded["sent-" + el.dataset.id] });
      renderAll();
      break;

    // ---------- Feedback popup (thumb -> tags -> comment -> Save) ----------
    case "openFeedback": {
      const id = el.dataset.id, kind = el.dataset.kind, val = el.dataset.val;
      const source = kind === "sent" ? SENT.filter(m => m.id === id)[0] : DISMISSED.filter(m => m.id === id)[0];
      // Prefer this-session optimistic overlays over the server-loaded
      // source so reopening the popup after an earlier save this session
      // (before the next full reload) shows what was actually saved.
      const storedVal = state.feedback[id] !== undefined ? state.feedback[id] : ((source && source.feedback) || null);
      const storedTags = state.feedbackTagsMap[id] !== undefined ? state.feedbackTagsMap[id] : ((source && source.feedbackTags) || []);
      const storedNote = state.feedbackNotes[id] !== undefined ? state.feedbackNotes[id] : ((source && source.feedbackNote) || "");
      const sameVal = storedVal === val;
      state.feedbackPopup = {
        id: id,
        kind: kind,
        val: val,
        tags: sameVal ? storedTags.slice() : [],
        note: sameVal ? storedNote : ""
      };
      renderAll();
      break;
    }

    case "pickFeedbackValue": {
      if (!state.feedbackPopup) break;
      const val = el.dataset.val;
      state.feedbackPopup = Object.assign({}, state.feedbackPopup, {
        val: state.feedbackPopup.val === val ? null : val
      });
      renderAll();
      break;
    }

    case "toggleFeedbackTag": {
      if (!state.feedbackPopup) break;
      const tag = el.dataset.tag;
      const tags = state.feedbackPopup.tags.indexOf(tag) >= 0
        ? state.feedbackPopup.tags.filter(t => t !== tag)
        : state.feedbackPopup.tags.concat([tag]);
      state.feedbackPopup = Object.assign({}, state.feedbackPopup, { tags });
      renderAll();
      break;
    }

    case "closeFeedbackPopup":
      state.feedbackPopup = null;
      renderAll();
      break;

    case "saveFeedbackPopup": {
      const p = state.feedbackPopup;
      if (!p || !p.val) break;
      state.feedback = Object.assign({}, state.feedback, { [p.id]: p.val });
      state.feedbackTagsMap = Object.assign({}, state.feedbackTagsMap, { [p.id]: p.tags });
      state.feedbackNotes = Object.assign({}, state.feedbackNotes, { [p.id]: p.note });
      state.feedbackPopup = null;
      renderAll();
      // Only real backing rows can take feedback — Sent's "just sent this
      // session" placeholders (before real Gmail send exists) have no
      // backing row yet, so skip the PATCH for those and keep it visual-only.
      if (p.kind !== "sent" || SENT.some(m => m.id === p.id)) {
        fetch(FEEDBACK_ROUTE_BY_KIND[p.kind] + p.id + "/feedback", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback: p.val, tags: p.tags, note: p.note })
        }).catch(err => {
          console.error("Failed to save feedback", err);
          flash("Couldn't save feedback, refresh and try again");
        });
      }
      break;
    }

    // ---------- Dismissed ----------
    case "restoreDismissed":
      restoreFromDismissed(el.dataset.id, el.dataset.name);
      state.dismissedSelected = state.dismissedSelected.filter(id => id !== el.dataset.id);
      renderAll();
      break;

    case "toggleSelectDismissed": {
      const id = el.dataset.id;
      state.dismissedSelected = state.dismissedSelected.indexOf(id) >= 0
        ? state.dismissedSelected.filter(x => x !== id)
        : state.dismissedSelected.concat([id]);
      renderAll();
      break;
    }

    case "toggleSelectAllDismissed": {
      const mbF = state.filterVals.mailbox;
      const visibleIds = DISMISSED.filter(d => !mbF || d.mailbox === mbF).map(d => d.id);
      const allSelected = visibleIds.length > 0 && visibleIds.every(id => state.dismissedSelected.indexOf(id) >= 0);
      state.dismissedSelected = allSelected ? [] : visibleIds;
      renderAll();
      break;
    }

    case "confirmDeleteDismissedSelected":
      state.confirmDeleteDismissed = true;
      renderAll();
      break;

    case "cancelDeleteDismissed":
      state.confirmDeleteDismissed = false;
      renderAll();
      break;

    case "confirmDeleteDismissedYes": {
      const ids = state.dismissedSelected;
      const items = DISMISSED.filter(d => ids.indexOf(d.id) >= 0).map(d => ({
        id: d.id,
        kind: d.origin === "sent" ? "followup" : d.origin === "meeting" ? "meeting" : "thread"
      }));
      state.confirmDeleteDismissed = false;
      el.disabled = true;
      fetch("/api/dismissed", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
        .then(res => { if (!res.ok) throw new Error("Request failed"); })
        .then(() => {
          for (let i = DISMISSED.length - 1; i >= 0; i--) {
            if (ids.indexOf(DISMISSED[i].id) >= 0) DISMISSED.splice(i, 1);
          }
          state.dismissedIds = state.dismissedIds.filter(id => ids.indexOf(id) < 0);
          state.dismissedSelected = [];
          flash(`${ids.length} dismissed item${ids.length === 1 ? "" : "s"} deleted`);
          renderAll();
        })
        .catch(err => {
          console.error("Failed to delete dismissed items", err);
          flash("Couldn't delete, try again");
          renderAll();
        });
      break;
    }

    // ---------- Settings: Mailboxes ----------
    case "toggleScan": {
      const address = el.dataset.mailbox;
      state.scanOff = state.scanOff.indexOf(address) < 0
        ? state.scanOff.concat([address])
        : state.scanOff.filter(a => a !== address);
      renderAll();
      break;
    }

    case "reconnectMailbox":
    case "addMailbox":
      // Full navigation, not fetch — this has to leave the SPA to reach
      // Google's real consent screen. Lands back on "/" via the callback's
      // redirect once done (see the ?mailboxConnected/?mailboxError handling
      // in the bootstrap section below).
      window.location.href = "/api/mailboxes/connect";
      break;

    case "toggleMailboxMenu":
      state.openMailboxMenu = state.openMailboxMenu === el.dataset.id ? null : el.dataset.id;
      renderAll();
      break;

    case "removeMailbox": {
      const address = el.dataset.address;
      state.openMailboxMenu = null;
      if (!window.confirm(`Remove ${address}? This permanently deletes its scanned threads, sent history, and follow-ups. This can't be undone.`)) {
        renderAll();
        break;
      }
      fetch("/api/mailboxes/" + el.dataset.id, { method: "DELETE" })
        .then(res => {
          if (!res.ok) throw new Error("Request failed");
          window.location.reload();
        })
        .catch(err => {
          console.error("Failed to remove mailbox", err);
          flash("Couldn't remove that mailbox, try again");
          renderAll();
        });
      renderAll();
      break;
    }

    case "signOut":
      el.disabled = true;
      fetch("/api/logout", { method: "POST" })
        .then(() => { window.location.href = "/connect"; })
        .catch(err => {
          console.error("Sign out failed", err);
          el.disabled = false;
          flash("Couldn't sign out, try again");
          renderAll();
        });
      break;

    case "editProfile":
      state.editingProfile = true;
      state.profileNameDraft = state.ownerName || "";
      state.draftVoiceDraft = state.draftVoice || "";
      renderAll();
      document.getElementById("profileNameInput")?.focus();
      break;

    case "cancelEditProfile":
      state.editingProfile = false;
      renderAll();
      break;

    case "saveEditProfile": {
      const nameInput = document.getElementById("profileNameInput");
      const replyInput = document.getElementById("replyPromiseInput");
      const voiceInput = document.getElementById("draftVoiceInput");
      const name = (nameInput ? nameInput.value : state.profileNameDraft).trim();
      const replyPromiseHours = replyInput ? parseInt(replyInput.value, 10) : state.replyPromiseHours;
      const draftVoice = (voiceInput ? voiceInput.value : state.draftVoiceDraft).trim();
      if (!name) { flash("Name can't be empty"); renderAll(); break; }
      if (!Number.isFinite(replyPromiseHours) || replyPromiseHours < 1) { flash("Reply promise must be at least 1 hour"); renderAll(); break; }
      el.disabled = true;
      fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, replyPromiseHours, draftVoice }),
      })
        .then(res => { if (!res.ok) throw new Error("Request failed"); return res.json(); })
        .then(data => {
          state.ownerName = data.name;
          state.replyPromiseHours = data.replyPromiseHours;
          state.draftVoice = data.draftVoice;
          state.editingProfile = false;
          renderAll();
        })
        .catch(err => {
          console.error("Failed to save profile", err);
          el.disabled = false;
          flash("Couldn't save, try again");
          renderAll();
        });
      break;
    }

    case "setDefaultMailbox": {
      const address = el.dataset.address;
      state.defaultMailbox = address;
      state.activeMailbox = address;
      state.filterVals = Object.assign({}, state.filterVals, { mailbox: address });
      flash(address + " set as your default mailbox");
      renderAll();
      break;
    }

    // ---------- Settings: VIP senders ----------
    case "addVipManual": {
      const input = document.getElementById("vipAddInput");
      const address = (input ? input.value : state.vipInput).trim();
      if (!address || !address.includes("@")) { flash("Enter a valid email address"); renderAll(); break; }
      el.disabled = true;
      fetch("/api/senders/vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      })
        .then(res => { if (!res.ok) throw new Error("Request failed"); return res.json(); })
        .then(data => {
          state.vips = [data.vip, ...state.vips.filter(v => v.id !== data.vip.id)];
          state.vipSuggestions = state.vipSuggestions.filter(c => c.address.toLowerCase() !== data.vip.address);
          state.vipInput = "";
          renderAll();
        })
        .catch(err => {
          console.error("Failed to add VIP", err);
          el.disabled = false;
          flash("Couldn't add, try again");
          renderAll();
        });
      break;
    }

    case "addVipSuggestion": {
      const address = el.dataset.address;
      const name = el.dataset.name;
      el.disabled = true;
      fetch("/api/senders/vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, name: name || undefined }),
      })
        .then(res => { if (!res.ok) throw new Error("Request failed"); return res.json(); })
        .then(data => {
          state.vips = [data.vip, ...state.vips.filter(v => v.id !== data.vip.id)];
          state.vipSuggestions = state.vipSuggestions.filter(c => c.address.toLowerCase() !== data.vip.address);
          renderAll();
        })
        .catch(err => {
          console.error("Failed to add VIP", err);
          el.disabled = false;
          flash("Couldn't add, try again");
          renderAll();
        });
      break;
    }

    case "removeVip": {
      const id = el.dataset.id;
      el.disabled = true;
      fetch("/api/senders/vip/" + id, { method: "DELETE" })
        .then(res => { if (!res.ok) throw new Error("Request failed"); })
        .then(() => {
          state.vips = state.vips.filter(v => v.id !== id);
          renderAll();
        })
        .catch(err => {
          console.error("Failed to remove VIP", err);
          el.disabled = false;
          flash("Couldn't remove, try again");
          renderAll();
        });
      break;
    }

    case "loadVipSuggestions":
      state.vipSuggestLoading = true;
      renderAll();
      vipSuggestAbort = new AbortController();
      fetch("/api/senders/vip/suggestions", { signal: vipSuggestAbort.signal })
        .then(res => { if (!res.ok) throw new Error("Request failed"); return res.json(); })
        .then(data => {
          state.vipSuggestions = data.suggestions;
          state.vipSuggestLoading = false;
          vipSuggestAbort = null;
          renderAll();
        })
        .catch(err => {
          state.vipSuggestLoading = false;
          vipSuggestAbort = null;
          if (err.name === "AbortError") { renderAll(); return; }
          console.error("Failed to load VIP suggestions", err);
          flash("Couldn't load suggestions, try again");
          renderAll();
        });
      break;

    case "stopVipSuggestions":
      if (vipSuggestAbort) vipSuggestAbort.abort();
      break;

    // ---------- Settings: AI assistant connectors ----------
    case "copyMcpUrl": {
      const urlEl = document.getElementById("mcpServerUrl");
      const url = urlEl ? urlEl.value : "";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url);
      }
      flash("Server URL copied");
      renderAll();
      break;
    }

    case "toggleMcpTokenVisible":
      state.mcpTokenVisible = !state.mcpTokenVisible;
      renderAll();
      break;

    case "generateMcpToken":
      el.disabled = true;
      fetch("/api/mcp-token", { method: "POST" })
        .then(res => { if (!res.ok) throw new Error("Request failed"); return res.json(); })
        .then(data => {
          state.mcpToken = data.token;
          state.mcpTokenVisible = true;
          renderAll();
        })
        .catch(err => {
          console.error("Failed to generate MCP token", err);
          el.disabled = false;
          flash("Couldn't generate a token, try again");
          renderAll();
        });
      break;

    // ---------- Thread (draft review & send) ----------
    case "backThread":
      state.view = state.backTo || "inbox";
      state.openId = null;
      renderAll();
      break;

    case "pickDraft":
      state.chosen = Object.assign({}, state.chosen, { [el.dataset.id]: Number(el.dataset.i) });
      renderAll();
      break;

    case "resetDraft": {
      const key = el.dataset.id + "-" + el.dataset.i;
      const drafts = Object.assign({}, state.drafts);
      delete drafts[key];
      state.drafts = drafts;
      renderAll();
      break;
    }

    case "regenerateThread": {
      if (!state.instruction.trim()) break;
      const ALL = THREADS.concat(LOWCONF).concat(FOLLOWUPS).concat(MEETINGS);
      const cur = ALL.filter(x => x.id === state.openId)[0];
      if (cur) {
        flash("Regenerating option " + (state.chosen[cur.id] === 1 ? "B" : "A") + " with your instruction");
      }
      state.instruction = "";
      renderAll();
      break;
    }

    case "sendThread": {
      const ALL = THREADS.concat(LOWCONF).concat(FOLLOWUPS).concat(MEETINGS);
      const cur = ALL.filter(x => x.id === state.openId)[0];
      if (cur) {
        const chosen = state.chosen[cur.id] === undefined ? 0 : state.chosen[cur.id];
        const fu = !!cur.days;
        const mtg = !!cur.meeting;
        // Same origin-based routing as everywhere else this session: a
        // manual-followup card is still a threads row, only a real
        // sent-message follow-up needs the followups endpoint.
        const kind = mtg ? "meeting" : (cur.origin === "sent" ? "followup" : "thread");
        const endpoint = kind === "meeting" ? "/api/meetings/" + cur.id + "/send"
          : kind === "followup" ? "/api/followups/" + cur.id + "/send"
          : "/api/threads/" + cur.id + "/send";
        const draftKey = cur.id + "-" + chosen;
        const draftOrigin = state.drafts[draftKey] !== undefined ? "edited" : (chosen === 1 ? "option_b" : "option_a");

        state.confirmSend = {
          id: cur.id,
          endpoint: endpoint,
          text: draftText(cur.id, chosen),
          origin: draftOrigin,
          name: cur.name,
          org: cur.org,
          initials: cur.initials,
          av: cur.av,
          subject: cur.subject,
          mailbox: cur.mailbox,
          label: mtg ? "Send follow-up note" : (fu ? "Send follow-up" : "Send reply")
        };
      }
      renderAll();
      break;
    }

    case "cancelSendConfirm":
      state.confirmSend = null;
      renderAll();
      break;

    case "confirmSendYes": {
      const payload = state.confirmSend;
      state.confirmSend = null;
      if (payload) {
        state.view = state.backTo || "inbox";
        startDelayedSend(payload);
      }
      renderAll();
      break;
    }

    case "saveDraftThread": {
      const ALL = THREADS.concat(LOWCONF).concat(FOLLOWUPS).concat(MEETINGS);
      const cur = ALL.filter(x => x.id === state.openId)[0];
      if (cur) flash("Saved as a Gmail draft in " + cur.mailbox);
      renderAll();
      break;
    }

    case "dismissThread": {
      // Was still the old fake local-only dismiss (missed when the card-level
      // dismiss buttons were made real) — same routing as dismissFu/dismissCard.
      const ALL = THREADS.concat(LOWCONF).concat(FOLLOWUPS).concat(MEETINGS);
      const cur = ALL.filter(x => x.id === state.openId)[0];
      if (cur) {
        state.view = state.backTo || "inbox";
        if (cur.meeting) {
          dismissMeeting(cur.id, cur.name);
        } else if (cur.origin === "sent") {
          dismissFollowup(cur.id, cur.name);
        } else {
          moveCardCategory(cur.id, "dismissed", cur.name);
        }
      }
      renderAll();
      break;
    }

    // ---------- Toast ----------
    case "toastAction": {
      const t = state.toast;
      if (t && t.action) t.action();
      clearTimeout(toastTimer);
      state.toast = null;
      renderAll();
      break;
    }

    default:
      break;
  }
});

// ---------------------------------------------------------------------------
// Home summary-card / mailbox-stat "go" routing
// (ported from renderVals()'s goTab() closures, expressed as data + a switch
// since we don't have per-item closures in the plain-DOM approach)
// ---------------------------------------------------------------------------

function goTab(view, patch) {
  Object.assign(state, { view: view, openId: null, drawer: false, activeNav: view }, patch || {});
}

function handleHomeGo(go) {
  switch (go) {
    case "home-need":
      goTab("inbox", { filterVals: Object.assign({}, state.filterVals, { priority: null }), fuAging: false });
      break;
    case "home-today":
      goTab("inbox", { filterVals: Object.assign({}, state.filterVals, { priority: "Reply today" }), fuAging: false });
      break;
    case "home-lowconf":
      goTab("inbox", { filterVals: Object.assign({}, state.filterVals, { priority: null }), fuAging: false });
      break;
    case "home-calls":
      goTab("meetings");
      break;
    case "home-older":
      goTab("inbox", { fuAging: true, filterVals: Object.assign({}, state.filterVals, { priority: null }) });
      break;
    case "home-sent":
      goTab("sent");
      break;
    case "home-dismissed":
      goTab("dismissed");
      break;
    default:
      break;
  }
}

function handleMailboxStatGo(go, mailbox) {
  switch (go) {
    case "mb-need":
      goTab("inbox", { filterVals: Object.assign({}, state.filterVals, { mailbox: mailbox, priority: null }), activeMailbox: mailbox, fuAging: false });
      break;
    case "mb-today":
      goTab("inbox", { filterVals: Object.assign({}, state.filterVals, { mailbox: mailbox, priority: "Reply today" }), activeMailbox: mailbox, fuAging: false });
      break;
    case "mb-lowconf":
      goTab("inbox", { filterVals: Object.assign({}, state.filterVals, { mailbox: mailbox, priority: null }), activeMailbox: mailbox, fuAging: false });
      break;
    case "mb-calls":
      goTab("meetings", { filterVals: Object.assign({}, state.filterVals, { mailbox: mailbox }), activeMailbox: mailbox });
      break;
    case "mb-older":
      goTab("inbox", { filterVals: Object.assign({}, state.filterVals, { mailbox: mailbox, priority: null }), activeMailbox: mailbox, fuAging: true });
      break;
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// TEXT INPUT HANDLING (search bar) — read-on-demand, no re-render per keystroke
// ---------------------------------------------------------------------------

let searchDebounceTimer = null;
function runSearch() {
  const input = document.getElementById("searchInput");
  const query = input ? input.value.trim() : "";
  if (!query) {
    state.searchOpen = false;
    state.searchResults = [];
    renderAll();
    return;
  }
  state.searchQuery = query;
  state.searchOpen = true;
  state.searchLoading = true;
  renderAll();
  fetch("/api/search?q=" + encodeURIComponent(query))
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Request failed"))))
    .then((data) => {
      state.searchResults = data.results || [];
      state.searchLoading = false;
      renderAll();
    })
    .catch((err) => {
      console.error("Search failed", err);
      state.searchLoading = false;
      state.searchResults = [];
      renderAll();
    });
}

document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "searchInput") {
    // Real search now, but still debounced/read-on-demand rather than a
    // full re-render per keystroke — #searchInput itself is part of the
    // once-built shell (see BOOTSTRAP), never recreated by renderAll(), so
    // this never risks losing focus/cursor position either way.
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(runSearch, 300);
    return;
  }

  if (e.target && e.target.id === "instructionInput") {
    // Custom-instruction field: store into state, no re-render per keystroke
    // (matches the search-input convention above) so focus/cursor is kept.
    state.instruction = e.target.value;
    return;
  }

  if (e.target && e.target.dataset && e.target.dataset.action === "editDraft") {
    // Draft textarea: store the edited text keyed by id+option index without
    // a full re-render (keeps cursor position / focus while typing). We do
    // update the word-count span directly, same targeted-DOM-write pattern
    // called out in the task spec.
    const id = e.target.dataset.id;
    const i = e.target.dataset.i;
    const key = id + "-" + i;
    state.drafts = Object.assign({}, state.drafts, { [key]: e.target.value });
    const words = e.target.value.trim() === "" ? 0 : e.target.value.trim().split(/\s+/).length;
    const wordsEl = document.getElementById("draftWords-" + i);
    if (wordsEl) wordsEl.textContent = words + " words";
    return;
  }

  if (e.target && e.target.id === "vipAddInput") {
    state.vipInput = e.target.value;
    return;
  }

  if (e.target && e.target.id === "feedbackPopupNoteInput") {
    // Same no-re-render-per-keystroke pattern as editDraft/instructionInput
    // above — "Save" reads this from state.feedbackPopup when clicked.
    if (state.feedbackPopup) state.feedbackPopup = Object.assign({}, state.feedbackPopup, { note: e.target.value });
    return;
  }
});

document.addEventListener("keydown", (e) => {
  if (e.target && e.target.id === "searchInput") {
    if (e.key === "Enter") {
      clearTimeout(searchDebounceTimer);
      runSearch();
    } else if (e.key === "Escape") {
      e.target.value = "";
      state.searchOpen = false;
      state.searchResults = [];
      renderAll();
    }
  }
  if (e.target && e.target.id === "vipAddInput" && e.key === "Enter") {
    document.querySelector('[data-action="addVipManual"]')?.click();
  }
});

// ---------------------------------------------------------------------------
// RESIZE LISTENER
// ---------------------------------------------------------------------------

window.addEventListener("resize", () => {
  state.w = window.innerWidth;
  renderAll();
});

// ---------------------------------------------------------------------------
// BOOTSTRAP
// ---------------------------------------------------------------------------
// Mock data above is now just the initial (empty) shape — real data replaces
// it here via /api/scan (triggers a live Gmail/Calendar scan) then
// /api/dashboard (reads the scanned results back in the same shape the mock
// consts used, so none of the render functions above needed to change).

MAILBOXES.length = 0;
THREADS.length = 0;
LOWCONF.length = 0;
FOLLOWUPS.length = 0;
SENT.length = 0;
MEETINGS.length = 0;
SEEDS.length = 0;
DISMISSED.length = 0;
Object.keys(DRAFTS).forEach((k) => delete DRAFTS[k]);
state.dismissedIds = [];

// Land here after app/api/mailboxes/callback redirects back from Google —
// surface the result once, then strip the query params so a reload doesn't
// re-show the toast.
(function handleMailboxReturnParams() {
  const params = new URLSearchParams(window.location.search);
  const connected = params.get("mailboxConnected");
  const error = params.get("mailboxError");
  if (connected) flash("Mailbox connected");
  else if (error) flash(error);
  if (connected || error) {
    params.delete("mailboxConnected");
    params.delete("mailboxError");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
  }
})();

renderAll();

// Shared by the initial page load and the manual Rescan button — both need
// the identical scan-then-refetch sequence. /api/scan streams one NDJSON
// progress line per mailbox completed (see lib/scan.ts's onProgress) —
// state.scanProgress stays null (indeterminate bar) until the first line
// arrives, then holds real {done,total} for a determinate percentage.
let scanInFlight = false;
async function scanAndLoad() {
  if (scanInFlight) return;
  scanInFlight = true;
  state.scanning = true;
  state.scanProgress = null;
  renderAll();

  try {
    const scanRes = await fetch("/api/scan", { method: "POST" });
    if (scanRes.body) {
      const reader = scanRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let evt;
          try { evt = JSON.parse(line); } catch { continue; }
          if (evt.type === "progress") {
            state.scanProgress = { done: evt.done, total: evt.total };
            renderAll();
          }
        }
      }
    }
    const res = await fetch("/api/dashboard");
    if (res.status === 401) {
      document.getElementById("app").innerHTML =
        '<div style="margin:80px auto;text-align:center;font-family:inherit;">' +
        "<p>You need to sign in to see your inbox.</p>" +
        '<a href="/connect" style="color:#0b8ee8;">Sign in with Google</a></div>';
      return;
    }
    const data = await res.json();

    MAILBOXES.length = 0;
    THREADS.length = 0;
    LOWCONF.length = 0;
    FOLLOWUPS.length = 0;
    SENT.length = 0;
    MEETINGS.length = 0;
    DISMISSED.length = 0;
    Object.keys(DRAFTS).forEach((k) => delete DRAFTS[k]);

    MAILBOXES.push(...data.mailboxes);
    THREADS.push(...data.threads);
    LOWCONF.push(...data.lowConf);
    FOLLOWUPS.push(...data.followUps);
    SENT.push(...data.sent);
    MEETINGS.push(...data.meetings);
    DISMISSED.push(...data.dismissed);
    Object.assign(DRAFTS, data.drafts);
    state.ownerName = data.ownerName || "";
    state.ownerEmail = data.ownerEmail || "";
    state.replyPromiseHours = data.replyPromiseHours || 24;
    state.draftVoice = data.draftVoice || "";
    // Real dismissed items come back already-dismissed from the server —
    // dismissedIds still drives the gone()/live() filters that hide them
    // from the active-queue arrays.
    state.dismissedIds = data.dismissed.map((d) => d.id);
    // formatSync (server-side) returns either "scanned N min/h ago" or the
    // standalone sentence "not scanned yet" — the pill template always reads
    // "Last scanned {this}" / "· scanned {this}", so only the first form
    // (which has a real "scanned " prefix to strip) fits; anything else
    // (including "not scanned yet") falls back to "never" rather than
    // producing "scanned not scanned yet".
    state.scanned = data.mailboxes[0] && data.mailboxes[0].sync.startsWith("scanned ")
      ? data.mailboxes[0].sync.slice(8)
      : "never";

    if (data.mailboxes[0]) {
      const first = data.mailboxes[0].address;
      state.activeMailbox = first;
      state.defaultMailbox = first;
      state.filterVals.mailbox = first;
    }
  } catch (err) {
    console.error("Failed to load live dashboard data", err);
    flash("Couldn't refresh, try again");
  } finally {
    state.scanning = false;
    state.scanProgress = null;
    scanInFlight = false;
    renderAll();
  }
}

function loadVips() {
  fetch("/api/senders/vip")
    .then(res => { if (!res.ok) throw new Error("Request failed"); return res.json(); })
    .then(data => {
      state.vips = data.vips;
      renderAll();
    })
    .catch(err => console.error("Failed to load VIPs", err));
}

scanAndLoad();
