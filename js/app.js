import * as THREE from "three";
import { images } from "./images.js";

console.log(images);

// 선형보간 함수
// https://youtu.be/WNoizdtEPA4
// https://docs.unity3d.com/ScriptReference/Vector3.Lerp.html
function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

// Mouse coordinates
let targetX = 0;
let targetY = 0;

// load image textures for Mesh
const texture1 = new THREE.TextureLoader().load(images.image1);
const texture2 = new THREE.TextureLoader().load(images.image2);
const texture3 = new THREE.TextureLoader().load(images.image3);
const texture4 = new THREE.TextureLoader().load(images.image4);

class WebGL {
  constructor() {
    this.container = document.querySelector("main");
    this.links = [...document.querySelectorAll("li")];

    this.scene = new THREE.Scene();
    this.perspective = 1000; // Camera perespective / distance on the z axis
    this.sizes = new THREE.Vector2(0, 0); // Mesh sizes
    this.offset = new THREE.Vector2(0, 0); // Mesh position
    this.uniform = {
      uTextture: { value: texture1 },
      uAlpha: { value: 0.0 },
      uOffset: { value: new THREE.Vector2(0.0, 0.0) },
    };

    this.links.forEach((link, idx) => {
      link.addEventListener("mouseenter", () => {
        switch (idx) {
          case 0:
            this.uniform.uTextture.value = texture1;
            break;
          case 1:
            this.uniform.uTextture.value = texture2;
            break;
          case 2:
            this.uniform.uTextture.value = texture3;
            break;
          case 3:
            this.uniform.uTextture.value = texture4;
            break;
          default:
            return;
        }
      });
    });

    this.addEventListeners(document.querySelector("ul"));
    this.setupCamera();
    this.onMousemove();
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

  onMousemove() {
    window.addEventListener("mousemove", ({ clientX, clientY }) => {
      targetX = clientX;
      targetY = clientY;
    });
  }

  addEventListeners(element) {
    element.addEventListener("mouseenter", () => {
      this.linkHover = true;
    });
    element.addEventListener("mouseleave", () => {
      this.linkHover = false;
    });
  }

  setupCamera() {
    //Readjust dimentions on window resize
    window.addEventListener("resize", this.onWindowResize.bind(this));

    let fov = (180 * (2 * Math.atan(this.viewport.height / 2 / this.perspective))) / Math.PI;
    this.camera = new THREE.PerspectiveCamera(fov, this.viewport.aspectRatio, 0.1, 1000);
    this.camera.position.set(0, 0, this.perspective);

    //Renderer / canvas
    this.renderer = new THREE.WebGL1Renderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
  }

  onWindowResize() {
    this.camera.aspect = this.viewport.aspectRatio;
    this.camera.fov = (180 * (2 * Math.atan(this.viewport.height / 2 / this.perspective))) / Math.PI;
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    this.camera.updateProjectionMatrix();
  }

  createMesh() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 20, 20);
    this.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.sizes.set(250, 350);
    this.mesh.scale.set(this.sizes.x, this.sizes.y);
    this.mesh.position.set(this.offset.x, this.offset.y);
    this.scene.add(this.mesh);
  }
  render() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }
}

new WebGL();
