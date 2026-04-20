import React from 'react';
import './TypingDots.css';

export default function TypingDots({ size = 6, color = '#cbd5e1', interval = 1500 }) {
  const dotStyle = {
    width: size,
    height: size,
    backgroundColor: color,
    borderRadius: '50%',
    margin: '0 2px',
    animation: `pulse ${interval}ms infinite`
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ ...dotStyle, animationDelay: '0ms' }} />
      <div style={{ ...dotStyle, animationDelay: `${interval / 3}ms` }} />
      <div style={{ ...dotStyle, animationDelay: `${(2 * interval) / 3}ms` }} />
    </div>
  );
}
