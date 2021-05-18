import React from 'react';

export function Chevron(props) {
  return (
    <svg className={props.className} height='100%' width='100%' viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4.5 7L1 3L8 3L4.5 7Z" fill="white" />
    </svg>
  );
}
