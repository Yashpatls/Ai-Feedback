import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { classifyAndEmbed } from "@/lib/classify";

const CHANNEL_VALUES = [
  "SUPPORT_TICKET", "APP_STORE_REVIEW", "NPS_SURVEY",
  "SALES_CALL_NOTE", "SOCIAL_MENTION", "COMMUNITY_POST", "MANUAL",
] as const;

type ChannelValue = typeof CHANNEL_VALUES[number];

const channelSchema = z.object({
  channel: z.enum(CHANNEL_VALUES),
  count: z.number().min(1).max(30).default(10),
});

const SIMULATED: Record<string, string[]> = {
  APP_STORE_REVIEW: [
    "The new dashboard is gorgeous and finally fast. Huge improvement over v1.",
    "App keeps crashing on iOS 17 when I try to export data. Very frustrating.",
    "Love the dark mode addition. Would be 5 stars if the mobile experience was better.",
    "Onboarding flow is confusing. Took me 30 minutes to figure out basic setup.",
    "Performance has improved dramatically. Searches that used to take 5 seconds are instant.",
    "The collaboration features are fantastic. My whole team switched from a competitor.",
    "Please add keyboard shortcuts. Power users need them for productivity.",
    "Billing page keeps timing out. Can't download my invoice. This is unacceptable.",
    "The AI insights are surprisingly accurate. Impressed with the theme detection.",
    "CSV import failed silently three times. No error message at all.",
    "Great app overall but the pricing jumped 40% without notice. Very unhappy.",
    "The sentiment analysis catches nuances I missed when reading manually. Love it.",
  ],
  SUPPORT_TICKET: [
    "Onboarding took forever — I couldn't figure out how to invite my team. Need better docs.",
    "Can't connect my Zendesk account. The OAuth flow fails at the last step.",
    "Data export is missing the sentiment scores. They show in the UI but not in the CSV.",
    "I accidentally deleted a theme. Is there an undo function?",
    "The ask-LOOP feature isn't returning results from last week's data.",
    "Our workspace has 3 admins but only 1 can see the reports section.",
    "I need to bulk-delete old feedback. There's no way to do this currently.",
    "SSO login is broken for Google Workspace accounts.",
    "The trends chart doesn't update when I change the date range filter.",
    "We're getting duplicates from the CSV import. Same rows appear twice.",
    "Password reset email never arrives. Checked spam folder.",
    "The feedback inbox loads slowly with 1000+ items. Pagination doesn't help much.",
  ],
  NPS_SURVEY: [
    "It does the job, but the mobile experience needs serious work. Score: 6",
    "The AI features alone justify the price. We've replaced three tools. Score: 9",
    "Too expensive for small teams. The free tier is too limited. Score: 5",
    "Excellent product. The VoC reports save me 3 hours every week. Score: 10",
    "Would recommend but the learning curve is steep. Better tutorials needed. Score: 7",
    "The API is well-documented and easy to use. Engineering team loved it. Score: 9",
    "Competitive but nothing I can't get elsewhere at lower cost. Score: 6",
    "The ask-LOOP Q&A changed how we do product reviews. Genuinely transformative. Score: 10",
    "Needs better mobile support. Most of my reading happens on my phone. Score: 5",
    "Great for large teams but overkill for startups under 10 people. Score: 7",
  ],
  SALES_CALL_NOTE: [
    "Prospect wants SSO before they'll sign — third time this month we've heard this.",
    "Enterprise lead asking about SOC 2 compliance. They won't move without it.",
    "Prospect loves the AI features but finds the pricing model confusing.",
    "Demo went well. Main objection was lack of Slack integration.",
    "Large retailer wants bulk-data-ingestion from their own systems via API.",
    "Startup founder interested but waiting for a mobile app before committing.",
    "Prospect compared us to Dovetail — said our AI was better but UI was less polished.",
    "Healthcare company needs data residency options in the EU.",
    "Current customer wants to expand seats but needs team-level analytics first.",
    "Lost deal to a competitor — price was the deciding factor.",
  ],
  COMMUNITY_POST: [
    "Love the new export feature, saved me an hour today. Thank you LOOP team!",
    "Has anyone figured out how to automate feedback ingestion from Intercom?",
    "The weekly VoC reports are my favourite feature. Leadership finally has context.",
    "Tip: use the theme colours to build a priority matrix. Game changer.",
    "Is there a Zapier integration on the roadmap? Would love to automate my workflow.",
    "Just noticed the trend detection flagged a real issue before my team did. Amazing.",
    "The API docs are great but some endpoints seem undocumented. Any wiki?",
    "Feature request: allow exporting reports as PPTX for board presentations.",
    "We integrated LOOP with our data warehouse. The team is obsessed with it now.",
    "Suggestion: add sentiment alerts via email so I don't have to check the dashboard.",
  ],
  SOCIAL_MENTION: [
    "@LoopApp just saved us 5 hours a week on feedback analysis. Highly recommend.",
    "Tried @LoopApp — the AI theme clustering is impressive but UI needs polish.",
    "Switched from manual spreadsheets to @LoopApp. Never going back.",
    "@LoopApp pricing is steep for solo founders. Need a cheaper tier.",
    "The @LoopApp VoC report went straight to our board deck this month. 🎯",
    "Does anyone know if @LoopApp has a public API? Want to build an integration.",
    "Just demoed @LoopApp for my team. The Ask LOOP Q&A blew everyone away.",
    "@LoopApp support responded in under 2 hours. Rare in B2B SaaS these days.",
    "Disappointed by the @LoopApp mobile experience. Desktop-only in 2024?",
    "Our NPS went up 12 points after acting on @LoopApp insights. Data-driven wins.",
  ],
};

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const { channel, count } = channelSchema.parse(body) as { channel: ChannelValue; count: number };

    const pool = SIMULATED[channel] ?? SIMULATED.COMMUNITY_POST;
    const selected: string[] = [];
    let i = 0;
    while (selected.length < count) {
      selected.push(pool[i % pool.length]);
      i++;
    }
    // Shuffle the result
    selected.sort(() => Math.random() - 0.5);

    const existingThemes = await db.theme.findMany({
      where: { workspaceId: user.workspaceId },
      select: { id: true, name: true },
    });

    const created: string[] = [];
    for (const content of selected) {
      const feedback = await db.feedback.create({
        data: {
          content,
          channel,
          sourceRef: `simulated-${channel.toLowerCase()}`,
          workspaceId: user.workspaceId,
          createdById: user.id,
          // Removed randomDate() so it defaults to now()
        },
      });
      classifyAndEmbed(feedback.id, content, existingThemes, user.workspaceId).catch(
        console.error
      );
      created.push(feedback.id);
    }

    return apiSuccess({ imported: created.length, channel });
  } catch (e) {
    return handleApiError(e);
  }
}
