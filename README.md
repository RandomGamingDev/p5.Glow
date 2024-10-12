# p5.Glow

A 2d pixel-perfect based efficient polygon lighting library for p5.js that supports a variety of features 

![image](https://github.com/user-attachments/assets/6a9fb64e-c953-4544-aabc-8baee48b5ac0)<br/>
Temporary placeholder image of demo in place of logo or more refined and visually appealing demo.

## The Library's features
- Control over gradient via a texture, including efficient animated gradients via changing the UVs mapping to the texture
- Control over the triangle count of the light's polygon and its sample length from the preprocessing texture
- Preprocessing buffer for postprocessing of the lights
- Buffered rendering
- Rendering from within an object with `internal` enabled
- Angled lights
- Control over light block threshold
- Point lights (lights coming from a flat plane and other geometries will get support added soon)

All of which allow for amazing effects, including flickering, cycling gradients, and even more complex ones like windows that only allow certain colors! <br/>
The library is also incredibly performant since all calculations are done on the GPU's side and optimized for its parallel architecture. Not only that, but it'll be optimized even further by utilizing instancing in the future :D

## Example
There's an example for how to use the library in https://github.com/RandomGamingDev/p5.Glow/tree/main/example with its result visible [here](https://randomgamingdev.github.io/p5.Glow/example/)

## How to import
To use it you can simply include https://cdn.jsdelivr.net/gh/RandomGamingDev/p5.Glow/glow.js in your HTML file! If you want to you can also just download the file and include it in your HTML file that way.

btw stuff updates so remember to specify a version/commit for your library if you want to use a link and don't want your code to automatically update to the newest version of the library
