import * as THREE from 'https://cdn.skypack.dev/three@0.131.3'
import { TrackballControls } from 'https://cdn.skypack.dev/three@0.131.3/examples/jsm/controls/TrackballControls.js'

const wrapper = document.getElementById("scene-wrapper");
const width = $(wrapper).width(), height = $(wrapper).height();

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
wrapper.appendChild(renderer.domElement);

// Represents any map object
class MapObject {
    constructor(id, name, type, pos) { 
        this.id = id;
        this.name = name;
        this.type = type;
        this.pos = pos;
        this.children = new Set();
    }

    hasChildren() {
        return this.children.size > 0;
    }

    render(scene) {
        // Generate the sphere
        const sphere = getBodyMesh(this.type);
        sphere.position.set(this.pos.x, this.pos.y, this.pos.z);
        scene.add(sphere);
        this.renderId = sphere.id;

        // If the sphere is a planet, render its name
        if (this.type == "planet") {
            // Generate the text
            const geometry = new THREE.TextGeometry(
                this.name, 
                {
                    font: opensans,
                    size: 2.0,
                    height: 0.5,
                    curveSegments: 50
                }
            );
            const text = new THREE.Mesh(
                geometry,
                new THREE.MeshBasicMaterial({
                    color: 0x66dd66
                })
            );

            // Computer text dimensions
            geometry.computeBoundingBox();
            var vec = new THREE.Vector3();
            geometry.boundingBox.getSize(vec);

            // Add the text to the scene
            text.position.set(this.pos.x - vec.x / 2, this.pos.y - 5, this.pos.z);
            scene.add(text);
            textIds.push(text.id);

            // If the planet isn't close to the z=0 plane, generate the stand
            if (Math.abs(this.pos.z) > 1) {
                const line = new THREE.Line(
                    new THREE.BufferGeometry().setFromPoints([
                        this.pos,
                        new THREE.Vector3(this.pos.x, this.pos.y, 0)]),
                    new THREE.MeshBasicMaterial({
                        color: 0xeeeeee,
                    })
                );
                const ring = new THREE.Mesh(
                    new THREE.RingGeometry(0, 3, 20),
                    new THREE.MeshBasicMaterial({
                        opacity: 0.4, 
                        transparent: true
                    })
                );
                ring.position.set(this.pos.x, this.pos.y, 0);
                scene.add(line, ring);
            }        
        }
    }

    /**
     * Creates the list of the objects on the map interface starting from this object.
     * @param parentDOM the parent <ul> element
     */
    makeInterfaceList(parentDOM) {
        // By default the child element list is the parent's list
        // This changes if the object isn't filtered out 
        var childDOM = parentDOM;

        // Check if the object is filtered out
        var btn = document.getElementById("poi-" + this.type + "s-btn");
        if (!btn || btn.classList.contains("toggled")) {
            // Add to the objects list
            var listElement = document.createElement("li");
            listElement.innerHTML = this.name;
            parentDOM.appendChild(listElement);

            // If the object has children, add a child DOM
            if (this.hasChildren())
                parentDOM.append(childDOM = document.createElement("ul"))
        } 

        // Make children
        for (var child of this.children)
            child.makeInterfaceList(childDOM);
    }
}

// Represents any interplanetary astronomical object
class Body extends MapObject {
    constructor(id, name, type, pos, radius, gravity) {
        super(id, name, type, pos);
        this.radius = radius;
        this.gravity = gravity;
    }
}

// Scene setup
let raycaster = new THREE.Raycaster();
let intersected = null, lockIntersected = false, intersectedColor = null;
let transparentIds = [], textIds = [];
const pointer = new THREE.Vector2();
const pointerId = null;

var system = [];           // Trie-like list of all objects in the system
var objects = new Map();   // Maps object ids to objects
var renderIds = new Map(); // Maps three.js object ids to objects

// Camera
const aspect = width / height;
const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
const controls = new TrackballControls(camera, wrapper);
controls.rotateSpeed = 2.0;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;
controls.keys = [ 'KeyA', 'KeyS', 'KeyD' ];

// Load fonts
const loader = new THREE.FontLoader();
var opensans;

// Load fonts
loader.load(
    "fonts/json/opensans.json",
    function(font) {
        opensans = font;
    }
);    

// Wait for the fonts to load before rendering objects
while (opensans == null) {
    await new Promise(r => setTimeout(r, 2));
}  

init();
animate();

function init() {
    // Read bodies from the file
    $.getJSON("data/helios.json", function(json) {
        // Append stars of the system
        $.each(json, function(id, starJson) {
            system.push(readBody(starJson));
        });
    }).done(() => {
        // Make the objects list
        for (var star of system)
            star.makeInterfaceList(document.getElementById("poi-list"));
    });

    // Add the ring
    const geometry = new THREE.RingGeometry(0, 140, 100);
    const material = new THREE.MeshBasicMaterial({color: 0xddddff, opacity: 0.15, transparent: true})
    const ring = new THREE.Mesh(geometry, material);
    scene.add(ring);
    transparentIds.push(ring.id);
    ring.position.set(-2, 30, 0);

    camera.position.set(0, 0, 170);

    // Add onclick events to objects list buttons
    for (const type of ['planets', 'moons', 'starbases', 'fleets'])
        document.getElementById('poi-' + type + '-btn').onclick = function() { filterPOI(type); };
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

wrapper.addEventListener('resize', onWindowResize);
wrapper.addEventListener('mousemove', onPointerMove);
wrapper.addEventListener('mousedown', onMouseDown);

function onMouseDown() {
    if (intersected) lockIntersected = !lockIntersected;
}

/**
 * Filters points of interers by type.
 * @param type the POI type, e.g. moons
 */
function filterPOI(type) {
    // Toggle the button
    var btn = document.getElementById('poi-' + type + '-btn');
    btn.classList.toggle('toggled');

    // Clear old elements
    const listElement = document.getElementById("poi-list");
    while (listElement.firstChild)
        listElement.removeChild(listElement.firstChild);

    // Add new elements
    for (var star of system)
        star.makeInterfaceList(document.getElementById("poi-list"));
}

// Whenever the window resizes render the scene anew
function onWindowResize() {
    width = $(wrapper).width(), height = $(wrapper).height();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    controls.handleResize();
    renderer.setSize(width, height);
    render();
}

function onPointerMove(event) {
    pointer.x = (event.clientX - $(wrapper).offset().left) / width * 2 - 1;
    pointer.y = - (event.clientY - $(wrapper).offset().top) / height * 2 + 1;

    if (pointerId != null) {
        scene.getObjectById(pointerId);
    }

    render();
}

/**
 * Renders the map.
 */
function render() {
    // Shoot the raycast
    raycaster.setFromCamera(pointer, camera);
    let intersects = raycaster.intersectObjects(scene.children);

    // Skip transparent objects
    var it = 0;
    while (it < intersects.length &&
        transparentIds.includes(intersects[it].object.id))
        it++;

    // If the raycast intersects some objects...
    if (it < intersects.length) {
        if (intersected != intersects[it].object) {
            // Cleanup old intersect
            if (intersected) {
                intersected.material.color.set(intersectedColor);
            }

            // Highlight new intersect
            if (renderIds.has(intersects[it].object.id)) {
                intersected = intersects[it].object;
                // Avoid reference copy
                intersectedColor = $.extend(true, {}, intersected.material.color);
                intersected.material.color.set(0xff0000);
                setBodyInfo(objects.get(renderIds.get(intersected.id)));
            }
        }
    // Otherwise cleanup the old object
    } else if (intersected) {
        intersected.material.color.set(intersectedColor);
        intersected = null;
        intersectedColor = null;
        clearBodyInfo();
    }

    for (var textId of textIds) {
        scene.getObjectById(textId).lookAt(camera.position);
    }

    // Render the map
    renderer.render(scene, camera);
}

// Recursively reads, renders and remembers bodies from a json dump
function readBody(objectJson) {
    // Normalize coordinates
    var center = new THREE.Vector3(
        objectJson.center.x,
        objectJson.center.y,
        objectJson.center.z
    );
    center.divideScalar(1000000);

    // Render and construct
    var object = new Body(objectJson.bodyId, objectJson.name, 
        objectJson.type, center, objectJson.radius, objectJson.gravity);
    object.render(scene);

    // Save body data
    objects.set(object.id, object);
    renderIds.set(object.renderId, object.id);

    // Read children
    $.each(objectJson.bodies, function(id, childBodyJson) {
        object.children.add(readBody(childBodyJson));
    });

    return object;
}

function getBodyMesh(type) {
    switch (type) {
        case "star": 
            return new THREE.Mesh(
                new THREE.SphereGeometry(3.0),
                new THREE.MeshBasicMaterial({
                    color: 0xf4cd00,
                }));
        case "planet": 
            return new THREE.Mesh(
                new THREE.SphereGeometry(1.0),
                new THREE.MeshBasicMaterial({
                    color: 0xeeeeee,
                }));
        case "moon":
            return new THREE.Mesh(
                new THREE.SphereGeometry(0.4),
                new THREE.MeshBasicMaterial({
                    color: 0xbbbbbb,
                }));
    }
}

function setBodyInfo(body) {
    document.getElementById("poi-current-image").src = "data/images/planet-icons/" + body.name + ".png";
    document.getElementById("poi-current-image").style.opacity = 1.0;
    document.getElementById("poi-current-name").innerHTML = body.name;
    if ((body.type == "star" || body.type == "planet") && body.children.size > 0) {
        document.getElementById("poi-current-name").innerHTML += " (" + body.children.size + ")";
    }
    document.getElementById("poi-current-gravity").innerHTML = parseFloat(body.gravity).toPrecision(2) + "g";
    document.getElementById("poi-current-size").innerHTML = body.radius;
}

function clearBodyInfo() {
    document.getElementById("poi-current-image").style.opacity = 0.0;
    document.getElementById("poi-current-name").innerHTML = "";
    document.getElementById("poi-current-gravity").innerHTML = "";
    document.getElementById("poi-current-size").innerHTML = "";
}