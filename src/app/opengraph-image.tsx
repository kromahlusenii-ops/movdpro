import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'MOVD Pro - Professional Apartment Search for Charlotte Locators'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f5f1e8',
          padding: '60px 80px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 0% 100%, rgba(200, 112, 64, 0.08) 0%, transparent 50%), radial-gradient(circle at 100% 0%, rgba(45, 90, 66, 0.06) 0%, transparent 50%)',
          }}
        />

        {/* Top section with logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#c87040',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 700 }}>M</span>
          </div>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#1a1a1a',
              letterSpacing: '-0.02em',
            }}
          >
            MOVD Pro
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {/* Tagline */}
          <div
            style={{
              fontSize: '72px',
              fontWeight: 600,
              color: '#1a1a1a',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '24px',
            }}
          >
            Less research.
          </div>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 600,
              fontStyle: 'italic',
              color: '#c87040',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '40px',
            }}
          >
            More placements.
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '26px',
              color: '#666666',
              lineHeight: 1.5,
              maxWidth: '700px',
            }}
          >
            The professional apartment search tool for Charlotte locators
          </div>
        </div>

      </div>
    ),
    {
      ...size,
    }
  )
}
