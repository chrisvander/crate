import { useEffect, useState } from "preact/hooks"
import backdrop from "../assets/color-gradient-backdrop.svg?url"

export function HeroBackdrop() {
  const [values, setValues] = useState([1, 1, 1, 1])
  const [opacity, setOpacity] = useState(0)
  const [x, y, dx, dy] = values.map((value) => value * opacity)
  useEffect(() => {
    const interval = setInterval(() => setValues((values) => values.map(() => Math.random())), 6000)
    setOpacity(1)
    return () => clearInterval(interval)
  }, [])
  return (
    <img
      className="hero-artwork"
      src={backdrop}
      alt=""
      style={{
        opacity,
        transform: `scale(${x * 3 + 2}, ${y * 3 + 2}) translate(${(dx - 0.5) * 50}%, ${(dy - 0.5) * 50}%)`,
      }}
    />
  )
}
