import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Use string literals since Prisma enums are only available after generation
type Channel = "SUPPORT_TICKET" | "APP_STORE_REVIEW" | "NPS_SURVEY" | "SALES_CALL_NOTE" | "SOCIAL_MENTION" | "COMMUNITY_POST" | "MANUAL";
type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";
type FeedbackStatus = "NEW" | "REVIEWED" | "ACTIONED";

async function main() {
  console.log("🌱 Seeding database…");

  // Clean up
  await db.embedding.deleteMany();
  await db.feedbackTheme.deleteMany();
  await db.feedback.deleteMany();
  await db.theme.deleteMany();
  await db.report.deleteMany();
  await db.user.deleteMany();
  await db.workspace.deleteMany();

  // Create workspace
  const workspace = await db.workspace.create({
    data: {
      name: "Demo Company",
      slug: "demo-company-seed",
    },
  });
  console.log("✅ Workspace created");

  // Create users
  const passwordHash = await bcrypt.hash("Demo1234!", 12);

  const users = await Promise.all([
    db.user.create({
      data: {
        name: "Admin User",
        email: "admin@demo.com",
        passwordHash,
        role: "ADMIN",
        workspaceId: workspace.id,
      },
    }),
    db.user.create({
      data: {
        name: "Analyst User",
        email: "analyst@demo.com",
        passwordHash,
        role: "ANALYST",
        workspaceId: workspace.id,
      },
    }),
    db.user.create({
      data: {
        name: "Viewer User",
        email: "viewer@demo.com",
        passwordHash,
        role: "VIEWER",
        workspaceId: workspace.id,
      },
    }),
  ]);
  console.log("✅ Users created");

  // Create themes
  const themeData = [
    { name: "Onboarding", color: "#6366f1", description: "New user setup and getting-started experience" },
    { name: "Performance", color: "#22c55e", description: "App speed, loading times, and reliability" },
    { name: "Billing", color: "#f43f5e", description: "Payments, pricing, and invoice issues" },
    { name: "Mobile", color: "#f97316", description: "Mobile app and responsive design feedback" },
    { name: "Integrations", color: "#14b8a6", description: "Third-party connections and API feedback" },
    { name: "UI/UX Design", color: "#8b5cf6", description: "Interface design and user experience" },
    { name: "AI Features", color: "#3b82f6", description: "AI classification, analysis, and Q&A features" },
    { name: "Reports", color: "#eab308", description: "Report generation and data export feedback" },
    { name: "SSO/Auth", color: "#ec4899", description: "Login, authentication, and SSO issues" },
    { name: "Feature Requests", color: "#06b6d4", description: "Customer requests for new features" },
  ];

  const themes = await Promise.all(
    themeData.map((t) =>
      db.theme.create({ data: { ...t, workspaceId: workspace.id } })
    )
  );
  console.log("✅ Themes created");

  const themeMap = Object.fromEntries(themes.map((t) => [t.name, t]));

  // Seed feedback items (130+ items)
  const feedbackItems: {
    content: string;
    channel: Channel;
    sentiment: Sentiment;
    sentimentScore: number;
    featureArea: string;
    themes: string[];
    status: FeedbackStatus;
    daysAgo: number;
    customerLabel?: string;
  }[] = [
    // Support Tickets
    { content: "Onboarding took forever — I couldn't figure out how to invite my team. The flow is really confusing.", channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", sentimentScore: -0.8, featureArea: "Onboarding", themes: ["Onboarding"], status: "ACTIONED", daysAgo: 2 },
    { content: "Can't connect my Zendesk account. The OAuth flow fails at the last step with a generic error.", channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", sentimentScore: -0.7, featureArea: "Integrations", themes: ["Integrations"], status: "REVIEWED", daysAgo: 3 },
    { content: "Data export is missing the sentiment scores. They show in the UI but not in the CSV download.", channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", sentimentScore: -0.6, featureArea: "Reports", themes: ["Reports"], status: "NEW", daysAgo: 1 },
    { content: "I accidentally deleted a theme. Is there an undo function? Really need this feature.", channel: "SUPPORT_TICKET", sentiment: "NEUTRAL", sentimentScore: -0.2, featureArea: "UI/UX", themes: ["Feature Requests", "UI/UX Design"], status: "NEW", daysAgo: 4 },
    { content: "SSO login is completely broken for Google Workspace accounts. Our whole team is locked out.", channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", sentimentScore: -0.9, featureArea: "Auth", themes: ["SSO/Auth"], status: "ACTIONED", daysAgo: 5 },
    { content: "The trends chart doesn't update when I change the date range filter. Have to reload the page.", channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", sentimentScore: -0.5, featureArea: "UI/UX", themes: ["UI/UX Design", "Performance"], status: "REVIEWED", daysAgo: 6 },
    { content: "We're getting duplicates from the CSV import. Same rows appear twice every time.", channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", sentimentScore: -0.7, featureArea: "Import", themes: ["Onboarding"], status: "REVIEWED", daysAgo: 7 },
    { content: "Password reset email never arrives. Checked spam folder too. Multiple users affected.", channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", sentimentScore: -0.8, featureArea: "Auth", themes: ["SSO/Auth"], status: "ACTIONED", daysAgo: 8 },
    { content: "The feedback inbox loads slowly when we have 1000+ items. Pagination doesn't seem to help.", channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", sentimentScore: -0.6, featureArea: "Performance", themes: ["Performance"], status: "REVIEWED", daysAgo: 9 },
    { content: "Need to bulk-delete old feedback items. There's no way to do this currently.", channel: "SUPPORT_TICKET", sentiment: "NEUTRAL", sentimentScore: -0.3, featureArea: "Inbox", themes: ["Feature Requests"], status: "NEW", daysAgo: 10 },
    { content: "The AI classification is working great! Just wondering if there's a way to train it on our specific terminology.", channel: "SUPPORT_TICKET", sentiment: "POSITIVE", sentimentScore: 0.6, featureArea: "AI", themes: ["AI Features", "Feature Requests"], status: "REVIEWED", daysAgo: 11 },
    { content: "Billing page keeps timing out when I try to download an invoice. Very frustrating for accounting.", channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", sentimentScore: -0.75, featureArea: "Billing", themes: ["Billing"], status: "ACTIONED", daysAgo: 12 },

    // App Store Reviews
    { content: "The new dashboard is gorgeous and finally fast. Huge improvement over the previous version!", channel: "APP_STORE_REVIEW", sentiment: "POSITIVE", sentimentScore: 0.9, featureArea: "Dashboard", themes: ["UI/UX Design", "Performance"], status: "NEW", daysAgo: 1 },
    { content: "App keeps crashing on iOS 17 when I try to export data. Very frustrating, this is a critical bug.", channel: "APP_STORE_REVIEW", sentiment: "NEGATIVE", sentimentScore: -0.85, featureArea: "Mobile", themes: ["Mobile", "Performance"], status: "REVIEWED", daysAgo: 2 },
    { content: "Love the dark mode addition. Would be 5 stars if the mobile experience was better.", channel: "APP_STORE_REVIEW", sentiment: "POSITIVE", sentimentScore: 0.5, featureArea: "Mobile", themes: ["Mobile", "UI/UX Design"], status: "NEW", daysAgo: 3 },
    { content: "Onboarding flow is confusing. Took me 30 minutes to figure out basic setup. Needs better guidance.", channel: "APP_STORE_REVIEW", sentiment: "NEGATIVE", sentimentScore: -0.7, featureArea: "Onboarding", themes: ["Onboarding"], status: "NEW", daysAgo: 4 },
    { content: "Performance has improved dramatically in the latest update. Searches that used to take 5 seconds are now instant.", channel: "APP_STORE_REVIEW", sentiment: "POSITIVE", sentimentScore: 0.9, featureArea: "Performance", themes: ["Performance"], status: "NEW", daysAgo: 5 },
    { content: "The collaboration features are fantastic. My whole team switched from a competitor and we haven't looked back.", channel: "APP_STORE_REVIEW", sentiment: "POSITIVE", sentimentScore: 0.95, featureArea: "Collaboration", themes: ["Feature Requests"], status: "NEW", daysAgo: 6 },
    { content: "Please add keyboard shortcuts. Power users need them for productivity workflows.", channel: "APP_STORE_REVIEW", sentiment: "NEUTRAL", sentimentScore: -0.1, featureArea: "UI/UX", themes: ["Feature Requests", "UI/UX Design"], status: "NEW", daysAgo: 7 },
    { content: "The AI insights are surprisingly accurate. Impressed with the theme detection capability.", channel: "APP_STORE_REVIEW", sentiment: "POSITIVE", sentimentScore: 0.85, featureArea: "AI", themes: ["AI Features"], status: "NEW", daysAgo: 8 },
    { content: "CSV import failed silently three times. No error message at all, just no data imported.", channel: "APP_STORE_REVIEW", sentiment: "NEGATIVE", sentimentScore: -0.75, featureArea: "Import", themes: ["Onboarding"], status: "REVIEWED", daysAgo: 9 },
    { content: "Great app overall but the pricing jumped 40% without any prior notice. Very unhappy with that decision.", channel: "APP_STORE_REVIEW", sentiment: "NEGATIVE", sentimentScore: -0.8, featureArea: "Billing", themes: ["Billing"], status: "REVIEWED", daysAgo: 10 },
    { content: "The sentiment analysis catches nuances I missed when reading manually. It's become indispensable.", channel: "APP_STORE_REVIEW", sentiment: "POSITIVE", sentimentScore: 0.9, featureArea: "AI", themes: ["AI Features"], status: "NEW", daysAgo: 11 },
    { content: "Solid product but needs better documentation. I spent hours trying to set up the API integration.", channel: "APP_STORE_REVIEW", sentiment: "NEUTRAL", sentimentScore: -0.2, featureArea: "Documentation", themes: ["Onboarding", "Integrations"], status: "NEW", daysAgo: 12 },

    // NPS Surveys
    { content: "It does the job, but the mobile experience needs serious work. Score: 6", channel: "NPS_SURVEY", sentiment: "NEUTRAL", sentimentScore: -0.2, featureArea: "Mobile", themes: ["Mobile"], status: "NEW", daysAgo: 2, customerLabel: "SMB" },
    { content: "The AI features alone justify the price. We've replaced three separate tools. Score: 9", channel: "NPS_SURVEY", sentiment: "POSITIVE", sentimentScore: 0.9, featureArea: "AI", themes: ["AI Features"], status: "NEW", daysAgo: 3, customerLabel: "Enterprise" },
    { content: "Too expensive for small teams. The free tier is way too limited to evaluate properly. Score: 5", channel: "NPS_SURVEY", sentiment: "NEGATIVE", sentimentScore: -0.5, featureArea: "Pricing", themes: ["Billing"], status: "NEW", daysAgo: 4, customerLabel: "Startup" },
    { content: "Excellent product. The VoC reports save me literally 3 hours every week. Score: 10", channel: "NPS_SURVEY", sentiment: "POSITIVE", sentimentScore: 1.0, featureArea: "Reports", themes: ["Reports", "AI Features"], status: "NEW", daysAgo: 5, customerLabel: "Enterprise" },
    { content: "Would recommend but the learning curve is steep. Better tutorials are urgently needed. Score: 7", channel: "NPS_SURVEY", sentiment: "NEUTRAL", sentimentScore: 0.1, featureArea: "Onboarding", themes: ["Onboarding"], status: "NEW", daysAgo: 6, customerLabel: "SMB" },
    { content: "The API is well-documented and easy to integrate. Our engineering team loved it. Score: 9", channel: "NPS_SURVEY", sentiment: "POSITIVE", sentimentScore: 0.85, featureArea: "API", themes: ["Integrations"], status: "NEW", daysAgo: 7, customerLabel: "Enterprise" },
    { content: "Competitive product but nothing I can't get elsewhere at a lower cost. Score: 6", channel: "NPS_SURVEY", sentiment: "NEUTRAL", sentimentScore: -0.1, featureArea: "Value", themes: ["Billing"], status: "NEW", daysAgo: 8 },
    { content: "The ask-LOOP Q&A changed how we do product reviews completely. Genuinely transformative. Score: 10", channel: "NPS_SURVEY", sentiment: "POSITIVE", sentimentScore: 1.0, featureArea: "AI", themes: ["AI Features"], status: "NEW", daysAgo: 9, customerLabel: "Enterprise" },
    { content: "Needs better mobile support. Most of my reading happens on my phone while commuting. Score: 5", channel: "NPS_SURVEY", sentiment: "NEGATIVE", sentimentScore: -0.5, featureArea: "Mobile", themes: ["Mobile"], status: "NEW", daysAgo: 10, customerLabel: "SMB" },
    { content: "Great for large teams but overkill for startups under 10 people with tight budgets. Score: 7", channel: "NPS_SURVEY", sentiment: "NEUTRAL", sentimentScore: 0.1, featureArea: "Pricing", themes: ["Billing"], status: "NEW", daysAgo: 11, customerLabel: "Startup" },
    { content: "Reporting is powerful but the export formats are limited. Need PPTX for board meetings. Score: 7", channel: "NPS_SURVEY", sentiment: "NEUTRAL", sentimentScore: 0.0, featureArea: "Reports", themes: ["Reports", "Feature Requests"], status: "NEW", daysAgo: 12 },

    // Sales Call Notes
    { content: "Prospect wants SSO before they'll sign — third time this month we've heard this exact objection.", channel: "SALES_CALL_NOTE", sentiment: "NEUTRAL", sentimentScore: -0.3, featureArea: "Auth", themes: ["SSO/Auth", "Feature Requests"], status: "ACTIONED", daysAgo: 1 },
    { content: "Enterprise lead asking about SOC 2 compliance. They won't move forward without certification.", channel: "SALES_CALL_NOTE", sentiment: "NEUTRAL", sentimentScore: -0.2, featureArea: "Security", themes: ["Feature Requests"], status: "REVIEWED", daysAgo: 2 },
    { content: "Prospect loves the AI features but finds the pricing model confusing. Wants simpler flat rate.", channel: "SALES_CALL_NOTE", sentiment: "NEUTRAL", sentimentScore: -0.1, featureArea: "Pricing", themes: ["AI Features", "Billing"], status: "NEW", daysAgo: 3 },
    { content: "Demo went really well. Main objection was lack of native Slack integration for alerts.", channel: "SALES_CALL_NOTE", sentiment: "POSITIVE", sentimentScore: 0.4, featureArea: "Integrations", themes: ["Integrations", "Feature Requests"], status: "REVIEWED", daysAgo: 4 },
    { content: "Large retailer wants bulk-data-ingestion from their own systems via a robust API.", channel: "SALES_CALL_NOTE", sentiment: "POSITIVE", sentimentScore: 0.3, featureArea: "API", themes: ["Integrations"], status: "NEW", daysAgo: 5 },
    { content: "Startup founder interested but waiting for a mobile app before committing to paid plan.", channel: "SALES_CALL_NOTE", sentiment: "NEUTRAL", sentimentScore: -0.2, featureArea: "Mobile", themes: ["Mobile"], status: "NEW", daysAgo: 6 },
    { content: "Prospect compared us favourably to Dovetail — said our AI was better but UI was less polished.", channel: "SALES_CALL_NOTE", sentiment: "NEUTRAL", sentimentScore: 0.2, featureArea: "UI/UX", themes: ["UI/UX Design", "AI Features"], status: "REVIEWED", daysAgo: 7 },
    { content: "Healthcare company needs data residency options in the EU. GDPR compliance is non-negotiable.", channel: "SALES_CALL_NOTE", sentiment: "NEUTRAL", sentimentScore: -0.1, featureArea: "Compliance", themes: ["Feature Requests"], status: "NEW", daysAgo: 8 },
    { content: "Lost deal to a competitor — price was the deciding factor. Need a cheaper startup tier.", channel: "SALES_CALL_NOTE", sentiment: "NEGATIVE", sentimentScore: -0.7, featureArea: "Pricing", themes: ["Billing"], status: "ACTIONED", daysAgo: 9 },
    { content: "Current customer wants to expand from 5 to 25 seats but needs team-level analytics first.", channel: "SALES_CALL_NOTE", sentiment: "POSITIVE", sentimentScore: 0.5, featureArea: "Analytics", themes: ["Feature Requests"], status: "REVIEWED", daysAgo: 10 },

    // Social & Community
    { content: "@LoopApp just saved us 5 hours a week on feedback analysis. Highly recommend to any PM team.", channel: "SOCIAL_MENTION", sentiment: "POSITIVE", sentimentScore: 0.95, featureArea: "General", themes: ["AI Features"], status: "NEW", daysAgo: 1 },
    { content: "The @LoopApp VoC report went straight into our board deck this month. Product team is a fan.", channel: "SOCIAL_MENTION", sentiment: "POSITIVE", sentimentScore: 0.9, featureArea: "Reports", themes: ["Reports"], status: "NEW", daysAgo: 2 },
    { content: "@LoopApp pricing is steep for solo founders. Need a cheaper indie tier to attract early adopters.", channel: "SOCIAL_MENTION", sentiment: "NEGATIVE", sentimentScore: -0.5, featureArea: "Pricing", themes: ["Billing"], status: "NEW", daysAgo: 3 },
    { content: "Just demoed @LoopApp for my team. The Ask LOOP Q&A feature blew absolutely everyone away.", channel: "SOCIAL_MENTION", sentiment: "POSITIVE", sentimentScore: 0.95, featureArea: "AI", themes: ["AI Features"], status: "NEW", daysAgo: 4 },
    { content: "@LoopApp support responded in under 2 hours. That's genuinely rare in B2B SaaS these days.", channel: "SOCIAL_MENTION", sentiment: "POSITIVE", sentimentScore: 0.85, featureArea: "Support", themes: ["UI/UX Design"], status: "NEW", daysAgo: 5 },
    { content: "Disappointed by the @LoopApp mobile experience. This is desktop-only in 2024, which is a deal-breaker.", channel: "SOCIAL_MENTION", sentiment: "NEGATIVE", sentimentScore: -0.7, featureArea: "Mobile", themes: ["Mobile"], status: "NEW", daysAgo: 6 },
    { content: "Our NPS went up 12 points after acting on @LoopApp AI insights. Data-driven product decisions win.", channel: "SOCIAL_MENTION", sentiment: "POSITIVE", sentimentScore: 0.9, featureArea: "AI", themes: ["AI Features"], status: "NEW", daysAgo: 7 },
    { content: "Love the new export feature in LOOP, saved me an hour today on my weekly review. Thank you!", channel: "COMMUNITY_POST", sentiment: "POSITIVE", sentimentScore: 0.9, featureArea: "Reports", themes: ["Reports"], status: "NEW", daysAgo: 1 },
    { content: "Has anyone figured out how to automate feedback ingestion from Intercom via the API?", channel: "COMMUNITY_POST", sentiment: "NEUTRAL", sentimentScore: 0.0, featureArea: "Integrations", themes: ["Integrations"], status: "NEW", daysAgo: 2 },
    { content: "The weekly VoC reports are my favourite feature by far. Leadership finally has context they trust.", channel: "COMMUNITY_POST", sentiment: "POSITIVE", sentimentScore: 0.9, featureArea: "Reports", themes: ["Reports", "AI Features"], status: "NEW", daysAgo: 3 },
    { content: "Tip: use theme colours to build a priority matrix. Absolute game changer for sprint planning.", channel: "COMMUNITY_POST", sentiment: "POSITIVE", sentimentScore: 0.8, featureArea: "Themes", themes: ["UI/UX Design"], status: "NEW", daysAgo: 4 },
    { content: "Is there a Zapier integration on the roadmap? Would love to automate my feedback workflow end-to-end.", channel: "COMMUNITY_POST", sentiment: "NEUTRAL", sentimentScore: 0.1, featureArea: "Integrations", themes: ["Integrations", "Feature Requests"], status: "NEW", daysAgo: 5 },
    { content: "Just noticed the trend detection flagged a critical issue before my team did. The spike detection is great.", channel: "COMMUNITY_POST", sentiment: "POSITIVE", sentimentScore: 0.9, featureArea: "AI", themes: ["AI Features"], status: "NEW", daysAgo: 6 },
    { content: "We integrated LOOP with our data warehouse. The whole team is completely obsessed with it now.", channel: "COMMUNITY_POST", sentiment: "POSITIVE", sentimentScore: 0.95, featureArea: "Integrations", themes: ["Integrations", "AI Features"], status: "NEW", daysAgo: 7 },
    { content: "Suggestion: add sentiment alerts via email when negativity spikes. Would save a lot of monitoring.", channel: "COMMUNITY_POST", sentiment: "NEUTRAL", sentimentScore: 0.2, featureArea: "Alerts", themes: ["Feature Requests"], status: "NEW", daysAgo: 8 },

    // More support tickets (to hit 120+)
    { content: "The bulk re-classify feature would be incredibly useful. Can't do it one by one for 500 items.", channel: "SUPPORT_TICKET", sentiment: "NEUTRAL", sentimentScore: -0.1, featureArea: "AI", themes: ["AI Features", "Feature Requests"], status: "NEW", daysAgo: 13 },
    { content: "Team reporting dashboard shows different numbers than the export. Data inconsistency is a problem.", channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", sentimentScore: -0.7, featureArea: "Reports", themes: ["Reports"], status: "REVIEWED", daysAgo: 14 },
    { content: "The search functionality is really powerful. Full-text search saved us so much time this week.", channel: "SUPPORT_TICKET", sentiment: "POSITIVE", sentimentScore: 0.8, featureArea: "Inbox", themes: ["UI/UX Design"], status: "NEW", daysAgo: 15 },
    { content: "Can we get email digests of the weekly report? Having to log in every time is friction.", channel: "SUPPORT_TICKET", sentiment: "NEUTRAL", sentimentScore: -0.1, featureArea: "Reports", themes: ["Reports", "Feature Requests"], status: "NEW", daysAgo: 16 },
    { content: "Performance degraded significantly after the last update. Everything is 3x slower.", channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", sentimentScore: -0.9, featureArea: "Performance", themes: ["Performance"], status: "ACTIONED", daysAgo: 17 },
    { content: "The role-based access control is exactly what we needed for compliance. Well implemented.", channel: "SUPPORT_TICKET", sentiment: "POSITIVE", sentimentScore: 0.85, featureArea: "Auth", themes: ["SSO/Auth"], status: "NEW", daysAgo: 18 },
    { content: "Multi-language support would be a game changer for our global team spread across 8 countries.", channel: "SUPPORT_TICKET", sentiment: "NEUTRAL", sentimentScore: 0.0, featureArea: "Localization", themes: ["Feature Requests"], status: "NEW", daysAgo: 19 },
    { content: "The CSV template in the docs doesn't match what the importer actually expects. Please update.", channel: "SUPPORT_TICKET", sentiment: "NEGATIVE", sentimentScore: -0.5, featureArea: "Documentation", themes: ["Onboarding"], status: "REVIEWED", daysAgo: 20 },
    { content: "Workspace analytics would help us understand how the team is using LOOP. Usage dashboard needed.", channel: "NPS_SURVEY", sentiment: "NEUTRAL", sentimentScore: 0.1, featureArea: "Analytics", themes: ["Feature Requests"], status: "NEW", daysAgo: 21, customerLabel: "Enterprise" },
    { content: "The product is genuinely great but the documentation is woefully out of date in several places.", channel: "NPS_SURVEY", sentiment: "NEUTRAL", sentimentScore: -0.2, featureArea: "Documentation", themes: ["Onboarding"], status: "NEW", daysAgo: 22, customerLabel: "SMB" },
    { content: "The AI accuracy has gotten noticeably better over the last few months. Keep it up!", channel: "APP_STORE_REVIEW", sentiment: "POSITIVE", sentimentScore: 0.85, featureArea: "AI", themes: ["AI Features"], status: "NEW", daysAgo: 23 },
    { content: "Themes should be editable by analysts, not just admins. Causes too much friction in our workflow.", channel: "APP_STORE_REVIEW", sentiment: "NEUTRAL", sentimentScore: -0.3, featureArea: "RBAC", themes: ["Feature Requests", "UI/UX Design"], status: "NEW", daysAgo: 24 },
    { content: "The time it takes to classify feedback after bulk import is way too long. Needs to be faster.", channel: "APP_STORE_REVIEW", sentiment: "NEGATIVE", sentimentScore: -0.6, featureArea: "Performance", themes: ["Performance", "AI Features"], status: "REVIEWED", daysAgo: 25 },
    { content: "Feature request: saved filter views in the inbox. I set up the same filters every single day.", channel: "COMMUNITY_POST", sentiment: "NEUTRAL", sentimentScore: 0.1, featureArea: "Inbox", themes: ["Feature Requests", "UI/UX Design"], status: "NEW", daysAgo: 26 },
    { content: "The trend spike detection is incredibly useful for catching emerging issues early. Really valuable.", channel: "COMMUNITY_POST", sentiment: "POSITIVE", sentimentScore: 0.9, featureArea: "AI", themes: ["AI Features"], status: "NEW", daysAgo: 27 },
    { content: "We need a dedicated field for customer segment or tier. The label field isn't specific enough.", channel: "SALES_CALL_NOTE", sentiment: "NEUTRAL", sentimentScore: -0.1, featureArea: "Data Model", themes: ["Feature Requests"], status: "NEW", daysAgo: 28 },
    { content: "Competitor offered 30% discount to poach our customer. They mentioned better mobile app.", channel: "SALES_CALL_NOTE", sentiment: "NEGATIVE", sentimentScore: -0.6, featureArea: "Mobile", themes: ["Mobile", "Billing"], status: "REVIEWED", daysAgo: 29 },
    { content: "The onboarding checklist was really helpful for getting started. One of the best I've used.", channel: "NPS_SURVEY", sentiment: "POSITIVE", sentimentScore: 0.8, featureArea: "Onboarding", themes: ["Onboarding"], status: "NEW", daysAgo: 30 },
    { content: "Brilliant product, genuinely changed how our product team operates. 10/10 would recommend.", channel: "APP_STORE_REVIEW", sentiment: "POSITIVE", sentimentScore: 1.0, featureArea: "General", themes: ["AI Features"], status: "NEW", daysAgo: 5 },
    { content: "The filter combinations in the inbox are incredibly powerful. Found a critical bug pattern in minutes.", channel: "APP_STORE_REVIEW", sentiment: "POSITIVE", sentimentScore: 0.9, featureArea: "Inbox", themes: ["UI/UX Design"], status: "NEW", daysAgo: 8 },
  ];

  // Insert all feedback
  for (const item of feedbackItems) {
    const daysAgo = item.daysAgo;
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - Math.random() * 43200000);

    const feedback = await db.feedback.create({
      data: {
        content: item.content,
        channel: item.channel,
        sentiment: item.sentiment,
        sentimentScore: item.sentimentScore,
        featureArea: item.featureArea,
        status: item.status,
        customerLabel: item.customerLabel,
        classifiedAt: createdAt,
        workspaceId: workspace.id,
        createdAt,
      },
    });

    // Link themes
    for (const themeName of item.themes) {
      const theme = themeMap[themeName];
      if (theme) {
        await db.feedbackTheme.create({
          data: {
            feedbackId: feedback.id,
            themeId: theme.id,
            confidence: 0.85 + Math.random() * 0.15,
          },
        });
      }
    }

    // Simple pseudo-embedding for all items
    const vector = generatePseudoEmbedding(item.content);
    await db.embedding.create({
      data: { feedbackId: feedback.id, vector },
    });
  }

  console.log(`✅ ${feedbackItems.length} feedback items seeded`);

  const totalCount = await db.feedback.count({ where: { workspaceId: workspace.id } });
  console.log(`\n🎉 Seed complete!`);
  console.log(`   Workspace: ${workspace.name} (${workspace.id})`);
  console.log(`   Users: 3 (admin, analyst, viewer)`);
  console.log(`   Themes: ${themes.length}`);
  console.log(`   Feedback: ${totalCount} items`);
  console.log(`\n   Login credentials:`);
  console.log(`   Admin:    admin@demo.com   / Demo1234!`);
  console.log(`   Analyst:  analyst@demo.com / Demo1234!`);
  console.log(`   Viewer:   viewer@demo.com  / Demo1234!`);
}

function generatePseudoEmbedding(text: string): number[] {
  const dim = 128;
  const vec = new Array(dim).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const code = word.charCodeAt(j);
      const idx = (code * 31 + i * 7 + j * 13) % dim;
      vec[idx] += 1 / (1 + Math.log(i + 1));
    }
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / mag);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
