import { Color, Intersection, Mesh, MeshBasicMaterial, Object3D, PerspectiveCamera, Raycaster, Renderer, RingGeometry, Scene, Vector2, WebGLRenderer } from 'three';
import DUMapObject from "./DUMapObject"
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';

/**
 * Represents a DU planetary system map.
 */
export default class DUMap {
    root: DUMapObject                               // root object
    objects: Map<string, DUMapObject> = new Map();  // list of all game objects
    sceneObjects: Map<number, DUMapObject> = new Map(); // temporary
    scene: Scene = new Scene();                     // map object
    renderer: Renderer = new WebGLRenderer();       // map renderer
    camera: PerspectiveCamera;                      // map camera
    controls: TrackballControls;                    // map controls
    pointer: Vector2 = new Vector2();               // map mouse pointer
    parentDOM: HTMLElement;                         // scene wrapper
    listDOM: HTMLElement;                           // object list wrapper
    listFiltersDOM: HTMLElement;
    objectInfoDOM: HTMLElement;                     // object info wrapper
    currentObject: Mesh;                            // currently chosen object
    disk: Mesh;                                     // the planetary disk at z = 0

    /**
     * Constructs a new map from the specified file.
     * @param parentDOM the map's wrapper DOM
     * @param listDOM the objects' list DOM
     * @param objectInfoDOM the wrapper DOM for the precise object data
     * @param src system soruce data
     */
    constructor(parentDOM: HTMLElement, listDOM: HTMLElement, listFiltersDOM: HTMLElement, objectInfoDOM: HTMLElement, data: string) {
        // Set DOMs
        this.parentDOM = parentDOM;
        this.listDOM = listDOM;
        this.listFiltersDOM = listFiltersDOM;
        this.objectInfoDOM = objectInfoDOM;
        this.current = null;

        // Manage the renderer
        this.renderer.setSize(this.width, this.height);
        parentDOM.appendChild(this.renderer.domElement);

        // Add the planetary disk
        this.disk = new Mesh(
            new RingGeometry(0, 140, 100),
            new MeshBasicMaterial({color: 0xddddff, opacity: 0.15, transparent: true})
        );
        this.disk.position.set(-2, 30, 0);
        this.scene.add(this.disk);

        // Camera
        this.camera = new PerspectiveCamera(75, this.aspect, 0.1, 1000);
        parentDOM.addEventListener('resize', this.windowResizeEvent);

        // Controls
        this.controls = new TrackballControls(this.camera, this.parentDOM);
        this.controls.rotateSpeed = 2.0;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.8;
        this.controls.keys = [ 'KeyA', 'KeyS', 'KeyD' ];
        parentDOM.addEventListener('mousemove', this.mouseMoveEvent);

        // Add filter list buttons
        for (const type of ['planets', 'moons', 'starbases', 'fleets']) {
            var btn: HTMLButtonElement = document.createElement('button');
            btn.value = type;
            btn.classList.add("toggle");
            btn.onclick = () => {
                btn.classList.toggle("toggle");
                this.rebuildPOIList();
            };
        }

        // Load the bodies and animate the scene
        this.load(data);
        this.animate();
    }

    public load(data: string) {
        // Set camera position
        this.camera.position.set(0, 0, 170);        


        // Read bodies from the file
        this.root = DUMapObject.parse(data);
        this.root.allChildren.forEach(this.add);
        this.rebuildPOIList();
    }

    /**
     * Renders this scene.
     */
    public render() {
        // Add objects
        this.objects.forEach(function(o: DUMapObject) {
            o.render(this.scene);
        });

        // Set the object intersected by the cursor as the current object
        this.current = this.intersected() as Mesh;

        // Execute the render
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Casts a ray from the camera to the cursor and returns the first object hit.
     */
    public intersected(): Object3D {
        // Raycast to find the intersected object
        var ray: Raycaster = new Raycaster();
        ray.setFromCamera(this.pointer, this.camera);
        return ray
            .intersectObjects(this.scene.children)
            .find((o: Intersection<Object3D>) => !this.sceneObjects.get(o.object.id).transparent)
            .object;
    }

    /**
     * Runs the animation of this map's canvas.
     */
    private animate() {
        requestAnimationFrame(this.animate);
        this.controls.update();
        this.render();
    }

    /**
     * Handles the change of scene's dimensions.
     */
     private windowResizeEvent() {
        this.camera.aspect = this.aspect;
        this.camera.updateProjectionMatrix();
        this.controls.handleResize();
        this.renderer.setSize(this.width, this.height);
        this.render();
    }

    /**
     * Handles the mouse move event.
     */
    private mouseMoveEvent(event) {
        this.pointer.x = (event.clientX - $(this.parentDOM).offset().left) / this.width * 2 - 1;
        this.pointer.y = - (event.clientY - $(this.parentDOM).offset().top) / this.height * 2 + 1;
    }

    /**
     * Adds a new object to the map.
     */
    public add(object: DUMapObject) {
        this.objects.set(object.id, object);
        this.sceneObjects.set(object.sceneId, object);
    }

    /**
     * Returns the width of the parent DOM element.
     */
    public get width(): number {
        return this.parentDOM.clientWidth;
    }

    /**
     * Returns the height of the parent DOM element.
     */
    public get height(): number {
        return this.parentDOM.clientHeight;
    }

    /**
     * Returns the width to height aspect ratio.
     */
    public get aspect(): number {
        return this.width / this.height;
    }

    /**
     * Returns a list of active POI filters, i.e. body types that should be shown.
     */
    private getPOIFilters(): Array<String> {
        return Array.from(this.listFiltersDOM.children)
            .filter((btn: HTMLElement) => btn instanceof HTMLButtonElement && btn.classList.contains("toggled"))
            .map((btn: HTMLButtonElement) => btn.value);
    }

    /**
     * Clears and rebulds the POI list.
     */
    protected rebuildPOIList() {
        this.listDOM.innerHTML = "";
        this.root.makeInterfaceList(this.listDOM, this.getPOIFilters());
    }

    /**
     * Sets the current object in the objectInfoDOM.
     */
    public set current(object: Mesh) {
        // If the raycast intersected something
        if (object) {
            // If the old cast and new cast are the same then skip
            if (this.currentObject != object) {
                // If the old cast hit an object, clean it up
                if (this.currentObject)
                    (<MeshBasicMaterial>this.currentObject.material).color.set(new Color(0xffffff));
                
                // Mark the new object and change the DOM data
                this.currentObject = object;
                (<MeshBasicMaterial>this.currentObject.material).color.set(new Color(0xff0000));
                this.currentObjectDOMData = this.sceneObjects.get(this.currentObject.id);
            }
        // Otherwise clean up the old object
        } else if (this.currentObject) {
            (<MeshBasicMaterial>this.currentObject.material).color.set(new Color(0xffffff));
            this.currentObject = null;
            $(this.objectInfoDOM).hide();
        } 
    }

    /**
     * Sets the data for the current object DOM.
     */
    private set currentObjectDOMData(object: DUMapObject) {
        this.objectInfoDOM.querySelector<HTMLImageElement>('#poi-current-image').src 
            = "data/images/planet-icons/" + object.name + ".png";
        this.objectInfoDOM.querySelector<HTMLElement>('#poi-current-image').style.opacity = "1.0";
        this.objectInfoDOM.querySelector("poi-current-name").innerHTML = object.name;
        if ((object.type == "star" || object.type == "planet") && object.children.size > 0) {
            this.objectInfoDOM.querySelector("poi-current-name").innerHTML += " (" + object.children.size + ")";
        }
        this.objectInfoDOM.querySelector("poi-current-gravity").innerHTML = object.gravity.toString() + "g";
        this.objectInfoDOM.querySelector("poi-current-size").innerHTML = object.radius.toString();
    }
}