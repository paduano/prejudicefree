import React from 'react';

export function SelectionMarker(props) {
  return (
    <svg width={19} height={11} viewBox="0 0 19 11" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M9.5 10L1 1H18L9.5 10Z" fill="white" stroke="white" stroke-linejoin="round" />
    </svg>
  );
}
