export const dynamic = 'force-dynamic'

export async function POST() {
  return Response.json({ 
    success: true, 
    message: 'Simple POST test works!',
    timestamp: new Date().toISOString()
  })
}

export async function GET() {
  return Response.json({ 
    success: true, 
    message: 'Simple GET test works!',
    timestamp: new Date().toISOString()
  })
}

