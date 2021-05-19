import React from 'react';

export function Plus(props) {
  return (
    <svg width={46} height={46} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M1 22L23 3L45 22" stroke="white" strokeLinejoin="round" />
      <line x1={23} y1={22} x2={23} y2={35} stroke="white" />
      <line x1="29.5" y1="28.5" x2="16.5" y2="28.5" stroke="white" />
    </svg>
  );
}
