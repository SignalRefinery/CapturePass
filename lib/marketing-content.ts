export type MarketingLink = {
  href: string;
  label: string;
};

export type ResourceArticle = {
  category: "dealerships" | "insurance" | "real-estate" | "sales";
  description: string;
  excerpt: string;
  href: string;
  intro: string;
  relatedLinks: MarketingLink[];
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
  title: string;
};

export type SpringfieldPage = {
  description: string;
  href: string;
  intro: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
  title: string;
  relatedLinks: MarketingLink[];
};

export const RESOURCE_CATEGORIES = [
  {
    description: "Lead capture, inventory sharing, and showroom follow-up guidance for dealership teams.",
    href: "/resources/category/dealerships",
    key: "dealerships",
    label: "Dealerships"
  },
  {
    description: "Referral networking, relationship building, and follow-up workflows for insurance professionals.",
    href: "/resources/category/insurance",
    key: "insurance",
    label: "Insurance"
  },
  {
    description: "Open houses, vendor networks, and agent-specific contact capture strategies.",
    href: "/resources/category/real-estate",
    key: "real-estate",
    label: "Real Estate"
  },
  {
    description: "Team accountability, lead ownership, and turnover protection for sales organizations.",
    href: "/resources/category/sales",
    key: "sales",
    label: "Sales"
  }
] as const;

export const RESOURCE_ARTICLES: ResourceArticle[] = [
  {
    category: "sales",
    description: "A practical guide to how NFC business cards work, what happens on tap, and where they fit in a modern CapturePass workflow.",
    excerpt: "Learn how NFC cards connect the physical handoff to a digital profile, a saved contact, and the next step in your funnel.",
    href: "/resources/how-nfc-business-cards-work",
    intro:
      "NFC business cards are useful because they move someone from a quick in-person exchange into a digital page where they can save your contact, open your links, and continue the conversation without friction.",
    title: "How NFC Business Cards Work",
    relatedLinks: [
      { href: "/pricing", label: "Pricing" },
      { href: "/business", label: "Business" },
      { href: "/contact-capture-nfc-cards", label: "Contact Capture NFC Cards" }
    ],
    sections: [
      {
        heading: "What NFC actually does",
        paragraphs: [
          "Near-field communication lets a phone open a link when it is brought close to a card. The card itself is simple; the value comes from the page it opens.",
          "With CapturePass, that page can be a profile, contact capture flow, booking link, or industry-specific destination."
        ]
      },
      {
        heading: "Why the workflow matters",
        paragraphs: [
          "The best NFC card does not just share a URL. It shortens the path between the conversation and the follow-up action.",
          "That is why CapturePass pages focus on saved contacts, reusable links, and clear calls to action."
        ]
      },
      {
        heading: "Where NFC cards fit best",
        paragraphs: [
          "They work especially well for sales teams, local businesses, dealerships, and anyone who meets people in person and needs a memorable follow-up path."
        ]
      }
    ]
  },
  {
    category: "sales",
    description: "A guide comparing CapturePass-style contact capture with paper cards that are lost, delayed, or never followed up.",
    excerpt: "See why digital capture creates a cleaner follow-up workflow than a traditional business card exchange.",
    href: "/resources/contact-capture-vs-traditional-business-cards",
    intro:
      "Traditional business cards are easy to hand out, but they are also easy to forget, lose, or toss after an event. Contact capture gives the handoff a second step that keeps the relationship alive.",
    title: "Contact Capture vs Traditional Business Cards",
    relatedLinks: [
      { href: "/contact-capture-nfc-cards", label: "Contact Capture NFC Cards" },
      { href: "/business-individual", label: "Business Individual" },
      { href: "/sales-teams", label: "Sales Teams" }
    ],
    sections: [
      {
        heading: "Why paper cards fail",
        paragraphs: [
          "Paper is passive. It does not remind the recipient to save you, and it cannot collect their information in return.",
          "If the card is misplaced after the event, the relationship often disappears with it."
        ]
      },
      {
        heading: "What contact capture changes",
        paragraphs: [
          "Contact capture turns the interaction into a reciprocal exchange. Instead of only giving away your details, you can ask for the other person’s information too.",
          "That makes follow-up more actionable and gives your CRM cleaner data."
        ]
      },
      {
        heading: "How CapturePass helps",
        paragraphs: [
          "CapturePass combines a shareable profile, NFC or QR trigger, and a contact-oriented follow-up path so teams can keep the relationship moving."
        ]
      }
    ]
  },
  {
    category: "sales",
    description: "How sales teams can use digital business cards to keep lead ownership clear and contact sharing consistent.",
    excerpt: "A playbook for keeping every rep on-brand while protecting leads from being lost after the first meeting.",
    href: "/resources/digital-business-cards-for-sales-teams",
    intro:
      "Sales teams need a tool that works in the room, at the conference, and in the follow-up sequence. Digital business cards can do that when they are tied to the right process.",
    title: "Digital Business Cards for Sales Teams",
    relatedLinks: [
      { href: "/sales-teams", label: "Sales Teams" },
      { href: "/business/pricing", label: "Business Pricing" },
      { href: "/contact-capture-nfc-cards", label: "Contact Capture NFC Cards" }
    ],
    sections: [
      {
        heading: "Team accountability",
        paragraphs: [
          "A good digital card system should let managers see which reps are using the tool and which conversations are turning into contacts.",
          "That creates a cleaner handoff between outreach, meetings, and CRM updates."
        ]
      },
      {
        heading: "Lead ownership",
        paragraphs: [
          "When the card belongs to the rep, the relationship is easier to preserve. That matters when pipeline tracking depends on a single owner."
        ]
      },
      {
        heading: "Turnover protection",
        paragraphs: [
          "If someone changes roles or leaves, the same card can often be repurposed. That keeps the investment alive and reduces reprint waste."
        ]
      }
    ]
  },
  {
    category: "sales",
    description: "Why businesses lose leads after networking events and how a structured contact capture workflow closes the gap.",
    excerpt: "A breakdown of the common failure points between first contact and actual follow-up.",
    href: "/resources/why-businesses-lose-leads-after-networking-events",
    intro:
      "Networking events create opportunity, but they also create friction. People leave with stacks of cards, incomplete notes, and follow-up intentions that are easy to delay.",
    title: "Why Businesses Lose Leads After Networking Events",
    relatedLinks: [
      { href: "/contact-capture-nfc-cards", label: "Contact Capture NFC Cards" },
      { href: "/business", label: "Business" },
      { href: "/pricing", label: "Pricing" }
    ],
    sections: [
      {
        heading: "The common failure points",
        paragraphs: [
          "People forget to save a contact, delay the follow-up, or never convert paper notes into a next step.",
          "The event itself becomes the end of the workflow instead of the beginning."
        ]
      },
      {
        heading: "Why a digital workflow helps",
        paragraphs: [
          "A digital card or contact capture page can push the interaction into a structured next step immediately, which reduces the chance of the lead going cold."
        ]
      },
      {
        heading: "What to optimize for",
        paragraphs: [
          "Make the next action obvious, keep the page fast, and give the recipient a simple way to save your contact or share theirs."
        ]
      }
    ]
  },
  {
    category: "dealerships",
    description: "How NFC business cards help dealerships capture leads, reduce follow-up loss, and support multi-location teams.",
    excerpt: "A dealership-specific guide to test drives, CRM handoff, and showroom-to-follow-up workflows.",
    href: "/resources/nfc-business-cards-for-car-dealerships",
    intro:
      "Dealership teams lose deals when the test drive ends, the salesperson changes desks, or the customer leaves with too many cards and too little context. NFC business cards help keep the relationship attached to the right rep.",
    title: "NFC Business Cards for Car Dealerships",
    relatedLinks: [
      { href: "/dealerships", label: "Dealerships" },
      { href: "/business/pricing", label: "Business Pricing" },
      { href: "/resources/category/dealerships", label: "Dealership Resources" }
    ],
    sections: [
      {
        heading: "Where lead loss happens",
        paragraphs: [
          "The most common loss points are after the first walkaround, after the test drive, and after the customer says they need to think about it.",
          "If the rep’s contact details are buried in a paper card, the follow-up window can close before the customer reconnects."
        ]
      },
      {
        heading: "How CRM handoff should work",
        paragraphs: [
          "A dealership workflow should let the rep capture the contact, attach the right notes, and move the lead into the CRM without duplicate data entry.",
          "CapturePass can sit in front of that process and make the capture moment easier."
        ]
      },
      {
        heading: "Multi-location support",
        paragraphs: [
          "For dealer groups, reusable digital profiles help maintain continuity across rooftops and staff changes without reprinting every time someone moves."
        ]
      }
    ]
  },
  {
    category: "insurance",
    description: "How digital business cards help insurance agents build referral networks and keep long-term relationships active.",
    excerpt: "A useful insurance workflow guide focused on networking, events, and follow-up.",
    href: "/resources/digital-business-cards-for-insurance-agents",
    intro:
      "Insurance relationships often start at an event or a referral and continue for years. A digital business card helps keep that relationship easy to reopen when someone needs help again.",
    title: "Digital Business Cards for Insurance Agents",
    relatedLinks: [
      { href: "/insurance-agents", label: "Insurance Agents" },
      { href: "/business/pricing", label: "Business Pricing" },
      { href: "/resources/category/insurance", label: "Insurance Resources" }
    ],
    sections: [
      {
        heading: "Referral networking",
        paragraphs: [
          "Insurance professionals rely on trusted referrals, community presence, and repeated exposure. A digital card makes it easier to stay in the referral path without asking someone to remember a paper card."
        ]
      },
      {
        heading: "Community events",
        paragraphs: [
          "At local events and sponsorships, a tap or scan gives prospects a fast way to save your contact and revisit coverage or quote information later."
        ]
      },
      {
        heading: "Long-term follow-up",
        paragraphs: [
          "Coverage conversations are often revisited months later. A digital page keeps the agent easy to find when the time is right."
        ]
      }
    ]
  },
  {
    category: "real-estate",
    description: "Why NFC business cards are useful for realtors, open houses, vendor networks, and property-specific workflows.",
    excerpt: "An agent-focused guide to using CapturePass for property sharing and relationship building.",
    href: "/resources/nfc-business-cards-for-realtors",
    intro:
      "Real estate deals move through open houses, vendor referrals, mortgage conversations, and property-specific follow-up. NFC business cards make those handoffs easier to manage.",
    title: "NFC Business Cards for Realtors",
    relatedLinks: [
      { href: "/real-estate-agents", label: "Real Estate Agents" },
      { href: "/business/pricing", label: "Business Pricing" },
      { href: "/resources/category/real-estate", label: "Real Estate Resources" }
    ],
    sections: [
      {
        heading: "Open houses and showings",
        paragraphs: [
          "At an open house, the goal is to make a visitor save the agent and keep the listing in front of them after they leave.",
          "CapturePass can send them to listings, valuation pages, or a contact capture form."
        ]
      },
      {
        heading: "Vendor and referral networks",
        paragraphs: [
          "Agents work through lenders, inspectors, contractors, and other referral partners. A digital card helps keep those relationships organized and easy to revisit."
        ]
      },
      {
        heading: "Property-specific use cases",
        paragraphs: [
          "The same profile can support a specific listing, a community landing page, or a broader agent brand depending on the opportunity."
        ]
      }
    ]
  }
];

export const SPRINGFIELD_PAGES: Record<string, SpringfieldPage> = {
  "springfield-il-nfc-business-cards": {
    title: "Springfield NFC Business Cards",
    description:
      "CapturePass NFC business cards for Springfield, Illinois teams that want better contact capture, follow-up, and branded sharing.",
    href: "/springfield-il-nfc-business-cards",
    intro:
      "If you are looking for NFC business cards in Springfield, Illinois, CapturePass helps you move from a quick in-person exchange to a branded page that supports contact capture, lead routing, and follow-up.",
    relatedLinks: [
      { href: "/dealerships", label: "Dealerships" },
      { href: "/business", label: "Business" },
      { href: "/pricing", label: "Pricing" },
      { href: "/resources/how-nfc-business-cards-work", label: "How NFC Business Cards Work" }
    ],
    sections: [
      {
        heading: "Why Springfield teams use NFC cards",
        paragraphs: [
          "Springfield businesses often depend on in-person relationships, local referrals, and fast follow-up. NFC cards help the handoff feel modern while keeping the process simple.",
          "They are especially useful when a rep needs to share their contact information, a booking link, or a business page without asking someone to type a long URL."
        ]
      },
      {
        heading: "What makes a strong card workflow",
        paragraphs: [
          "The best setup does not stop at the tap. It sends the visitor to a page that tells them exactly what to do next and makes the rep easy to save."
        ]
      },
      {
        heading: "Where CapturePass fits",
        paragraphs: [
          "CapturePass can support individuals, teams, and vertical-specific workflows that need a better local follow-up path."
        ]
      }
    ]
  },
  "springfield-il-digital-business-cards": {
    title: "Springfield Digital Business Cards",
    description:
      "Digital business cards for Springfield, Illinois professionals who want stronger sharing, better links, and easier contact capture.",
    href: "/springfield-il-digital-business-cards",
    intro:
      "Digital business cards work well in Springfield because they can be shared in person, by text, or after a meeting, while still keeping the same branded profile in front of the recipient.",
    relatedLinks: [
      { href: "/pricing", label: "Pricing" },
      { href: "/business-individual", label: "Business Individual" },
      { href: "/resources/digital-business-cards-for-sales-teams", label: "Digital Business Cards for Sales Teams" }
    ],
    sections: [
      {
        heading: "Helpful for local networking",
        paragraphs: [
          "Springfield networking events, chamber meetups, and referral conversations all benefit from a profile that is easy to save and revisit."
        ]
      },
      {
        heading: "Better than a static card",
        paragraphs: [
          "Unlike a paper card, a digital card can be updated without reprinting, which makes it easier to keep links current and accurate."
        ]
      },
      {
        heading: "Built for follow-up",
        paragraphs: [
          "CapturePass pages are designed to move people from a quick introduction into a contact or booking action."
        ]
      }
    ]
  },
  "springfield-il-contact-capture": {
    title: "Springfield Contact Capture",
    description:
      "Springfield, Illinois contact capture pages from CapturePass that help teams turn conversations into saved contacts and next steps.",
    href: "/springfield-il-contact-capture",
    intro:
      "Contact capture is valuable anywhere people meet in person, and Springfield is no exception. A clean contact flow helps you preserve the relationship after the conversation ends.",
    relatedLinks: [
      { href: "/contact-capture-nfc-cards", label: "Contact Capture NFC Cards" },
      { href: "/sales-teams", label: "Sales Teams" },
      { href: "/resources/contact-capture-vs-traditional-business-cards", label: "Contact Capture vs Traditional Cards" }
    ],
    sections: [
      {
        heading: "Why contact capture matters locally",
        paragraphs: [
          "Springfield teams often work through referrals, events, and direct outreach. A contact capture page helps convert that interaction into something actionable."
        ]
      },
      {
        heading: "What good contact capture feels like",
        paragraphs: [
          "It should be fast, mobile-friendly, and clear about what happens after the form is submitted."
        ]
      },
      {
        heading: "Where to use it",
        paragraphs: [
          "Use it at sales meetings, local events, community sponsorships, and anywhere a quick introduction deserves a better follow-up path."
        ]
      }
    ]
  },
  "springfield-il-sales-team-business-cards": {
    title: "Springfield Sales Team Business Cards",
    description:
      "Springfield sales team business cards from CapturePass for reps who need lead ownership, contact capture, and better follow-up.",
    href: "/springfield-il-sales-team-business-cards",
    intro:
      "Sales teams in Springfield need cards that help reps stay on-brand while keeping the relationship attached to the person who made it. CapturePass supports that flow without adding friction.",
    relatedLinks: [
      { href: "/sales-teams", label: "Sales Teams" },
      { href: "/business/pricing", label: "Business Pricing" },
      { href: "/resources/digital-business-cards-for-sales-teams", label: "Digital Business Cards for Sales Teams" }
    ],
    sections: [
      {
        heading: "Lead ownership and accountability",
        paragraphs: [
          "When a rep hands out a card, the next step should still point back to that rep. That keeps follow-up clean and ownership obvious."
        ]
      },
      {
        heading: "Protecting the relationship",
        paragraphs: [
          "If a salesperson changes roles or leaves, the card should not turn into dead inventory. Reusable digital profiles help keep the investment useful."
        ]
      },
      {
        heading: "Springfield-friendly use cases",
        paragraphs: [
          "CapturePass works well for field sales, local B2B, service businesses, and any team that relies on in-person conversations."
        ]
      }
    ]
  }
};

export function getResourceArticle(slug: string) {
  return RESOURCE_ARTICLES.find((article) => article.href.endsWith(`/${slug}`)) || null;
}

export function getResourcesForCategory(category: ResourceArticle["category"]) {
  return RESOURCE_ARTICLES.filter((article) => article.category === category);
}

export function getSpringfieldPage(slug: string) {
  return SPRINGFIELD_PAGES[slug] || null;
}
