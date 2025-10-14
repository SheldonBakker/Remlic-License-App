import type { VercelRequest, VercelResponse } from '@vercel/node'

const PSIRA_API_URL = 'https://psiraapi.sortelearn.com/api/SecurityOfficer/Get_ApplicantDetails'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { idNumber, psiraNumber, usesPsiraNumber } = req.body

    if (!idNumber && !psiraNumber) {
      return res.status(400).json({ 
        error: 'Either idNumber or psiraNumber is required' 
      })
    }

    const requestBody = usesPsiraNumber 
      ? { psiraNumber }
      : { idNumber }

    const response = await fetch(PSIRA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('PSIRA API Error:', response.status, errorText)
      return res.status(response.status).json({ 
        error: 'PSIRA API request failed',
        details: errorText 
      })
    }

    const data = await response.json()
    return res.status(200).json(data)

  } catch (error) {
    console.error('PSIRA Proxy Error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

