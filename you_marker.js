import React from 'react';

export default function you_marker(props) {
  return (
    <svg width={22} height={22} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle r={1} transform="matrix(1 0 0 -1 11 11)" fill="white" />
      <circle cx={11} cy={11} r="8.5" stroke="white" />
      <circle cx={11} cy={11} r="10.5" stroke="white" />
    </svg>
  );
}
