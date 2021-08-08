const wrapper = document.getElementById("scene-wrapper");
const width = $(wrapper).width(), height = $(wrapper).height();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height);
wrapper.appendChild(renderer.domElement);

wrapper.addEventListener('mousemove', onPointerMove);
wrapper.addEventListener('resize', onWindowResize);

function onWindowResize() {
    width = $(wrapper).width(), height = $(wrapper).height();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    render();
}

const pointer = new THREE.Vector2();
const pointerId = null;
function onPointerMove(event) {
    pointer.x = (event.clientX - $(wrapper).offset().left) / width * 2 - 1;
    pointer.y = - (event.clientY - $(wrapper).offset().top) / height * 2 + 1;

    if (pointerId != null) {
        scene.getObjectById(pointerId);
    }

    render();
}

let raycaster = new THREE.Raycaster();
let intersected = null, intersectedColor = null;
let transparentIds = [], textIds = [];

var bodies = new Map();  // Maps bodies to their parameters
var objects = new Map(); // Maps three.js objects to bodies

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
            if (objects.has(intersects[it].object.id)) {
                intersected = intersects[it].object;
                // Avoid reference copy
                intersectedColor = $.extend(true, {}, intersected.material.color);
                intersected.material.color.set(0xff0000);
                setBodyInfo(bodies.get(objects.get(intersected.id)));
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

// Load fonts
const loader = new THREE.FontLoader();
var opensans;
loader.load(
    "fonts/json/opensans.json",
    function(font) {
        opensans = font;
    }
);

while (opensans == null) {
    await new Promise(r => setTimeout(r, 2));
}

// Read bodies from the file
$.getJSON("data/helios.json", function(json) {
    $.each(json, function(id, body) {
        readBody(body, document.getElementById("poi-list"));
    });
    renderer.render(scene, camera);
});

// Recursively reads, renders and remembers bodies from a json dump
function readBody(body, poi) {
    // Render
    var objectId = renderBody(body);

    // Save body data
    bodies.set(body.bodyId, body);
    objects.set(objectId, body.bodyId);

    // Add to the POI list
    var listElement = document.createElement("li");
    listElement.innerHTML = body.name;
    poi.appendChild(listElement);

    if (body.bodies) {
        var childrenElement = document.createElement("ul");
        poi.append(childrenElement);

        // Call children
        $.each(body.bodies, function(id, childBody) {
            readBody(childBody, childrenElement);
        });
    }
}

// Renders a body on the system map
function renderBody(body) {
    // Squeeze coordinates
    var center = new THREE.Vector3(
        body.center.x,
        body.center.y,
        body.center.z
    );
    center.divideScalar(1000000);

    // Generate the sphere
    const sphere = getBodyMesh(body.type);
    sphere.position.set(center.x, center.y, center.z);
    scene.add(sphere);

    // If the sphere is a planet, render its name
    if (body.type == "planet") {
        // Generate the text
        const geometry = new THREE.TextGeometry(
            body.name, 
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
        geometry.computeBoundingBox();
        var vec = new THREE.Vector3();
        geometry.boundingBox.getSize(vec);

        text.position.set(center.x - vec.x / 2, center.y - 5, center.z);
        scene.add(text);
        textIds.push(text.id);

        // If the planet isn't close to the z=0 plane, generate the stand
        if (Math.abs(center.z) > 1) {
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([
                    center,
                    new THREE.Vector3(center.x, center.y, 0)]),
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
            ring.position.set(center.x, center.y, 0);
            scene.add(line, ring);
        }        
    }

    // Return the id
    return sphere.id;
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

function setBodyInfo(parameters) {
    document.getElementById("poi-current-image").src = "data/images/planet-icons/" + parameters.name + ".png";
    document.getElementById("poi-current-image").style.opacity = 1.0;
    document.getElementById("poi-current-name").innerHTML = parameters.name;
    document.getElementById("poi-current-gravity").innerHTML = "unknown";
    document.getElementById("poi-current-size").innerHTML = parameters.radius;
}

function clearBodyInfo() {
    document.getElementById("poi-current-image").src = "data/images/planet-icons/none.png";
    document.getElementById("poi-current-image").style.opacity = 0.0;
    document.getElementById("poi-current-name").innerHTML = "";
    document.getElementById("poi-current-gravity").innerHTML = "";
    document.getElementById("poi-current-size").innerHTML = "";
}

const geometry = new THREE.RingGeometry(0, 140, 100);
const material = new THREE.MeshBasicMaterial({color: 0xddddff, opacity: 0.15, transparent: true})
const ring = new THREE.Mesh(geometry, material);
scene.add(ring);
transparentIds.push(ring.id);
ring.position.set(-2, 30, 0);

camera.position.set(0, 0, 170);
render();

var cameraSpeed = 4.0;
function moveCamera(pos, rotate) {
    camera.position.add(pos.multiplyScalar(cameraSpeed));   
    camera.rotation.x += rotate.x * cameraSpeed;
    camera.rotation.y += rotate.y * cameraSpeed;
    camera.rotation.z += rotate.z * cameraSpeed;
    render();
}
// A D - simple X
// W S - simple Y
// C sp - simple Z

// R F - vertical strife
// Q E - horizontal strife
// Z X - zoom

document.addEventListener('keypress', function(event) {
    switch (event.code) {
        case 'KeyD':
            moveCamera(new THREE.Vector3(1, 0, 0), new THREE.Euler());
            break;
        case 'KeyA':
            moveCamera(new THREE.Vector3(-1, 0, 0), new THREE.Euler());
            break;
        case 'KeyW':
            moveCamera(new THREE.Vector3(0, 1, 0), new THREE.Euler());
            break;
        case 'KeyS':
            moveCamera(new THREE.Vector3(0, -1, 0), new THREE.Euler());
            break;
        case 'Space':
            moveCamera(new THREE.Vector3(0, 0, 1), new THREE.Euler());
            break;
        case 'KeyC':
            moveCamera(new THREE.Vector3(0, 0, -1), new THREE.Euler());
            break;
        case 'KeyR':
            moveCamera(new THREE.Vector3(), new THREE.Euler(0.04, 0, 0));
            break;
        case 'KeyF':
            moveCamera(new THREE.Vector3(), new THREE.Euler(-0.04, 0, 0));
            break;
        case 'KeyQ':
            moveCamera(new THREE.Vector3(), new THREE.Euler(0, 0.04, 0));
            break;
        case 'KeyE':
            moveCamera(new THREE.Vector3(), new THREE.Euler(0, -0.04, 0));
            break;
        case 'KeyZ':
            moveCamera(new THREE.Vector3(), new THREE.Euler(0, 0, 0.04));
            break;
        case 'KeyX':
            moveCamera(new THREE.Vector3(), new THREE.Euler(0, 0, -0.04));
            break;
    }
    console.log(event.key, event.code);
})