const wrapper = document.getElementById("main-wrapper");
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
    console.log(pointer);

    if (pointerId != null) {
        scene.getObjectById(pointerId);
    }

    render();
}

let raycaster = new THREE.Raycaster();
let intersected = null;
let bodyIds = [], transparentIds = [];

function render() {
    // Shoot the raycast
    raycaster.setFromCamera(pointer, camera);
    let intersects = raycaster.intersectObjects(scene.children);

    // Skip transparent objects
    var it = 0;
    while (it < intersects.length && transparentIds.includes(intersects[it].object.id))
        it++;

    // If the raycast intersects some objects...
    if (it < intersects.length) {
        if (intersected != intersects[it].object) {
            // Cleanup old intersect
            if (intersected) {
                intersected.material.color.set(0xeeeeee);
            }

            if (bodyIds.includes(intersects[it].object.id)) {
                intersected = intersects[it].object;
                intersected.material.color.set(0xff0000);
            }
        }
    // Otherwise cleanup the old object
    } else if (intersected) {
        intersected.material.color.set(0xeeeeee);
        intersected = null;
    }

    // Render the map
    renderer.render(scene, camera);
}

$.getJSON("data/helios.json", function(stars) {
    $.each(stars, function(id, bodies) {
        $.each(bodies, function(id, params) {
            if (!params.name.includes("Moon") && !params.name.includes("Sanctuary")) {
                var x = (params.center.x + 150000000) / 1000000;
                var y = (params.center.y + 120000000) / 1000000;
                var z = params.center.z / 1000000;

                const geometry = new THREE.SphereGeometry(1);
                const material = new THREE.MeshBasicMaterial({color: 0xeeeeee});
                const sphere = new THREE.Mesh(geometry, material);
                scene.add(sphere);

                bodyIds.push(sphere.id);
                
                const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(x, y, z),
                    new THREE.Vector3(x, y, 0)
                ]);
                const line = new THREE.Line(lineGeometry, material);
                scene.add(line);

                if (Math.abs(z) > 1) {
                    const ringGeometry = new THREE.RingGeometry(0, 3, 20);
                    const ringMaterial = new THREE.MeshBasicMaterial({opacity: 0.4, transparent: true})
                    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                    scene.add(ring);
                    ring.position.set(x, y, 0);
                }

                sphere.position.set(x, y, z);
                console.log(params.name + ":", x, y, z);
                renderer.render(scene, camera);
            }
        });
    });
});

console.log(bodyIds);

const geometry = new THREE.RingGeometry(0, 110, 100);
const material = new THREE.MeshBasicMaterial({color: 0xddddff, opacity: 0.15, transparent: true})
const ring = new THREE.Mesh(geometry, material);
scene.add(ring);
transparentIds.push(ring.id);
ring.position.set(155, 115, 0);

camera.position.set(155, 115, 170);
render();

var cameraSpeed = 2.0;
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