import { threadId } from "worker_threads";

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