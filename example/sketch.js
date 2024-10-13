let test_img;
let font;
function preload() {
  test_img = loadImage("test.png");
  font = loadFont("FFFFORWA.TTF");
}

let canvas;
let preprocessingBuffer;
let glow;
let animated_rainbow_gradient;
let black_to_white_gradient;
let rainbow_gradient;
function setup() {
  canvas = createCanvas(400, 400, WEBGL);
  noStroke();
  noSmooth();
  setAttributes({ alpha: true });
  
  _renderer.getTexture(test_img).setInterpolation(NEAREST, NEAREST);
  
  preprocessingBuffer = createFramebuffer();
  glow = new Glow();

  let gradient = [];
  let rainbow = [
    [255, 0, 0, 255], // RED
    [254, 138, 24, 255], // ORANGE
    [255, 255, 0, 255], // YELLOW
    [0, 255, 0, 255], // GREEN
    [0, 0, 255, 255], // BLUE
    [75, 0, 130, 255], // INDIGO
    [127, 0, 255, 255] // VIOLET
  ];
  for (const i in rainbow)
    gradient.push(rainbow.slice(i, rainbow.length).concat(rainbow.slice(0, i)));
  animated_rainbow_gradient = glow.push_gradient(gradient);
  black_to_white_gradient = glow.push_black_to_white_gradient();
  /* Which is used in place of
  glow.push_gradient([
    [[255, 255, 255, 255], [255, 255, 255, 0]],
  ]);
  */
  rainbow_gradient = glow.push_gradient([
    [
      [255, 0, 0, 255], // RED
      [254, 138, 24, 255], // ORANGE
      [255, 255, 0, 255], // YELLOW
      [0, 255, 0, 255], // GREEN
      [0, 0, 255, 255], // BLUE
      [75, 0, 130, 255], // INDIGO
      [127, 0, 255, 255] // VIOLET
    ],
  ]);
}

function draw() {
  // Draw all the normal canvas things you'd draw on a canvas for preprocessors to use
  preprocessingBuffer.begin();
  {
    clear();
    textFont(font);
    text(ceil(frameRate()), -width / 2 + 10, -height / 2 + 25);
    image(test_img, -100, -100, 200, 200);
    rect(40, 20, 100, 100);
  }
  preprocessingBuffer.end();
  
  // Draw all the background stuff you want behind the lights
  background(50);
  // Draw the light (choose which one you want)
  const LightTypes = {
    NormalWhite: 0,
    TrippyRainbow: 1
  };
  const lightType = LightTypes.NormalWhite;
  switch (lightType) {
    case LightTypes.NormalWhite:
      glow.queue_point_light(
        x = mouseX - width / 2,
        y = mouseY - height / 2,
        gradient = black_to_white_gradient,
        center_uv = [0.25, 0.5],
        edge_uv = [0.75, 0.5],
        radius = 100,
        preprocess_buf = preprocessingBuffer,
        slice_density = 2 ** 7,
        sample_length = 1
      );
      break;
    case LightTypes.TrippyRainbow:
      // Trippy Rainbow Light
      const sample_y = 1.0 - (millis() / 1000) % 1;
      glow.queue_point_light(
        x = mouseX - width / 2,
        y = mouseY - height / 2,
        gradient = animated_rainbow_gradient,
        center_uv = [0, sample_y],
        edge_uv = [1, sample_y],
        radius = 100,
        preprocess_buf = preprocessingBuffer,
        slice_density = 2 ** 7,
        sample_length = 1
      );
      break;
  }
  glow.filter(BLUR); // Blur everything so that disturbances from the lower resolution of light are less visible and for an antialiasing effect
  glow.render_flush(); // Render everything and clear the light buffer
  image(preprocessingBuffer, -width / 2, -height / 2, width, height); // Now draw the preprocessor buffer to the actual screen
}