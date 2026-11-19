import React from 'react';
import { Box, Typography, keyframes } from '@mui/material';

const emberGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 6px 2px rgba(249, 115, 22, 0.8), 0 0 14px 4px rgba(239, 68, 68, 0.6);
    background-color: #F97316;
  }
  50% {
    box-shadow: 0 0 10px 4px rgba(251, 146, 60, 0.95), 0 0 20px 6px rgba(220, 38, 38, 0.8);
    background-color: #FBBF24;
  }
`;

const smokeWisp1 = keyframes`
  0% {
    transform: translate(0, 0) scale(0.6) rotate(0deg);
    opacity: 0;
  }
  20% {
    opacity: 0.75;
  }
  50% {
    transform: translate(-14px, -35px) scale(1.1) rotate(-10deg);
    opacity: 0.55;
  }
  80% {
    opacity: 0.25;
  }
  100% {
    transform: translate(16px, -75px) scale(1.6) rotate(15deg);
    opacity: 0;
  }
`;

const smokeWisp2 = keyframes`
  0% {
    transform: translate(0, 0) scale(0.7) rotate(0deg);
    opacity: 0;
  }
  25% {
    opacity: 0.7;
  }
  55% {
    transform: translate(15px, -40px) scale(1.2) rotate(12deg);
    opacity: 0.5;
  }
  85% {
    opacity: 0.2;
  }
  100% {
    transform: translate(-18px, -85px) scale(1.8) rotate(-15deg);
    opacity: 0;
  }
`;

const smokeWisp3 = keyframes`
  0% {
    transform: translate(0, 0) scale(0.5);
    opacity: 0;
  }
  30% {
    opacity: 0.85;
    transform: translate(-5px, -20px) scale(0.9);
  }
  70% {
    transform: translate(10px, -55px) scale(1.4);
    opacity: 0.4;
  }
  100% {
    transform: translate(-8px, -95px) scale(2);
    opacity: 0;
  }
`;

const ripple = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
`;

interface IncenseLoaderProps {
  message?: string;
  submessage?: string;
  fullscreen?: boolean;
}

export const IncenseLoader: React.FC<IncenseLoaderProps> = ({
  message = 'Crafting Fragrance Harmony...',
  submessage = 'MDP Aroma ERP • Precision Operations',
  fullscreen = false,
}) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        textAlign: 'center',
      }}
    >
      {/* Incense Burner and Smoke Animation Container */}
      <Box sx={{ position: 'relative', width: 140, height: 160, mb: 2 }}>
        {/* Fragrance Aroma Ripples */}
        <Box
          sx={{
            position: 'absolute',
            top: 50,
            left: 70,
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '2px solid rgba(139, 92, 246, 0.35)',
            transform: 'translate(-50%, -50%)',
            animation: `${ripple} 2.5s infinite cubic-bezier(0.2, 0.8, 0.2, 1)`,
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 50,
            left: 70,
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '2px solid rgba(245, 158, 11, 0.35)',
            transform: 'translate(-50%, -50%)',
            animation: `${ripple} 2.5s infinite 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)`,
            pointerEvents: 'none',
          }}
        />

        {/* Smoke Wisps rising from the tip */}
        <Box
          sx={{
            position: 'absolute',
            top: 45,
            left: 68,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(244, 114, 182, 0.25) 50%, rgba(255,255,255,0) 80%)',
            filter: 'blur(3px)',
            animation: `${smokeWisp1} 3.2s infinite ease-out`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 45,
            left: 70,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.45) 0%, rgba(99, 102, 241, 0.25) 50%, rgba(255,255,255,0) 80%)',
            filter: 'blur(4px)',
            animation: `${smokeWisp2} 3.6s infinite 1s ease-out`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 45,
            left: 69,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.5) 0%, rgba(239, 68, 68, 0.2) 60%, rgba(255,255,255,0) 85%)',
            filter: 'blur(3px)',
            animation: `${smokeWisp3} 2.8s infinite 0.5s ease-out`,
          }}
        />

        {/* Glowing Ember Tip */}
        <Box
          sx={{
            position: 'absolute',
            top: 48,
            left: 68,
            width: 6,
            height: 6,
            borderRadius: '50%',
            animation: `${emberGlow} 1.6s infinite ease-in-out`,
            zIndex: 4,
          }}
        />

        {/* Ash tip */}
        <Box
          sx={{
            position: 'absolute',
            top: 46,
            left: 67,
            width: 4,
            height: 3,
            backgroundColor: '#CBD5E1',
            borderRadius: '2px',
            transform: 'rotate(-25deg)',
            zIndex: 3,
          }}
        />

        {/* Incense Stick Shaft */}
        <Box
          sx={{
            position: 'absolute',
            top: 50,
            left: 69,
            width: 3.5,
            height: 68,
            background: 'linear-gradient(180deg, #451A03 0%, #78350F 55%, #B45309 85%, #D97706 100%)',
            borderRadius: '2px',
            transformOrigin: 'top center',
            transform: 'rotate(26deg)',
            boxShadow: '1px 2px 4px rgba(0,0,0,0.12)',
            zIndex: 2,
          }}
        />

        {/* Bamboo Core Base */}
        <Box
          sx={{
            position: 'absolute',
            top: 108,
            left: 42,
            width: 2.5,
            height: 22,
            backgroundColor: '#FDE68A',
            transform: 'rotate(26deg)',
            zIndex: 2,
          }}
        />

        {/* Dhoop Cone beside stick */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 22,
            right: 32,
            width: 0,
            height: 0,
            borderLeft: '11px solid transparent',
            borderRight: '11px solid transparent',
            borderBottom: '22px solid #573418',
            borderRadius: '2px',
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))',
            zIndex: 2,
          }}
        />
        {/* Dhoop glowing tip */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 42,
            right: 40,
            width: 4,
            height: 4,
            borderRadius: '50%',
            animation: `${emberGlow} 2s infinite 0.7s ease-in-out`,
            zIndex: 4,
          }}
        />

        {/* Ceramic Incense Plate / Holder */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 104,
            height: 16,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 50%, #E2E8F0 100%)',
            borderRadius: '20px',
            border: '1.5px solid #CBD5E1',
            boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255,255,255,0.8)',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Subtle gold inlay ring on holder */}
          <Box
            sx={{
              width: 84,
              height: 6,
              borderRadius: '10px',
              border: '1px solid rgba(217, 119, 6, 0.35)',
            }}
          />
        </Box>
      </Box>

      {/* Title & Brand */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 50%, #7C3AED 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
          fontSize: '1.1rem',
          mb: 0.5,
        }}
      >
        {message}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          color: '#64748B',
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontSize: '0.72rem',
        }}
      >
        {submessage}
      </Typography>
    </Box>
  );

  if (fullscreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(248, 250, 252, 0.94)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};
