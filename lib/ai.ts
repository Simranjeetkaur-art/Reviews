// AI Feedback Generation using OpenAI or any LLM API

import { GoogleMapsAboutContent } from "./google-maps-scraper";

interface BusinessData {
  businessName: string;
  businessType: string;
  products: string[];
  employees?: string[];
  aboutContent?: GoogleMapsAboutContent | null;
}

interface GeneratedFeedback {
  content: string;
  sentiment: "positive" | "neutral";
  category: string;
}

export async function generateFeedbacks(
  businessData: BusinessData,
): Promise<GeneratedFeedback[]> {
  const { businessName, businessType, products, employees, aboutContent } =
    businessData;

  // Build context from Google Maps About page
  let aboutContext = "";
  if (aboutContent) {
    aboutContext = "\n\nADDITIONAL BUSINESS INFORMATION FROM GOOGLE MAPS:\n";

    if (aboutContent.about) {
      aboutContext += `About: ${aboutContent.about}\n`;
    }

    if (aboutContent.serviceOptions && aboutContent.serviceOptions.length > 0) {
      aboutContext += `Service Options: ${aboutContent.serviceOptions.join(", ")}\n`;
    }

    if (aboutContent.accessibility && aboutContent.accessibility.length > 0) {
      aboutContext += `Accessibility Features: ${aboutContent.accessibility.join(", ")}\n`;
    }

    if (aboutContent.highlights && aboutContent.highlights.length > 0) {
      aboutContext += `Highlights: ${aboutContent.highlights.join(", ")}\n`;
    }

    if (aboutContent.amenities && aboutContent.amenities.length > 0) {
      aboutContext += `Amenities: ${aboutContent.amenities.join(", ")}\n`;
    }

    aboutContext +=
      "\nIMPORTANT: Incorporate these details naturally into the reviews to make them feel authentic and personalized. Mention specific service options, accessibility features, highlights, and amenities where relevant.";
  }

  const prompt = `Generate 100 unique, authentic Google review templates for ${businessName}, a ${businessType}.

Products/Services: ${products.join(", ")}
${employees && employees.length > 0 ? `Staff Members: ${employees.join(", ")}` : ""}${aboutContext}

CRITICAL REQUIREMENTS:
- 70 positive reviews (4-5 stars tone)
- 30 neutral reviews (3-4 stars tone)
- Each 40-80 words
- Natural language, varied structure
- MUST mention specific staff names (like ${employees && employees.length > 0 ? employees.join(", ") : "staff members"}) naturally in many reviews to make them feel personalized and humanized
- MUST mention specific products/services by name in reviews
${aboutContent ? "- MUST naturally incorporate business details from Google Maps (service options, accessibility, highlights, amenities) into reviews to make them feel authentic and humanized" : ""}
- Include emotional authenticity and personal experiences
- Use phrases like "Sara was so helpful", "Mike recommended the...", "The staff member Sarah...", etc.
- Avoid repetitive phrases
- Mix formal and casual tones
- Make reviews feel like real customers wrote them

Format as JSON array: [{"content": "review text", "sentiment": "positive"|"neutral", "category": "product/service category"}]`;

  try {
    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Return mock data if no API key
      return generateMockFeedbacks(businessData);
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates authentic, diverse customer reviews. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      return generateMockFeedbacks(businessData);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return generateMockFeedbacks(businessData);
    }

    const feedbacks = JSON.parse(jsonMatch[0]);
    return feedbacks.slice(0, 100); // Ensure we only return 100
  } catch (error) {
    console.error("Error generating feedbacks:", error);
    return generateMockFeedbacks(businessData);
  }
}

// Mock feedback generator for development/testing
function generateMockFeedbacks(
  businessData: BusinessData,
): GeneratedFeedback[] {
  const { businessName, businessType, products, employees } = businessData;
  const feedbacks: GeneratedFeedback[] = [];

  // Get random product and employee for variety
  const getRandomProduct = () =>
    products[Math.floor(Math.random() * products.length)] || "service";
  const getRandomEmployee = () =>
    employees && employees.length > 0
      ? employees[Math.floor(Math.random() * employees.length)]
      : null;

  const positiveTemplates = [
    `Amazing experience at ${businessName}! ${getRandomEmployee() ? `${getRandomEmployee()} was so helpful and recommended the ${getRandomProduct()}` : `The ${getRandomProduct()}`} which exceeded my expectations. Highly recommend to anyone looking for quality ${businessType}.`,
    `I've been coming to ${businessName} for months now and they never disappoint. ${getRandomEmployee() ? `${getRandomEmployee()} always remembers my order` : `The attention to detail`} and customer service is outstanding.`,
    `Best ${businessType} in town! The ${getRandomProduct()} is top-notch and ${getRandomEmployee() ? `${getRandomEmployee()} is incredibly friendly and knowledgeable` : `the staff is incredibly friendly`}.`,
    `Absolutely love ${businessName}! ${getRandomEmployee() ? `${getRandomEmployee()} helped me choose the perfect ${getRandomProduct()}` : `Great quality`}, fair prices, and excellent service. Will definitely be back!`,
    `Five stars all the way! ${businessName} has become my go-to place for ${getRandomProduct()}. ${getRandomEmployee() ? `${getRandomEmployee()} made my visit special` : `Couldn't be happier with my experience`}.`,
    `${getRandomEmployee() ? `${getRandomEmployee()} went above and beyond` : `Outstanding service`} at ${businessName}! The ${getRandomProduct()} was fantastic and the whole experience was wonderful.`,
    `Had the best ${getRandomProduct()} at ${businessName} today! ${getRandomEmployee() ? `${getRandomEmployee()} was so attentive and made sure everything was perfect` : `The service was excellent`}. Highly recommend!`,
    `${businessName} never fails to impress! ${getRandomEmployee() ? `${getRandomEmployee()} suggested the ${getRandomProduct()} and it was amazing` : `The ${getRandomProduct()} is always great`}. Great place!`,
  ];

  const neutralTemplates = [
    `Decent experience at ${businessName}. The ${getRandomProduct()} was good${getRandomEmployee() ? ` and ${getRandomEmployee()} was helpful` : ""}, though there's room for improvement in some areas.`,
    `Solid ${businessType} with good ${getRandomProduct()}. ${getRandomEmployee() ? `${getRandomEmployee()} was friendly` : `Service was fine`}, nothing exceptional but no complaints either.`,
    `${businessName} is a reliable option for ${businessType}. Got the ${getRandomProduct()} I needed${getRandomEmployee() ? ` and ${getRandomEmployee()} was professional` : ""}, prices are reasonable.`,
  ];

  // Generate 70 positive feedbacks with variety
  for (let i = 0; i < 70; i++) {
    const template = positiveTemplates[i % positiveTemplates.length];
    feedbacks.push({
      content: template,
      sentiment: "positive",
      category: products[i % products.length] || "general",
    });
  }

  // Generate 30 neutral feedbacks
  for (let i = 0; i < 30; i++) {
    const template = neutralTemplates[i % neutralTemplates.length];
    feedbacks.push({
      content: template,
      sentiment: "neutral",
      category: products[i % products.length] || "general",
    });
  }

  return feedbacks;
}
