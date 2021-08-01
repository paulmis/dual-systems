const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

$.getJSON("data/helios.json", function(stars) {
    $.each(stars, function(id, bodies) {
        $.each(bodies, function(id, params) {
            if (!params.name.includes("Moon")) {
                var x = (params.center.x + 150000000) / 1000000;
                var y = (params.center.y + 120000000) / 1000000;
                var z = params.center.z / 1000000;

                const geometry = new THREE.SphereGeometry(1);
                const material = new THREE.MeshBasicMaterial({color: 0xeeeeee});
                const sphere = new THREE.Mesh(geometry, material);
                scene.add(sphere);

                sphere.position.set(x, y, z);
                console.log(params.name + ":", x, y, z);
                renderer.render(scene, camera);
            }
        });
    });
});

const geometry = new THREE.RingGeometry(5, 125, 100);
const material = new THREE.MeshBasicMaterial({opacity: 0.2  , transparent: true})
const ring = new THREE.Mesh(geometry, material);
scene.add(ring);
ring.position.set(150, 120);

camera.position.set(150, 120, 175);
renderer.render(scene, camera);

var cameraSpeed = 2.0;
function moveCamera(pos, rotate) {
    camera.position.add(pos.multiplyScalar(cameraSpeed));   
    camera.rotation.x += rotate.x * cameraSpeed;
    camera.rotation.y += rotate.y * cameraSpeed;
    camera.rotation.z += rotate.z * cameraSpeed;
    renderer.render(scene, camera);
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