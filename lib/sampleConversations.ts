// lib/sampleConversations.ts
// Sample conversations to pre-populate new widgets

type SampleMessage = {
  role: "user" | "assistant";
  content: string;
};

type SampleConversation = {
  messages: SampleMessage[];
};

export const SAMPLE_CONVERSATIONS: Record<string, SampleConversation[]> = {
  legal: [
    {
      messages: [
        { role: "user", content: "What types of cases do you handle?" },
        {
          role: "assistant",
          content: "We specialize in personal injury, family law, and business litigation. Each case receives personalized attention from our experienced attorneys. Would you like to schedule a free consultation to discuss your specific situation?",
        },
      ],
    },
    {
      messages: [
        { role: "user", content: "How much does a consultation cost?" },
        {
          role: "assistant",
          content: "We offer a complimentary initial consultation to discuss your case. This allows us to understand your needs and explain how we can help. There's no obligation, and all information shared is confidential. Would you like to book a time that works for you?",
        },
      ],
    },
  ],
  healthcare: [
    {
      messages: [
        { role: "user", content: "Do you accept walk-in appointments?" },
        {
          role: "assistant",
          content: "We do our best to accommodate walk-ins, but scheduled appointments ensure you receive dedicated time with your provider. For urgent matters, please call us at [phone] and we'll fit you in as quickly as possible. Would you like to schedule an appointment now?",
        },
      ],
    },
    {
      messages: [
        { role: "user", content: "What insurance plans do you accept?" },
        {
          role: "assistant",
          content: "We accept most major insurance plans including Medicare and Medicaid. To verify your specific coverage, I'd recommend calling our billing department at [phone] with your insurance information. They can confirm coverage and explain any out-of-pocket costs.",
        },
      ],
    },
  ],
  restaurant: [
    {
      messages: [
        { role: "user", content: "Do I need a reservation?" },
        {
          role: "assistant",
          content: "We welcome both reservations and walk-ins! Reservations are recommended for parties of 4 or more, especially on weekends. Would you like me to help you make a reservation? I can also share our current availability.",
        },
      ],
    },
    {
      messages: [
        { role: "user", content: "Do you have vegetarian options?" },
        {
          role: "assistant",
          content: "Yes! We have several delicious vegetarian dishes including our popular roasted vegetable pasta and black bean burgers. We can also modify many dishes to be vegetarian upon request. Our chef is happy to accommodate dietary preferences - just let your server know!",
        },
      ],
    },
  ],
  realestate: [
    {
      messages: [
        { role: "user", content: "How do I get started buying a home?" },
        {
          role: "assistant",
          content: "Great question! The first step is getting pre-approved for a mortgage so you know your budget. Then we can start touring homes that match your needs. I'd love to schedule a quick call to understand what you're looking for and explain our process. Are you available this week?",
        },
      ],
    },
    {
      messages: [
        { role: "user", content: "What areas do you cover?" },
        {
          role: "assistant",
          content: "We serve the entire [city] metro area, including [neighborhoods]. Our team has deep local expertise and can provide insights on schools, amenities, and market trends in each area. What neighborhoods are you interested in?",
        },
      ],
    },
  ],
  ecommerce: [
    {
      messages: [
        { role: "user", content: "What's your return policy?" },
        {
          role: "assistant",
          content: "We offer hassle-free returns within 30 days of purchase. Items must be unused and in original packaging. Simply initiate a return through your account, and we'll send you a prepaid shipping label. Refunds are processed within 5-7 business days. Need help with a return?",
        },
      ],
    },
    {
      messages: [
        { role: "user", content: "How long does shipping take?" },
        {
          role: "assistant",
          content: "Standard shipping takes 5-7 business days and is free on orders over $50. We also offer expedited 2-3 day shipping for $9.99. Orders placed before 2pm EST ship the same day! You'll receive tracking info via email once your order ships.",
        },
      ],
    },
  ],
  saas: [
    {
      messages: [
        { role: "user", content: "Is there a free trial?" },
        {
          role: "assistant",
          content: "Yes! We offer a 14-day free trial with full access to all features - no credit card required. This gives you plenty of time to explore the platform and see if it's the right fit. Would you like me to help you get started with a trial account?",
        },
      ],
    },
    {
      messages: [
        { role: "user", content: "How is pricing structured?" },
        {
          role: "assistant",
          content: "Our pricing scales with your needs. We have three tiers: Starter ($29/mo) for small teams, Professional ($99/mo) for growing businesses, and Enterprise (custom) for large organizations. All plans include core features - higher tiers add advanced integrations and priority support. Want to see a detailed comparison?",
        },
      ],
    },
  ],
  fitness: [
    {
      messages: [
        { role: "user", content: "What membership options do you have?" },
        {
          role: "assistant",
          content: "We offer flexible memberships to fit your lifestyle! Options include month-to-month ($59/mo), 6-month commitment ($49/mo), and annual ($39/mo). All memberships include unlimited classes, equipment access, and guest passes. We're currently running a special - would you like to hear more?",
        },
      ],
    },
    {
      messages: [
        { role: "user", content: "Can I try a class before joining?" },
        {
          role: "assistant",
          content: "Absolutely! We offer a free trial class so you can experience our facility and meet our trainers. No commitment required. We have classes throughout the day - what time works best for you? I can reserve your spot right now!",
        },
      ],
    },
  ],
  custom: [
    {
      messages: [
        { role: "user", content: "What services do you offer?" },
        {
          role: "assistant",
          content: "We provide a range of services tailored to your needs. I'd love to learn more about what you're looking for so I can provide specific information. Could you tell me a bit more about your goals?",
        },
      ],
    },
    {
      messages: [
        { role: "user", content: "How can I get in touch?" },
        {
          role: "assistant",
          content: "You can reach us by phone, email, or through this chat! For immediate assistance, call us at [phone]. For non-urgent inquiries, email [email] and we'll respond within 24 hours. What would you prefer?",
        },
      ],
    },
  ],
};

export function getSampleConversations(industryId: string): SampleConversation[] {
  return SAMPLE_CONVERSATIONS[industryId] || SAMPLE_CONVERSATIONS.custom;
}
