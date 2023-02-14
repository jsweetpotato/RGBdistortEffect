// import * as THREE from "three";
// import images from "./images.js";
// import vertex from "./shaders/vertex.glsl";
// import fragment from "./shaders/fragment.glsl";
// import imageOne from "../images/1.jpg";
// import imageTwo from "../images/2.jpg";
// import imageThree from "../images/3.jpg";
// import imageFour from "../images/4.jpg";

const vertex = `
uniform sampler2D uTexture;
uniform vec2 uOffset;
varying vec2 vUv;

float M_PI = 3.141529;

vec3 deformationCurve(vec3 position, vec2 uv, vec2 offset){
  position.x = position.x + (sin(uv.y * M_PI) * offset.x);
  position.y = position.y + (sin(uv.x * M_PI) * offset.y);
  return position;
}

void main(){
  vUv = uv;
  vec3 newPosition = deformationCurve(position, uv, uOffset);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

const fragment = `
uniform sampler2D uTexture;
uniform float uAlpha;
uniform vec2 uOffset;
varying vec2 vUv;
vec4 mod289(vec4 x) {
return x - floor(x * (1.0 / 289.0)) * 289.0;
}

float mod289(float x) {
return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
return mod289(((x*34.0)+1.0)*x);
}

float permute(float x) {
return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
return 1.79284291400159 - 0.85373472095314 * r;
}

float taylorInvSqrt(float r)
{
return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip)
{
const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
vec4 p,s;

p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
s = vec4(lessThan(p, vec4(0.0)));
p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;

return p;
}

// (sqrt(5) - 1)/4 = F4, used once below
#define F4 0.309016994374947451

float snoise(vec4 v)
{
const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4
0.276393202250021,  // 2 * G4
0.414589803375032,  // 3 * G4
-0.447213595499958); // -1 + 4 * G4

// First corner
vec4 i  = floor(v + dot(v, vec4(F4)) );
vec4 x0 = v -   i + dot(i, C.xxxx);

// Other corners

// Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
vec4 i0;
vec3 isX = step( x0.yzw, x0.xxx );
vec3 isYZ = step( x0.zww, x0.yyz );
//  i0.x = dot( isX, vec3( 1.0 ) );
i0.x = isX.x + isX.y + isX.z;
i0.yzw = 1.0 - isX;
//  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
i0.y += isYZ.x + isYZ.y;
i0.zw += 1.0 - isYZ.xy;
i0.z += isYZ.z;
i0.w += 1.0 - isYZ.z;

// i0 now contains the unique values 0,1,2,3 in each channel
vec4 i3 = clamp( i0, 0.0, 1.0 );
vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

//  x0 = x0 - 0.0 + 0.0 * C.xxxx
//  x1 = x0 - i1  + 1.0 * C.xxxx
//  x2 = x0 - i2  + 2.0 * C.xxxx
//  x3 = x0 - i3  + 3.0 * C.xxxx
//  x4 = x0 - 1.0 + 4.0 * C.xxxx
vec4 x1 = x0 - i1 + C.xxxx;
vec4 x2 = x0 - i2 + C.yyyy;
vec4 x3 = x0 - i3 + C.zzzz;
vec4 x4 = x0 + C.wwww;

// Permutations
i = mod289(i);
float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
vec4 j1 = permute( permute( permute( permute (
i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
+ i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
+ i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
+ i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));

// Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope
// 7*7*6 = 294, which is close to the ring size 17*17 = 289.
vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

vec4 p0 = grad4(j0,   ip);
vec4 p1 = grad4(j1.x, ip);
vec4 p2 = grad4(j1.y, ip);
vec4 p3 = grad4(j1.z, ip);
vec4 p4 = grad4(j1.w, ip);

// Normalise gradients
vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
p0 *= norm.x;
p1 *= norm.y;
p2 *= norm.z;
p3 *= norm.w;
p4 *= taylorInvSqrt(dot(p4,p4));

// Mix contributions from the five corners
vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
m0 = m0 * m0;
m1 = m1 * m1;
return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
+ dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;

}

vec3 rgbShift(sampler2D textureimage, vec2 uv, vec2 offset ){
    float r = texture2D(textureimage, uv + offset).r;
    vec2 gb = texture2D(textureimage, uv).gb;
    return vec3(r, gb);
}

void main(){
    vec3 color = texture2D(uTexture, vUv).rgb;
    color = rgbShift(uTexture, vUv, uOffset);
    float noisy = snoise(vec4(vUv*5.0, 1.0, uAlpha));
    gl_FragColor = vec4(color, uAlpha);
    // gl_FragColor = vec4(noisy);
}
`;

function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

const imgs = document.querySelectorAll("img");

let targetX = 0;
let targetY = 0;

const textureOne = new THREE.TextureLoader().load(imgs[0].src);
const textureTwo = new THREE.TextureLoader().load(imgs[1].src);
const textureThree = new THREE.TextureLoader().load(imgs[2].src);
const textureFour = new THREE.TextureLoader().load(imgs[3].src);

class WebGL {
  constructor() {
    this.container = document.querySelector("main");
    this.links = [...document.querySelectorAll("li")];
    this.scene = new THREE.Scene();
    this.perspective = 1000;
    this.sizes = new THREE.Vector2(0, 0);
    this.offset = new THREE.Vector2(0, 0); // Positions of mesh on screen. Will be updated below.
    this.uniforms = {
      uTexture: { value: new THREE.TextureLoader().load(textureThree) },
      uAlpha: { value: 0.0 },
      uOffset: { value: new THREE.Vector2(0.0, 0.0) },
    };
    this.links.forEach((link, idx) => {
      link.addEventListener("mouseenter", () => {
        switch (idx) {
          case 0:
            this.uniforms.uTexture.value = textureOne;
            break;
          case 1:
            this.uniforms.uTexture.value = textureTwo;
            break;
          case 2:
            this.uniforms.uTexture.value = textureThree;
            break;
          case 3:
            this.uniforms.uTexture.value = textureFour;
            break;
        }
      });

      link.addEventListener("mouseleave", () => {
        this.uniforms.uAlpha.value = lerp(this.uniforms.uAlpha.value, 0.0, 0.1);
      });
    });
    this.addEventListeners(document.querySelector("ul"));
    this.setUpCamera();
    this.onMouseMove();
    this.createMesh();
    this.render();
  }

  get viewport() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let aspectRatio = width / height;

    return {
      width,
      height,
      aspectRatio,
    };
  }

  addEventListeners(element) {
    element.addEventListener("mouseenter", () => {
      this.linkHovered = true;
    });
    element.addEventListener("mouseleave", () => {
      this.linkHovered = false;
    });
  }

  setUpCamera() {
    window.addEventListener("resize", this.onWindowResize.bind(this));

    let fov = (180 * (2 * Math.atan(this.viewport.height / 2 / this.perspective))) / Math.PI;
    this.camera = new THREE.PerspectiveCamera(fov, this.viewport.aspectRatio, 0.1, 1000);
    this.camera.position.set(0, 0, this.perspective);

    this.renderer = new THREE.WebGL1Renderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
  }

  createMesh() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 20, 20);
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      // wireframe: true,
      // side: THREE.DoubleSide
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.sizes.set(300, 400, 1);
    this.mesh.scale.set(this.sizes.x, this.sizes.y, 1);

    this.mesh.position.set(this.offset.x, this.offset.y, 0);

    this.scene.add(this.mesh);
  }

  onWindowResize() {
    this.camera.aspect = this.viewport.aspectRatio;
    this.camera.fov = (180 * (2 * Math.atan(this.viewport.height / 2 / this.perspective))) / Math.PI;
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    this.camera.updateProjectionMatrix();
  }

  onMouseMove() {
    window.addEventListener("mousemove", (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });
  }

  render() {
    this.offset.x = lerp(this.offset.x, targetX, 0.1);
    this.offset.y = lerp(this.offset.y, targetY, 0.1);
    this.uniforms.uOffset.value.set((targetX - this.offset.x) * 0.0005, -(targetY - this.offset.y) * 0.0005);
    // this.mesh.scale.set(this.sizes.x, this.sizes.y)
    this.mesh.position.set(this.offset.x - window.innerWidth / 2, -this.offset.y + window.innerHeight / 2, 0);

    // set uAlpha when list is hovered / unhovered
    this.linkHovered
      ? (this.uniforms.uAlpha.value = lerp(this.uniforms.uAlpha.value, 1.0, 0.1))
      : (this.uniforms.uAlpha.value = lerp(this.uniforms.uAlpha.value, 0.0, 0.1));

    for (let i = 0; i < this.links.length; i++) {
      if (this.linkHovered) {
        this.links[i].style.opacity = 0.2;
      } else {
        this.links[i].style.opacity = 1;
      }
    }

    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }
}

window.addEventListener("load", () => {
  new WebGL();
});
