class Glow {
  constructor(rdr = window, canvas = _renderer) {
    this.rdr = rdr;
    this.canvas = canvas;
    if (Glow.shader == null)
      Glow.shader =
        this.rdr.createShader(Glow.shader_vert, Glow.shader_frag);
    this.light_buf = this.rdr.createFramebuffer();
    this.gradients = [];
  }
  
  push_gradient(gradient) {
    const img = this.rdr.createImage(gradient[0].length, gradient.length);
    img.loadPixels();
    {
      for (const i in gradient) {
        const moment_gradient = gradient[i];
        for (const j in moment_gradient)
          img.set(j, i, moment_gradient[j]);
      }
    }
    img.updatePixels();
    return this.gradients.push(img) - 1;
  }
  
  pop_gradient(gradient_id) {
    this.gradients.pop(gradient_id);
  }
  
  queue_point_light(x, y, gradient, center_uv, edge_uv, radius, preprocess_buf, slice_density, sample_length, internal = false, angle_range = [0.0, 2 * Math.PI], threshold = 1) {
    this.light_buf.begin();
    {
      this.rdr.shader(Glow.shader);
      Glow.shader.setUniform("gradient", this.gradients[gradient]);
      Glow.shader.setUniform("centerUV", center_uv);
      Glow.shader.setUniform("radius", radius);
      Glow.shader.setUniform("preprocessTex", preprocess_buf);
      Glow.shader.setUniform("sliceDensity", slice_density);
      Glow.shader.setUniform("sampleLength", sample_length);
      Glow.shader.setUniform("screenDims", [this.canvas.width, this.canvas.height]);
      Glow.shader.setUniform("internal", internal);
      Glow.shader.setUniform("angleOff", angle_range[0]);
      Glow.shader.setUniform("threshold", threshold);
      {
        const num_slices = floor(slice_density * (angle_range[1] - angle_range[0]) / (2 * Math.PI)) + 1;
        this.rdr.beginShape(TRIANGLE_FAN);
        {
          this.rdr.vertex(x, y, 0, center_uv[0], center_uv[1]);
          for (let i = 0; i < num_slices; i++)
            this.rdr.vertex(x, y, 0, edge_uv[0], edge_uv[1]);
        }
        this.rdr.endShape(CLOSE);
      }
      this.rdr.resetShader();
    }
    this.light_buf.end();
  }
  
  filter() {
    this.light_buf.begin();
    this.rdr.filter(...arguments);
    this.light_buf.end();
  }
  
  render() {
    this.rdr.image(this.light_buf, -this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);
  }
  
  flush() {
    this.light_buf.begin();
    this.rdr.clear();
    this.light_buf.end();
  }
  
  render_flush() {
    this.render();
    this.flush();
  }

  debug_view_gradient(gradient_id, uvs, uvs_disp_color = [255, 0, 0, 255], background_color = [0, 0, 0, 255]) {
    if (background_color == null)
      this.rdr.clear();
    else
      this.rdr.background(background_color);

    this.rdr.image(this.gradients[gradient_id], -this.canvas.width / 2, -this.canvas.height / 2, this.canvas.width, this.canvas.height);

    push();
    {
      stroke(uvs_disp_color);
      for (const uv of uvs) {
        const uv00 = (uv[0][0] - 0.5) * this.canvas.width;
        const uv01 = (uv[0][1] - 0.5) * this.canvas.height;
        const uv10 = (uv[1][0] - 0.5) * this.canvas.width;
        const uv11 = (uv[1][1] - 0.5) * this.canvas.height;
        point(uv00, uv01);
        point(uv10, uv11);
        line(uv00, uv01, uv10, uv11);
      }
    }
    pop();
  }
}

// volumetric lights & lights of different shapes

Glow.shader_vert =
`#version 300 es

precision mediump float;

#define PI 3.1415926535897932384626433832795

in vec3 aPosition;
in vec2 aTexCoord;

out vec2 vTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

uniform vec2 centerUV;
uniform sampler2D preprocessTex;
uniform float radius;
uniform float sampleLength;
uniform int sliceDensity;
uniform ivec2 screenDims;
uniform bool internal;
uniform float angleOff;
uniform float threshold;

void main() {
  if (gl_VertexID == 0) {
    vTexCoord = aTexCoord;
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
    return;
  }
  
  float angle = angleOff + 2.0 * PI * float(gl_VertexID) / float(sliceDensity);
  vec2 vec = radius * vec2(cos(angle), sin(angle));
  
  float numSamples = radius / sampleLength;
  vec2 vpDist = vec / (numSamples * vec2(screenDims));

  vec2 cursor = 0.5 + aPosition.xy / vec2(screenDims);
  float i = 0.0;
  if (internal) {
    for (; i < numSamples; i += 1.0) {
      if (texture(preprocessTex, cursor).a < threshold)
        break;
      cursor += vpDist;
    }
  }
  for (; i < numSamples; i += 1.0) {
    if (texture(preprocessTex, cursor).a >= threshold)
      break;
    cursor += vpDist;
  }

  vTexCoord = centerUV + (i / numSamples) * (aTexCoord - centerUV);
  vec4 positionVec4 = vec4(vec2(screenDims) * (cursor - 0.5), 0.0, 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
}`;
Glow.shader_frag =
`#version 300 es
precision mediump float;
    
in vec2 vTexCoord;

out vec4 fragColor;    

uniform sampler2D gradient;

void main() {
  vec4 color = texture(gradient, vTexCoord);
  fragColor = color * color.a;
}
`;
Glow.shader = null;