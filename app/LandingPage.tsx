// Ported from Ellen's Claude Design export ("FollowUp OS Landing (standalone).html",
// 2026-08-04). That file is a self-extracting bundle whose only non-inline-style
// dependencies were four CSS rules and one logo image — extracted below rather than
// carrying the ~9.8MB original (embedded @font-face data for fonts app/layout.tsx
// already loads globally) into the repo. Content is static marketing copy authored
// in the design tool, not user input, so dangerouslySetInnerHTML here is safe.
const LANDING_HTML = `
<div class="lp-header" style="max-width:1280px;margin:0 auto;padding:0 40px;display:flex;align-items:center;justify-content:space-between;height:84px">
  <div style="display:flex;align-items:center;gap:10px">
    <img src="/landing-logo.png" style="width:34px;height:34px;border-radius:10px;flex:0 0 auto;object-fit:cover">
    <div style="font-weight:800;font-size:17px;letter-spacing:-.01em">FollowUp <span style="font-weight:500;color:#9aa1ac">OS</span></div>
  </div>
  <div class="lp-nav-links" style="display:flex;align-items:center;gap:36px">
    <a href="#features" style="color:#13161c;font-size:14.5px;font-weight:500">Features</a>
    <a href="#how" style="color:#13161c;font-size:14.5px;font-weight:500">How it works</a>
    <a href="#faq" style="color:#13161c;font-size:14.5px;font-weight:500">FAQ</a>
  </div>
  <div style="display:flex;align-items:center;gap:20px">
    <a href="/connect" style="color:#13161c;font-size:14.5px;font-weight:600">Log in</a>
    <a href="/signup" class="lp-scp0" style="background:#13161c;color:#fff;font-size:14.5px;font-weight:600;padding:10px 22px;border-radius:999px;white-space:nowrap">Start now</a>
  </div>
</div>

<div id="hero" style="max-width:1280px;margin:0 auto;padding:64px 40px 0;text-align:center;position:relative">
  <div style="display:inline-flex;align-items:center;gap:8px;padding:7px 16px;border-radius:999px;border:1px solid #eff0f3;background:#fbfbfc;font-size:13px;font-weight:600;color:#0b8ee8;margin-bottom:28px">
    <span style="width:7px;height:7px;border-radius:50%;background:#0b8ee8;animation:lp-pulse 2s ease-in-out infinite"></span>
    Built because Gmail's "needs a reply" nudge isn't enough
  </div>
  <h1 style="font-size:64px;line-height:1.05;letter-spacing:-.03em;font-weight:800;margin:0 auto 22px;max-width:820px">
    Never let an important email fall through again
  </h1>
  <p style="font-size:19px;line-height:1.55;color:#767d89;max-width:600px;margin:0 auto 36px;text-wrap:pretty">
    FollowUp OS reads your inbox, tells you which emails actually need a reply, drafts one in your voice, and tracks what you're still owed, so nothing waits on you by accident.
  </p>
  <div class="lp-hero-ctas" style="display:flex;align-items:center;justify-content:center;gap:24px;margin-bottom:64px">
    <a href="/signup" class="lp-scp1" style="background:#0b8ee8;color:#fff;font-size:15.5px;font-weight:700;padding:15px 30px;border-radius:999px;display:inline-flex;align-items:center;gap:8px;box-shadow:0 10px 26px -12px rgba(11,142,232,.55)">
      Try for free <i class="ti ti-arrow-right"></i>
    </a>
    <a href="/connect" style="font-size:15.5px;font-weight:600;color:#13161c;display:inline-flex;align-items:center;gap:6px">Log in <i class="ti ti-arrow-right" style="font-size:15px"></i></a>
  </div>

  <div style="position:relative;max-width:1040px;margin:0 auto">
    <div style="position:absolute;inset:-60px -40px auto;height:420px;background:radial-gradient(60% 100% at 50% 0%,rgba(11,142,232,.12),transparent 70%);z-index:0"></div>
    <div class="lp-mock-shell" style="position:relative;z-index:1;border-radius:20px;border:1px solid #eff0f3;background:#fff;box-shadow:0 1px 2px rgba(16,24,40,.04),0 30px 60px -25px rgba(16,24,40,.25);overflow:hidden;display:flex;text-align:left">
      <div class="lp-mock-sidebar" style="width:210px;flex:0 0 auto;background:#fbfbfc;border-right:1px solid #eff0f3;padding:20px 16px;display:flex;flex-direction:column;gap:2px">
        <div style="display:flex;align-items:center;gap:8px;padding:0 4px 18px">
          <img src="/landing-logo.png" style="width:22px;height:22px;border-radius:6px;object-fit:cover">
          <div style="font-weight:800;font-size:12.5px">FollowUp<span style="font-weight:500;color:#9aa1ac"> OS</span></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:9px 10px;border-radius:9px;background:#fff;border:1px solid #eceef1;font-size:12.5px;font-weight:700;margin-bottom:8px">
          <i class="ti ti-layout-grid" style="color:#0b8ee8;font-size:15px"></i> Inbox
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;font-size:12.5px;font-weight:500;color:#767d89">
          <span style="display:flex;align-items:center;gap:8px"><i class="ti ti-corner-up-left" style="font-size:15px;color:#a7adb8"></i>Follow ups</span>
          <span style="color:#c3c8d1">0</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;font-size:12.5px;font-weight:500;color:#767d89">
          <span style="display:flex;align-items:center;gap:8px"><i class="ti ti-notes" style="font-size:15px;color:#a7adb8"></i>Post meeting</span>
          <span style="color:#c3c8d1">0</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;font-size:12.5px;font-weight:500;color:#767d89">
          <span style="display:flex;align-items:center;gap:8px"><i class="ti ti-send" style="font-size:15px;color:#a7adb8"></i>Sent</span>
          <span style="color:#c3c8d1">0</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;font-size:12.5px;font-weight:500;color:#767d89">
          <span style="display:flex;align-items:center;gap:8px"><i class="ti ti-archive" style="font-size:15px;color:#a7adb8"></i>Dismissed</span>
          <span style="color:#c3c8d1">16</span>
        </div>
      </div>
      <div style="flex:1;padding:22px 26px;min-width:0">
        <div class="lp-mock-toprow" style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
          <div style="flex:1;display:flex;align-items:center;gap:8px;background:#fbfbfc;border:1px solid #eceef1;border-radius:999px;padding:9px 14px;font-size:12.5px;color:#a7adb8">
            <i class="ti ti-search" style="font-size:14px"></i> Did I ever reply to Marcus about the Q3 pilot pricing?
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#3d9c56;background:#f0faf3;border:1px solid #d9f0e0;padding:6px 12px;border-radius:999px;white-space:nowrap">
            <span style="width:6px;height:6px;border-radius:50%;background:#3d9c56"></span>Last scanned 2 min ago
          </div>
        </div>
        <div style="font-size:11px;font-weight:600;color:#9aa1ac;margin-bottom:6px">Good morning, Ellen</div>
        <div class="lp-mock-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
          <div style="border:1px solid #eff0f3;border-radius:14px;padding:14px;background:#fff">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
              <div style="width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#e8f4fd"><i class="ti ti-bolt" style="font-size:14px;color:#0b8ee8"></i></div>
              <div style="font-size:11.5px;font-weight:700">Needs reply</div>
            </div>
            <div style="font-size:24px;font-weight:800;letter-spacing:-.02em">7</div>
            <div style="font-size:10.5px;color:#a7adb8;margin-top:2px">drafted and waiting</div>
          </div>
          <div style="border:1px solid #eff0f3;border-radius:14px;padding:14px;background:#fff">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
              <div style="width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#fdf0e3"><i class="ti ti-flame" style="font-size:14px;color:#f08a20"></i></div>
              <div style="font-size:11.5px;font-weight:700">Reply today</div>
            </div>
            <div style="font-size:24px;font-weight:800;letter-spacing:-.02em">3</div>
            <div style="font-size:10.5px;color:#a7adb8;margin-top:2px">inside the promise window</div>
          </div>
          <div style="border:1px solid #eff0f3;border-radius:14px;padding:14px;background:#fff">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
              <div style="width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#efecfa"><i class="ti ti-help-circle" style="font-size:14px;color:#8b7fd4"></i></div>
              <div style="font-size:11.5px;font-weight:700">Low confidence</div>
            </div>
            <div style="font-size:24px;font-weight:800;letter-spacing:-.02em">2</div>
            <div style="font-size:10.5px;color:#a7adb8;margin-top:2px">needs a judgment call</div>
          </div>
          <div style="border:1px solid #eff0f3;border-radius:14px;padding:14px;background:#fff">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
              <div style="width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#efecfa"><i class="ti ti-clipboard-list" style="font-size:14px;color:#8b7fd4"></i></div>
              <div style="font-size:11.5px;font-weight:700">Post-meeting</div>
            </div>
            <div style="font-size:24px;font-weight:800;letter-spacing:-.02em">4</div>
            <div style="font-size:10.5px;color:#a7adb8;margin-top:2px">notes to send</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div id="features" style="max-width:1280px;margin:0 auto;padding:150px 40px 100px">
  <div style="text-align:center;max-width:640px;margin:0 auto 64px">
    <div style="font-size:13px;font-weight:700;color:#0b8ee8;margin-bottom:14px;letter-spacing:.02em;text-transform:uppercase">What it does</div>
    <h2 style="font-size:40px;letter-spacing:-.02em;font-weight:800;margin:0 0 16px">Triage, draft, and track, automatically</h2>
    <p style="font-size:17px;color:#767d89;line-height:1.55;margin:0">One pass over your inbox tells you what's real, gives you the words to say, and keeps score on what's still owed.</p>
  </div>
  <div class="lp-features-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px">
    <div style="border:1px solid #eff0f3;border-radius:20px;padding:32px;background:#fff">
      <div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#e8f4fd;margin-bottom:20px"><i class="ti ti-bolt" style="font-size:22px;color:#0b8ee8"></i></div>
      <div style="font-size:19px;font-weight:700;margin-bottom:8px;letter-spacing:-.01em">Classifies what needs a reply</div>
      <div style="font-size:15px;color:#767d89;line-height:1.6">Reads every thread and separates the ones you owe a response from the noise Gmail's nudges miss or over-flag.</div>
    </div>
    <div style="border:1px solid #eff0f3;border-radius:20px;padding:32px;background:#fff">
      <div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#fdf0e3;margin-bottom:20px"><i class="ti ti-pencil" style="font-size:22px;color:#f08a20"></i></div>
      <div style="font-size:19px;font-weight:700;margin-bottom:8px;letter-spacing:-.01em">Drafts a reply in your voice</div>
      <div style="font-size:15px;color:#767d89;line-height:1.6">Generates a ready-to-send response matched to how you actually write, so replying is an edit, not a blank page.</div>
    </div>
    <div style="border:1px solid #eff0f3;border-radius:20px;padding:32px;background:#fff">
      <div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#efecfa;margin-bottom:20px"><i class="ti ti-corner-up-left" style="font-size:22px;color:#8b7fd4"></i></div>
      <div style="font-size:19px;font-weight:700;margin-bottom:8px;letter-spacing:-.01em">Tracks your sent follow-ups</div>
      <div style="font-size:15px;color:#767d89;line-height:1.6">Watches messages you've sent and flags the ones that went quiet, so a promise never just disappears.</div>
    </div>
    <div style="border:1px solid #eff0f3;border-radius:20px;padding:32px;background:#fff">
      <div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#e8f4fd;margin-bottom:20px"><i class="ti ti-clipboard-list" style="font-size:22px;color:#0b8ee8"></i></div>
      <div style="font-size:19px;font-weight:700;margin-bottom:8px;letter-spacing:-.01em">Summarizes meeting action items</div>
      <div style="font-size:15px;color:#767d89;line-height:1.6">Turns your notes into the follow-up emails and owed replies that came out of the call, before you forget them.</div>
    </div>
  </div>
</div>

<div id="how" style="background:#fbfbfc;border-top:1px solid #eff0f3;border-bottom:1px solid #eff0f3;padding:100px 40px">
  <div style="max-width:1280px;margin:0 auto">
    <div style="text-align:center;max-width:600px;margin:0 auto 64px">
      <div style="font-size:13px;font-weight:700;color:#f08a20;margin-bottom:14px;letter-spacing:.02em;text-transform:uppercase">How it works</div>
      <h2 style="font-size:40px;letter-spacing:-.02em;font-weight:800;margin:0">Set up once, stay covered every day</h2>
    </div>
    <div class="lp-how-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
      <div style="background:#fff;border:1px solid #eff0f3;border-radius:20px;padding:32px">
        <div style="font-size:13px;font-weight:800;color:#0b8ee8;margin-bottom:16px">Step 01</div>
        <div style="width:44px;height:44px;border-radius:12px;background:#fbfbfc;border:1px solid #eceef1;display:flex;align-items:center;justify-content:center;margin-bottom:20px"><i class="ti ti-plug-connected" style="font-size:20px;color:#13161c"></i></div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px">Connect your inbox</div>
        <div style="font-size:14.5px;color:#767d89;line-height:1.6">Sign in with Google and grant read access. Nothing sends without your approval.</div>
      </div>
      <div style="background:#fff;border:1px solid #eff0f3;border-radius:20px;padding:32px">
        <div style="font-size:13px;font-weight:800;color:#0b8ee8;margin-bottom:16px">Step 02</div>
        <div style="width:44px;height:44px;border-radius:12px;background:#fbfbfc;border:1px solid #eceef1;display:flex;align-items:center;justify-content:center;margin-bottom:20px"><i class="ti ti-scan" style="font-size:20px;color:#13161c"></i></div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px">AI scans and drafts</div>
        <div style="font-size:14.5px;color:#767d89;line-height:1.6">Every new thread gets classified, scored for urgency, and drafted a reply where one is needed.</div>
      </div>
      <div style="background:#fff;border:1px solid #eff0f3;border-radius:20px;padding:32px">
        <div style="font-size:13px;font-weight:800;color:#0b8ee8;margin-bottom:16px">Step 03</div>
        <div style="width:44px;height:44px;border-radius:12px;background:#fbfbfc;border:1px solid #eceef1;display:flex;align-items:center;justify-content:center;margin-bottom:20px"><i class="ti ti-checkbox" style="font-size:20px;color:#13161c"></i></div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px">Review and send</div>
        <div style="font-size:14.5px;color:#767d89;line-height:1.6">Approve drafts, dismiss the rest, and let FollowUp OS keep watch on what you sent.</div>
      </div>
    </div>
  </div>
</div>

<div id="faq" style="max-width:800px;margin:0 auto;padding:60px 40px 140px">
  <div style="text-align:center;margin-bottom:56px">
    <div style="font-size:13px;font-weight:700;color:#8b7fd4;margin-bottom:14px;letter-spacing:.02em;text-transform:uppercase">Questions</div>
    <h2 style="font-size:36px;letter-spacing:-.02em;font-weight:800;margin:0">Get clear answers</h2>
  </div>
  <div style="display:flex;flex-direction:column;gap:12px">
    ${[
      {
        q: "How is this different from Gmail's \"needs a reply\" nudge?",
        a: "Gmail's nudge is a blunt keyword heuristic that misses context and flags plenty of threads that don't need anything. FollowUp OS reads full thread context, your past replies, and tone to score confidence, and shows you exactly why a message was flagged.",
        open: true,
      },
      { q: "Does it send emails on its own?", a: "No. FollowUp OS only drafts, every reply sits in your queue until you review and hit send yourself." },
      { q: 'What does "low confidence" mean?', a: "Some threads are genuinely ambiguous, so FollowUp OS surfaces those separately instead of guessing, so you make the judgment call instead of trusting a wrong classification." },
      { q: "Which inboxes are supported?", a: "Gmail and Google Workspace today, with additional providers on the roadmap. You can connect multiple mailboxes to one account." },
      { q: "Is my email content used to train models?", a: "No. Your messages are processed to generate your classifications and drafts only, and are never used for model training." },
    ]
      .map(
        (f) => `
    <div class="lp-faq-item${f.open ? " lp-open" : ""}" style="border:1px solid #eff0f3;border-radius:16px;padding:22px 26px;background:#fff">
      <div onclick="this.parentElement.classList.toggle('lp-open')" style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;gap:16px">
        <div style="font-size:15.5px;font-weight:700">${f.q}</div>
        <i class="ti ti-chevron-down lp-faq-chevron" style="font-size:16px;color:#a7adb8;flex:0 0 auto;transition:transform .15s"></i>
      </div>
      <div class="lp-faq-answer" style="font-size:14.5px;color:#767d89;line-height:1.65;margin-top:14px;padding-right:24px">${f.a}</div>
    </div>`
      )
      .join("")}
  </div>
</div>

<div class="lp-footer" style="border-top:1px solid #eff0f3;padding:56px 40px">
  <div style="max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:24px">
    <div style="display:flex;align-items:center;gap:10px">
      <img src="/landing-logo.png" style="width:26px;height:26px;border-radius:8px;object-fit:cover">
      <div style="font-weight:800;font-size:14.5px">FollowUp <span style="font-weight:500;color:#9aa1ac">OS</span></div>
    </div>
    <div style="display:flex;gap:32px;font-size:13.5px;font-weight:500">
      <a href="#features" style="color:#767d89">Features</a>
      <a href="#how" style="color:#767d89">How it works</a>
      <a href="#faq" style="color:#767d89">FAQ</a>
      <a href="/connect" style="color:#767d89">Log in</a>
    </div>
    <div style="font-size:13px;color:#a7adb8">© 2026 FollowUp OS. All rights reserved.</div>
  </div>
</div>
`;

export default function LandingPage() {
  return (
    <div style={{ background: "#fff", color: "#13161c", overflowX: "hidden" }}>
      <style>{`
        @media (max-width: 860px) { .lp-nav-links { display: none !important; } }
        .lp-scp0:hover { background: #2a2f3a !important; }
        .lp-scp1:hover { background: #0a7fd1 !important; }
        @keyframes lp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
        .lp-faq-answer { display: none; }
        .lp-faq-item.lp-open .lp-faq-answer { display: block; }
        .lp-faq-item.lp-open .lp-faq-chevron { transform: rotate(180deg); }

        @media (max-width: 700px) {
          .lp-header { padding-left: 20px !important; padding-right: 20px !important; }
          #hero { padding: 40px 20px 0 !important; }
          h1 { font-size: 36px !important; }
          .lp-hero-ctas { flex-wrap: wrap; gap: 14px !important; }
          .lp-mock-sidebar { display: none !important; }
          .lp-mock-shell { display: block !important; }
          .lp-mock-toprow { flex-wrap: wrap !important; }
          .lp-mock-grid { grid-template-columns: repeat(2, 1fr) !important; }
          #features { padding: 70px 20px 60px !important; }
          #how { padding: 60px 20px !important; }
          #faq { padding: 40px 20px 80px !important; }
          #features h2, #how h2, #faq h2 { font-size: 26px !important; }
          .lp-features-grid { grid-template-columns: 1fr !important; }
          .lp-how-grid { grid-template-columns: 1fr !important; }
          .lp-footer { padding: 32px 20px !important; }
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />
    </div>
  );
}
