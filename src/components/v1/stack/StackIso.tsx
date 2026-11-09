// r17 v1's Stack drawing (index.html, .stk-art > svg[data-iso]), verbatim: Lawrence's buildStack() output, run once. Four rings (data-tone, data-li 0 = the core),
// each a .stk-c (lifts) > .stk-b (builds in); the pillar covers are clipped per ring. css/stack.css colours the faces (.stk-t / .stk-l / .stk-r).
export function StackIso() {
  return (
    <svg className="stk-iso" viewBox="-328.9 -97.5 657.9 783.0" aria-hidden="true" focusable="false" data-iso="">
    <defs>
    <clipPath id="stack-cover-intents-0">
    <polygon points="-25.5,140.8 0.0,126.0 25.5,140.8 25.5,246.3 0.0,261.0 -25.5,246.3" />
    <polygon points="0.0,155.5 25.5,140.8 136.4,204.8 136.4,310.3 110.9,325.0 0.0,261.0" />
    <polygon points="-136.4,204.8 -25.5,140.8 0.0,155.5 0.0,261.0 -110.9,325.0 -136.4,310.3" />
    </clipPath>
    <clipPath id="stack-cover-ai-0">
    <polygon points="-25.5,47.7 0.0,32.9 25.5,47.7 25.5,153.2 0.0,167.9 -25.5,153.2" />
    <polygon points="0.0,62.4 25.5,47.7 83.7,81.2 83.7,186.7 58.1,201.4 0.0,167.9" />
    <polygon points="-214.5,156.8 -25.5,47.7 0.0,62.4 0.0,167.9 -189.0,277.0 -214.5,262.3" />
    </clipPath>
    <clipPath id="stack-cover-com-0">
    <polygon points="-25.5,-47.6 0.0,-62.3 25.5,-47.6 25.5,57.9 0.0,72.7 -25.5,57.9" />
    <polygon points="0.0,-32.8 25.5,-47.6 295.4,108.3 295.4,213.8 269.9,228.5 0.0,72.7" />
    <polygon points="-295.4,108.3 -25.5,-47.6 0.0,-32.8 0.0,72.7 -269.9,228.5 -295.4,213.8" />
    </clipPath>
    </defs>
    <g>
    <g className="stk-c" data-tone="protocol" data-li="0">
    <g className="stk-b">
    <g>
    <polygon className="stk-l" points="-58.0,644.0 0.0,677.5 0.0,33.5 -58.0,0.0" />
    <polygon className="stk-r" points="58.0,644.0 0.0,677.5 0.0,33.5 58.0,0.0" />
    <polygon className="stk-t" points="0.0,-33.5 58.0,0.0 0.0,33.5 -58.0,0.0" />
    </g>
    </g>
    </g>
    </g>
    <g>
    <g className="stk-c" data-tone="intents" data-li="1">
    <g className="stk-b">
    <g>
    <polygon className="stk-l" points="-25.5,230.3 0.0,245.0 0.0,215.5 -25.5,200.8" />
    <polygon className="stk-r" points="25.5,230.3 0.0,245.0 0.0,215.5 25.5,200.8" />
    <polygon className="stk-t" points="0.0,186.0 25.5,200.8 0.0,215.5 -25.5,200.8" />
    </g>
    <g>
    <polygon className="stk-l" points="0.0,245.0 110.9,309.0 110.9,279.5 0.0,215.5" />
    <polygon className="stk-r" points="136.4,294.3 110.9,309.0 110.9,279.5 136.4,264.8" />
    <polygon className="stk-t" points="25.5,200.8 136.4,264.8 110.9,279.5 0.0,215.5" />
    </g>
    <g>
    <polygon className="stk-l" points="-136.4,294.3 -110.9,309.0 -110.9,279.5 -136.4,264.8" />
    <polygon className="stk-r" points="0.0,245.0 -110.9,309.0 -110.9,279.5 0.0,215.5" />
    <polygon className="stk-t" points="-25.5,200.8 0.0,215.5 -110.9,279.5 -136.4,264.8" />
    </g>
    <g>
    <polygon className="stk-l" points="110.9,343.0 136.4,357.8 136.4,328.3 110.9,313.5" />
    <polygon className="stk-r" points="161.9,343.0 136.4,357.8 136.4,328.3 161.9,313.5" />
    <polygon className="stk-t" points="136.4,298.8 161.9,313.5 136.4,328.3 110.9,313.5" />
    </g>
    <g>
    <polygon className="stk-l" points="110.9,313.5 136.4,328.3 136.4,323.8 110.9,309.0" />
    <polygon className="stk-r" points="161.9,313.5 136.4,328.3 136.4,323.8 161.9,309.0" />
    <polygon className="stk-t" points="136.4,294.3 161.9,309.0 136.4,323.8 110.9,309.0" />
    </g>
    <g>
    <polygon className="stk-l" points="110.9,309.0 136.4,323.8 136.4,294.3 110.9,279.5" />
    <polygon className="stk-r" points="161.9,309.0 136.4,323.8 136.4,294.3 161.9,279.5" />
    <polygon className="stk-t" points="136.4,264.8 161.9,279.5 136.4,294.3 110.9,279.5" />
    </g>
    <g>
    <polygon className="stk-l" points="-161.9,343.0 -136.4,357.8 -136.4,328.3 -161.9,313.5" />
    <polygon className="stk-r" points="-110.9,343.0 -136.4,357.8 -136.4,328.3 -110.9,313.5" />
    <polygon className="stk-t" points="-136.4,298.8 -110.9,313.5 -136.4,328.3 -161.9,313.5" />
    </g>
    <g>
    <polygon className="stk-l" points="-161.9,313.5 -136.4,328.3 -136.4,323.8 -161.9,309.0" />
    <polygon className="stk-r" points="-110.9,313.5 -136.4,328.3 -136.4,323.8 -110.9,309.0" />
    <polygon className="stk-t" points="-136.4,294.3 -110.9,309.0 -136.4,323.8 -161.9,309.0" />
    </g>
    <g>
    <polygon className="stk-l" points="-161.9,309.0 -136.4,323.8 -136.4,294.3 -161.9,279.5" />
    <polygon className="stk-r" points="-110.9,309.0 -136.4,323.8 -136.4,294.3 -110.9,279.5" />
    <polygon className="stk-t" points="-136.4,264.8 -110.9,279.5 -136.4,294.3 -161.9,279.5" />
    </g>
    <g>
    <polygon className="stk-l" points="20.0,395.4 45.6,410.2 45.6,380.7 20.0,365.9" />
    <polygon className="stk-r" points="136.4,357.8 45.6,410.2 45.6,380.7 136.4,328.3" />
    <polygon className="stk-t" points="110.9,313.5 136.4,328.3 45.6,380.7 20.0,365.9" />
    </g>
    <g>
    <polygon className="stk-l" points="-136.4,357.8 -45.6,410.2 -45.6,380.7 -136.4,328.3" />
    <polygon className="stk-r" points="-20.0,395.4 -45.6,410.2 -45.6,380.7 -20.0,365.9" />
    <polygon className="stk-t" points="-110.9,313.5 -20.0,365.9 -45.6,380.7 -136.4,328.3" />
    </g>
    </g>
    </g>
    <g className="stk-c" data-tone="protocol" data-li="1">
    <g className="stk-cover" clipPath="url(#stack-cover-intents-0)">
    <polygon className="stk-l" points="-58.0,644.0 0.0,677.5 0.0,33.5 -58.0,0.0" />
    <polygon className="stk-r" points="58.0,644.0 0.0,677.5 0.0,33.5 58.0,0.0" />
    <polygon className="stk-t" points="0.0,-33.5 58.0,0.0 0.0,33.5 -58.0,0.0" />
    </g>
    </g>
    </g>
    <g>
    <g className="stk-c" data-tone="ai" data-li="2">
    <g className="stk-b">
    <g>
    <polygon className="stk-l" points="-25.5,137.2 0.0,151.9 0.0,122.4 -25.5,107.7" />
    <polygon className="stk-r" points="25.5,137.2 0.0,151.9 0.0,122.4 25.5,107.7" />
    <polygon className="stk-t" points="0.0,92.9 25.5,107.7 0.0,122.4 -25.5,107.7" />
    </g>
    <g>
    <polygon className="stk-l" points="0.0,151.9 58.1,185.4 58.1,155.9 0.0,122.4" />
    <polygon className="stk-r" points="83.7,170.7 58.1,185.4 58.1,155.9 83.7,141.2" />
    <polygon className="stk-t" points="25.5,107.7 83.7,141.2 58.1,155.9 0.0,122.4" />
    </g>
    <g>
    <polygon className="stk-l" points="97.9,208.4 189.0,261.0 189.0,231.5 97.9,178.9" />
    <polygon className="stk-r" points="214.5,246.3 189.0,261.0 189.0,231.5 214.5,216.8" />
    <polygon className="stk-t" points="123.5,164.2 214.5,216.8 189.0,231.5 97.9,178.9" />
    </g>
    <g>
    <polygon className="stk-l" points="-214.5,246.3 -189.0,261.0 -189.0,231.5 -214.5,216.8" />
    <polygon className="stk-r" points="0.0,151.9 -189.0,261.0 -189.0,231.5 0.0,122.4" />
    <polygon className="stk-t" points="-25.5,107.7 0.0,122.4 -189.0,231.5 -214.5,216.8" />
    </g>
    <g>
    <polygon className="stk-l" points="189.0,393.5 214.5,408.3 214.5,378.8 189.0,364.0" />
    <polygon className="stk-r" points="240.1,393.5 214.5,408.3 214.5,378.8 240.1,364.0" />
    <polygon className="stk-t" points="214.5,349.3 240.1,364.0 214.5,378.8 189.0,364.0" />
    </g>
    <g>
    <polygon className="stk-l" points="189.0,364.0 214.5,378.8 214.5,275.8 189.0,261.0" />
    <polygon className="stk-r" points="240.1,364.0 214.5,378.8 214.5,275.8 240.1,261.0" />
    <polygon className="stk-t" points="214.5,246.3 240.1,261.0 214.5,275.8 189.0,261.0" />
    </g>
    <g>
    <polygon className="stk-l" points="189.0,261.0 214.5,275.8 214.5,246.3 189.0,231.5" />
    <polygon className="stk-r" points="240.1,261.0 214.5,275.8 214.5,246.3 240.1,231.5" />
    <polygon className="stk-t" points="214.5,216.8 240.1,231.5 214.5,246.3 189.0,231.5" />
    </g>
    <g>
    <polygon className="stk-l" points="-240.1,393.5 -214.5,408.3 -214.5,378.8 -240.1,364.0" />
    <polygon className="stk-r" points="-189.0,393.5 -214.5,408.3 -214.5,378.8 -189.0,364.0" />
    <polygon className="stk-t" points="-214.5,349.3 -189.0,364.0 -214.5,378.8 -240.1,364.0" />
    </g>
    <g>
    <polygon className="stk-l" points="130.0,427.6 155.5,442.3 155.5,412.8 130.0,398.1" />
    <polygon className="stk-r" points="214.5,408.3 155.5,442.3 155.5,412.8 214.5,378.8" />
    <polygon className="stk-t" points="189.0,364.0 214.5,378.8 155.5,412.8 130.0,398.1" />
    </g>
    <g>
    <polygon className="stk-l" points="0.0,502.6 25.5,517.4 25.5,487.9 0.0,473.1" />
    <polygon className="stk-r" points="114.8,465.8 25.5,517.4 25.5,487.9 114.8,436.3" />
    <polygon className="stk-t" points="89.3,421.6 114.8,436.3 25.5,487.9 0.0,473.1" />
    </g>
    <g>
    <polygon className="stk-l" points="-214.5,408.3 -25.5,517.4 -25.5,487.9 -214.5,378.8" />
    <polygon className="stk-r" points="0.0,502.6 -25.5,517.4 -25.5,487.9 0.0,473.1" />
    <polygon className="stk-t" points="-189.0,364.0 0.0,473.1 -25.5,487.9 -214.5,378.8" />
    </g>
    <g>
    <polygon className="stk-l" points="-25.5,517.4 0.0,532.1 0.0,502.6 -25.5,487.9" />
    <polygon className="stk-r" points="25.5,517.4 0.0,532.1 0.0,502.6 25.5,487.9" />
    <polygon className="stk-t" points="0.0,473.1 25.5,487.9 0.0,502.6 -25.5,487.9" />
    </g>
    <g>
    <polygon className="stk-l" points="-240.1,364.0 -214.5,378.8 -214.5,352.8 -240.1,338.0" />
    <polygon className="stk-r" points="-189.0,364.0 -214.5,378.8 -214.5,352.8 -189.0,338.0" />
    <polygon className="stk-t" points="-214.5,323.3 -189.0,338.0 -214.5,352.8 -240.1,338.0" />
    </g>
    <g>
    <polygon className="stk-l" points="-240.1,291.5 -214.5,306.3 -214.5,275.8 -240.1,261.0" />
    <polygon className="stk-r" points="-189.0,291.5 -214.5,306.3 -214.5,275.8 -189.0,261.0" />
    <polygon className="stk-t" points="-214.5,246.3 -189.0,261.0 -214.5,275.8 -240.1,261.0" />
    </g>
    <g>
    <polygon className="stk-l" points="-240.1,261.0 -214.5,275.8 -214.5,246.3 -240.1,231.5" />
    <polygon className="stk-r" points="-189.0,261.0 -214.5,275.8 -214.5,246.3 -189.0,231.5" />
    <polygon className="stk-t" points="-214.5,216.8 -189.0,231.5 -214.5,246.3 -240.1,231.5" />
    </g>
    </g>
    </g>
    <g className="stk-c" data-tone="protocol" data-li="2">
    <g className="stk-cover" clipPath="url(#stack-cover-ai-0)">
    <polygon className="stk-l" points="-58.0,644.0 0.0,677.5 0.0,33.5 -58.0,0.0" />
    <polygon className="stk-r" points="58.0,644.0 0.0,677.5 0.0,33.5 58.0,0.0" />
    <polygon className="stk-t" points="0.0,-33.5 58.0,0.0 0.0,33.5 -58.0,0.0" />
    </g>
    </g>
    </g>
    <g>
    <g className="stk-c" data-tone="com" data-li="3">
    <g className="stk-b">
    <g>
    <polygon className="stk-l" points="-25.5,41.9 0.0,56.7 0.0,27.2 -25.5,12.4" />
    <polygon className="stk-r" points="25.5,41.9 0.0,56.7 0.0,27.2 25.5,12.4" />
    <polygon className="stk-t" points="0.0,-2.3 25.5,12.4 0.0,27.2 -25.5,12.4" />
    </g>
    <g>
    <polygon className="stk-l" points="0.0,56.7 269.9,212.5 269.9,183.0 0.0,27.2" />
    <polygon className="stk-r" points="295.4,197.8 269.9,212.5 269.9,183.0 295.4,168.3" />
    <polygon className="stk-t" points="25.5,12.4 295.4,168.3 269.9,183.0 0.0,27.2" />
    </g>
    <g>
    <polygon className="stk-l" points="-295.4,197.8 -269.9,212.5 -269.9,183.0 -295.4,168.3" />
    <polygon className="stk-r" points="0.0,56.7 -269.9,212.5 -269.9,183.0 0.0,27.2" />
    <polygon className="stk-t" points="-25.5,12.4 0.0,27.2 -269.9,183.0 -295.4,168.3" />
    </g>
    <g>
    <polygon className="stk-l" points="269.9,442.0 295.4,456.8 295.4,427.3 269.9,412.5" />
    <polygon className="stk-r" points="320.9,442.0 295.4,456.8 295.4,427.3 320.9,412.5" />
    <polygon className="stk-t" points="295.4,397.8 320.9,412.5 295.4,427.3 269.9,412.5" />
    </g>
    <g>
    <polygon className="stk-l" points="269.9,412.5 295.4,427.3 295.4,227.3 269.9,212.5" />
    <polygon className="stk-r" points="320.9,412.5 295.4,427.3 295.4,227.3 320.9,212.5" />
    <polygon className="stk-t" points="295.4,197.8 320.9,212.5 295.4,227.3 269.9,212.5" />
    </g>
    <g>
    <polygon className="stk-l" points="269.9,212.5 295.4,227.3 295.4,197.8 269.9,183.0" />
    <polygon className="stk-r" points="320.9,212.5 295.4,227.3 295.4,197.8 320.9,183.0" />
    <polygon className="stk-t" points="295.4,168.3 320.9,183.0 295.4,197.8 269.9,183.0" />
    </g>
    <g>
    <polygon className="stk-l" points="-320.9,442.0 -295.4,456.8 -295.4,427.3 -320.9,412.5" />
    <polygon className="stk-r" points="-269.9,442.0 -295.4,456.8 -295.4,427.3 -269.9,412.5" />
    <polygon className="stk-t" points="-295.4,397.8 -269.9,412.5 -295.4,427.3 -320.9,412.5" />
    </g>
    <g>
    <polygon className="stk-l" points="0.0,597.8 25.5,612.5 25.5,583.0 0.0,568.3" />
    <polygon className="stk-r" points="295.4,456.8 25.5,612.5 25.5,583.0 295.4,427.3" />
    <polygon className="stk-t" points="269.9,412.5 295.4,427.3 25.5,583.0 0.0,568.3" />
    </g>
    <g>
    <polygon className="stk-l" points="-295.4,456.8 -234.5,491.9 -234.5,462.4 -295.4,427.3" />
    <polygon className="stk-r" points="-209.0,477.1 -234.5,491.9 -234.5,462.4 -209.0,447.6" />
    <polygon className="stk-t" points="-269.9,412.5 -209.0,447.6 -234.5,462.4 -295.4,427.3" />
    </g>
    <g>
    <polygon className="stk-l" points="-195.1,514.6 -25.5,612.5 -25.5,583.0 -195.1,485.1" />
    <polygon className="stk-r" points="0.0,597.8 -25.5,612.5 -25.5,583.0 0.0,568.3" />
    <polygon className="stk-t" points="-169.6,470.4 0.0,568.3 -25.5,583.0 -195.1,485.1" />
    </g>
    <g>
    <polygon className="stk-l" points="-25.5,612.5 0.0,627.3 0.0,597.8 -25.5,583.0" />
    <polygon className="stk-r" points="25.5,612.5 0.0,627.3 0.0,597.8 25.5,583.0" />
    <polygon className="stk-t" points="0.0,568.3 25.5,583.0 0.0,597.8 -25.5,583.0" />
    </g>
    <g>
    <polygon className="stk-l" points="-320.9,412.5 -295.4,427.3 -295.4,227.3 -320.9,212.5" />
    <polygon className="stk-r" points="-269.9,412.5 -295.4,427.3 -295.4,227.3 -269.9,212.5" />
    <polygon className="stk-t" points="-295.4,197.8 -269.9,212.5 -295.4,227.3 -320.9,212.5" />
    </g>
    <g>
    <polygon className="stk-l" points="-320.9,212.5 -295.4,227.3 -295.4,197.8 -320.9,183.0" />
    <polygon className="stk-r" points="-269.9,212.5 -295.4,227.3 -295.4,197.8 -269.9,183.0" />
    <polygon className="stk-t" points="-295.4,168.3 -269.9,183.0 -295.4,197.8 -320.9,183.0" />
    </g>
    </g>
    </g>
    <g className="stk-c" data-tone="protocol" data-li="3">
    <g className="stk-cover" clipPath="url(#stack-cover-com-0)">
    <polygon className="stk-l" points="-58.0,644.0 0.0,677.5 0.0,33.5 -58.0,0.0" />
    <polygon className="stk-r" points="58.0,644.0 0.0,677.5 0.0,33.5 58.0,0.0" />
    <polygon className="stk-t" points="0.0,-33.5 58.0,0.0 0.0,33.5 -58.0,0.0" />
    </g>
    </g>
    </g>
    <g className="stk-c" data-tone="protocol" data-li="0">
    <g className="stk-b">
    <image href="/v1/stack/stack-icon.svg" width="1" height="1" transform="matrix(47.631,27.500,-47.631,27.500,0.00,-27.50)" preserveAspectRatio="xMidYMid meet" />
    </g>
    </g>
    </svg>
  );
}
