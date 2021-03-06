import React from 'react';

export default function Circles(props) {
  return (
    <svg width={800} height={600} viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx={400} cy={300} r="220.5" stroke="white" />
      <circle cx={400} cy={300} r="119.5" stroke="white" />
    </svg>
  );
}
