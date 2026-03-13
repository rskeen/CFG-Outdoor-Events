export async function sendGroupmeMessage(message: string): Promise<void> {
  const botId = process.env.GROUPME_BOT_ID
  if (!botId) {
    throw new Error("GROUPME_BOT_ID is not set")
  }

  const response = await fetch("https://api.groupme.com/v3/bots/post", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bot_id: botId,
      text: message,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `GroupMe API error: ${response.status} ${response.statusText}`
    )
  }
}
