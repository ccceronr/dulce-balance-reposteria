interface LogoMarcaProps {
  className?: string
}

// Logo de la barra superior: el chocolate de palito del ícono de la app dentro de un círculo.
function LogoMarca({ className }: LogoMarcaProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="brand-mark-circle" cx="50" cy="50" r="48" strokeWidth="2.5" />
      <g
        stroke="#704a35"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        transform="translate(50 50) scale(0.54) translate(-119 -66)"
      >
        <path d="m111 70 4 56" fill="none" stroke="#a87453" strokeWidth="7" />
        <path
          d="M93 18c7-8 17-12 27-11 13 1 22 10 28 23 8 17 9 39 8 54-1 8-5 13-12 16-16 6-41 5-57-2-7-3-10-8-10-16 0-23 3-49 16-64Z"
          fill="#edc8a9"
        />
        <path
          d="M90 34c8-12 19-19 31-18m-36 43c7 1 15-1 20-7 8-8 12-22 18-31m-34 57c9 2 18-1 24-8 9-10 12-24 20-35m-42 57c11 2 21-1 28-8 7-7 12-16 17-26"
          fill="none"
          stroke="#80533b"
          strokeWidth="4"
        />
      </g>
    </svg>
  )
}

export default LogoMarca
