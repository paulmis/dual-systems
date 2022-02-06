import { Mesh, MeshBasicMaterial, PerspectiveCamera, RingGeometry, Scene, WebGLRenderer } from 'three';
import MapObject from "./MapObject"

export default class Map {
    objects: Set<MapObject> = new Set();
    scene: THREE.Scene = new Scene();
    renderer: THREE.Renderer = new WebGLRenderer();
    parentDOM: HTMLElement;
    listDOM: HTMLElement;
    objectInfoDOM: HTMLElement;
    camera: THREE.Camera = new PerspectiveCamera();
    disk: Mesh;

    /**
     * Constructs a new map from the specified file.
     * @param parentDOM the map's wrapper DOM
     * @param listDOM the objects' list DOM
     * @param objectInfoDOM the wrapper DOM for the precise object data
     * @param src system soruce data
     */
    constructor(parentDOM: HTMLElement, listDOM: HTMLElement, objectInfoDOM: HTMLElement, src: string) {
        // Set DOMs
        this.parentDOM = parentDOM;
        this.listDOM = listDOM;
        this.objectInfoDOM = objectInfoDOM;

        // Manage the renderer
        this.renderer.setSize(this.width, this.height);
        parentDOM.appendChild(this.renderer.domElement);

        // Load the bodies and animate the scene
        this.load(src);
        this.animate();
    }

    public load(src: string) {
        // Set camera position
        this.camera.position.set(0, 0, 170);        

        // Read bodies from the file
        $.getJSON(src, (json: any) => {
            // Append stars of the system
            $.each(json, function(id: string, json: any) {
                this.objects.add(MapObject.parse(json));
            });
        }).done(() => {
            // Make the objects list
            objects.forEach(function(o: MapObject) {
                o.makeInterfaceList(this.listDOM); 
            });
        });

        // Add the planetary disk
        this.disk = new Mesh(
            new RingGeometry(0, 140, 100),
            new MeshBasicMaterial({color: 0xddddff, opacity: 0.15, transparent: true})
        );
        this.disk.position.set(-2, 30, 0);
        scene.add(this.disk);

        // Add onclick events to objects list buttons
        for (const type of ['planets', 'moons', 'starbases', 'fleets'])
            document.getElementById('poi-' + type + '-btn').onclick = function() { filterPOI(type); };
    }

    /**
     * Renders this scene.
     */
    public render() {
        objects.forEach(function(o: MapObject) {
            o.render(this.scene);
        });
    }

    /**
     * Runs the animation of this map's canvas.
     */
    private animate() {
        requestAnimationFrame(this.animate);
        controls.update();
        render();
    }

    /**
     * Returns the width of the parent DOM element.
     */
    public get width() {
        return $(this.parentDOM).width();
    }

    /**
     * Returns the height of the parent DOM element.
     */
    public get height() {
        return $(this.parentDOM).height();
    }
}