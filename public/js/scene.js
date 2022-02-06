

const wrapper = document.getElementById("scene-wrapper");
const width = $(wrapper).width(), height = $(wrapper).height();

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
wrapper.appendChild(renderer.domElement);



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