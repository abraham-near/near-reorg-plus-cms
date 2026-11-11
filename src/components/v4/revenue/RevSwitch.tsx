// The switch between the revenue band's options (bottom left on /home-v4): plain links to /home-v4/a…d, each loads the page fresh.
import { REV_KEYS, REV_NAMES, type RevKey } from "./variants";
import "./switch.css";

export function RevSwitch({ on }: { on: RevKey }) {
  return (
    <nav className="rv-sw" aria-label="Revenue section options">
      <span className="rv-sw__l">Revenue</span>
      {REV_KEYS.map((k) => (
        <a key={k} className="rv-sw__a" href={`/home-v4/${k}#revenue`} aria-current={k === on ? "true" : undefined} title={REV_NAMES[k]}>{k.toUpperCase()}</a>
      ))}
    </nav>
  );
}
