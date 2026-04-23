import React, { memo } from 'react';
import nebulaBg from '../../assets/bg.png';

const CosmicBackground = memo(() => {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-black">
      {/* High-Resolution Nebula Image */}
      <img 
        src={nebulaBg} 
        alt="Cosmic Background" 
        className="absolute inset-0 w-full h-full object-cover scale-105 opacity-80"
      />
      
      {/* Overlay Gradients for Depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b0d11]/40 via-transparent to-[#0b0d11]/40 mix-blend-multiply"></div>
      
      {/* Dynamic Orbs (Extra Subtle) */}
      <div className="cosmic-orb w-[800px] h-[800px] bg-purple-600 -top-40 -left-60 animate-float opacity-[0.05]"></div>
      <div className="cosmic-orb w-[600px] h-[600px] bg-blue-600 -bottom-40 -right-40 animate-pulse opacity-[0.05]" style={{ animationDuration: '20s' }}></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]"></div>
    </div>
  );
});

export default CosmicBackground;

