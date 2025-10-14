import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    })
  }

  try {
    const { name, email, subject, message } = req.body

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email address' 
      })
    }

    console.log('Contact form submission:', {
      name,
      email,
      subject,
      message: message.substring(0, 50) + '...'
    })

    return res.status(200).json({ 
      success: true, 
      message: 'Thank you for your message! We will get back to you soon.' 
    })
  } catch (error) {
    console.error('Error processing contact form:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send message. Please try again later.' 
    })
  }
}

