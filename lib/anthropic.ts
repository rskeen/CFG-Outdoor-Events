import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateGroupmePost(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    system:
      "You write short, energetic group notifications for an outdoor endurance racing community called CFG. Keep it under 160 characters. Use 1-2 relevant emojis. Be enthusiastic but not cheesy.",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic API")
  }

  return content.text.trim()
}

export async function analyzeScraperSource(html: string): Promise<object> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system:
      "You are an expert web scraper configuration generator. Analyze HTML from race event websites and return a JSON configuration object for scraping races. The JSON must include: selector (CSS selector for race list items), fields (object mapping field names to CSS selectors within each item), date_format (detected date format string), and notes (any special handling needed). Respond ONLY with valid JSON, no markdown.",
    messages: [
      {
        role: "user",
        content: `Analyze this HTML from a race event website and generate a scraper configuration JSON:\n\n${html.slice(0, 8000)}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic API")
  }

  try {
    return JSON.parse(content.text.trim())
  } catch {
    return { raw: content.text.trim(), error: "Could not parse as JSON" }
  }
}
