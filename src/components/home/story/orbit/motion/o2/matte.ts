"use client";

// The film's matte (D72, option 2). The renders are films on pure white, made to be laid over the page with
// mix-blend-mode: multiply. A blend can't reach the page here: the rail's world and slots are stacking contexts (a
// transform, will-change), which isolate it, so a multiplied white film would show as a white box. So the white is
// taken out on the GPU instead: each frame is drawn premultiplied as (c − m, 1 − m), m the frame's darkest channel,
// which over any ground gives c − m + m·ground: exactly multiply for the neutral glass and chrome, and the green kept
// whole. A soft white point (W) drops the render's near-white haze to clear. The posters are the same sum, worked
// offline (assets/generated/2026-11-05_rail-motion/o2/export.py), so the still and the film match.
const VERT = `attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;uv.y=1.-uv.y;gl_Position=vec4(p,0.,1.);}`;
const FRAG = `precision mediump float;varying vec2 uv;uniform sampler2D t;
void main(){vec3 c=min(texture2D(t,uv).rgb/0.965,1.);float m=min(min(c.r,c.g),c.b);gl_FragColor=vec4(c-m,1.-m);}`;

export type Matte = { draw: () => boolean; dispose: () => void };

export function matte(canvas: HTMLCanvasElement, video: HTMLVideoElement): Matte | null {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return {
    // Draws the video's current frame; false until it has one
    draw() {
      if (video.readyState < 2 || !video.videoWidth) return false;
      if (canvas.width !== video.videoWidth) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return true;
    },
    dispose() {
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
