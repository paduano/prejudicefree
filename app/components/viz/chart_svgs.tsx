export function Chart1(props) {
    return (
        <svg width={800} height={600} viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <g id="chart1">
                <text id="Against abortion" fill="white" xmlSpace="preserve" style={{ whiteSpace: 'pre' }} fontFamily="Roboto" fontSize={10} letterSpacing="0em">
                    <tspan x="38.5225" y="262.418">Against </tspan>
                    <tspan x="36.8428" y="274.418">abortion</tspan>
                </text>
                <text id="Supporting abortion" fill="white" xmlSpace="preserve" style={{ whiteSpace: 'pre' }} fontFamily="Roboto" fontSize={10} letterSpacing="0em">
                    <tspan x="694.071" y="262.418">
                        Supporting
                  </tspan>
                    <tspan x="699.843" y="274.418">abortion</tspan>
                </text>
                <text id="Not religious people" fill="white" xmlSpace="preserve" style={{ whiteSpace: 'pre' }} fontFamily="Roboto" fontSize={10} letterSpacing="0em">
                    <tspan x="343.542" y="85.418">Not religious people</tspan>
                </text>
                <path id="Vector 6" d="M56 304H719" stroke="white" />
                <path id="Vector 7" d="M60 308.5L56 304L60 299.5" stroke="white" />
                <path id="Vector 8" d="M715 308.5L719 304L715 299.5" stroke="white" />
            </g>
        </svg>
    );
}

export function Chart2(props) {
    return (
        <svg width={800} height={600} viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <g clipPath="url(#clip0)">
          <path fillRule="evenodd" clipRule="evenodd" d="M532.114 601C535.942 588.339 538 574.91 538 561C538 484.785 476.215 423 400 423C323.785 423 262 484.785 262 561C262 574.91 264.058 588.339 267.886 601H268.932C265.075 588.346 263 574.915 263 561C263 485.337 324.337 424 400 424C475.663 424 537 485.337 537 561C537 574.915 534.925 588.346 531.068 601H532.114Z" fill="#C4C4C4" />
          <path fillRule="evenodd" clipRule="evenodd" d="M532.259 600.518C535.994 587.998 538 574.733 538 561C538 484.785 476.215 423 400 423C323.785 423 262 484.785 262 561C262 574.733 264.006 587.998 267.741 600.518H276.115C272.143 588.056 270 574.778 270 561C270 489.203 328.203 431 400 431C471.797 431 530 489.203 530 561C530 574.778 527.857 588.056 523.885 600.518H532.259Z" fill="#C4C4C4" fillOpacity="0.22" />
          <mask id="mask0" mask-type="alpha" maskUnits="userSpaceOnUse" x={123} y={284} width={553} height={553}>
            <path d="M672 560.5C672 710.998 549.998 833 399.5 833C249.002 833 127 710.998 127 560.5C127 410.002 249.002 288 399.5 288C549.998 288 672 410.002 672 560.5Z" stroke="white" strokeOpacity="0.3" strokeWidth={8} />
            <path d="M675.5 560.5C675.5 712.931 551.931 836.5 399.5 836.5C247.069 836.5 123.5 712.931 123.5 560.5C123.5 408.069 247.069 284.5 399.5 284.5C551.931 284.5 675.5 408.069 675.5 560.5Z" stroke="white" />
          </mask>
          <g mask="url(#mask0)">
            <rect width="938.392" height="318.246" transform="matrix(1 0 0 -1 8 602)" fill="#C4C4C4" />
          </g>
        </g>
        <defs>
          <clipPath id="clip0">
            <rect width={800} height={600} fill="white" />
          </clipPath>
        </defs>
      </svg>
    );
  }

  export function Circles(props) {
    return (
      <svg width={800} height={600} viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle id={props.idCircle1} cx={400} cy={300} r={props.r2} stroke="white" />
        <circle id={props.idCircle2} cx={400} cy={300} r={props.r1} stroke="white" />
      </svg>
    );
 }