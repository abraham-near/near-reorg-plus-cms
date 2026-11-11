// The revenue band's figures: a snapshot of the client's revenue dashboard (their screenshot, Nov 2026), not live. [[TBD: live data]] wire to the dashboard's feed.
// Monthly net revenue in $K, read off their chart's bars (oldest first); the chart scales them so they add up to TOTAL (its cumulative line ends there).
export const REV = {
  total: 11.61,        // $M, all time
  capture: 37,         // % of total fees captured as net revenue
  net30: 2.02,         // $M, last 30 days
  fees30: 5.46,        // $M, last 30 days
  monthly: [284, 658, 284, 523, 419, 374, 389, 807, 942, 643, 867, 2210, 2510, 568],
  axisL: [725, 1400, 2200, 2900],          // the bars' scale, $K (top = the last tick)
  axisR: [3, 6, 9, 12],                    // the cumulative line's scale, $M (top = the last tick)
  href: "/economics",  // [[TBD: the dashboard's URL]] the doc names the button, not its link
};

export const fmtK = (k: number) => (k >= 1000 ? `$${(k / 1000).toFixed(1)}M` : `$${Math.round(k)}K`);
