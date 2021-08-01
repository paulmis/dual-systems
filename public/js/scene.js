const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );

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

const geometry = new THREE.RingGeometry(5, 150, 100);
const material = new THREE.MeshBasicMaterial({opacity: 0.2  , transparent: true})
const ring = new THREE.Mesh(geometry, material);
scene.add(ring);
ring.position.set(150, 100);

camera.position.set(150, 100, 175);
camera.lookAt(150, 100, 0);
renderer.render(scene, camera);