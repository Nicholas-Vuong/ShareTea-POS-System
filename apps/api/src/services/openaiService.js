const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

export async function getMenuRecommendations ({ temperatureC, description }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[openai] OPENAI_API_KEY not set, returning static recommendations')
    return [
      'Classic Milk Tea with a splash of oat milk',
      'Taro Milk Tea with boba pearls',
      'Mango Green Tea with lychee jelly'
    ]
  }

  const messages = [
    {
      role: 'system',
      content: 'You suggest bubble tea drinks.'
    },
    {
      role: 'user',
      content: `Current weather: ${temperatureC}°C and ${description}. Recommend three Sharetea drinks.`
    }
  ]

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 200,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content ?? ''
  return content
    .split('\n')
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)
}
