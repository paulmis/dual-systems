import { BufferGeometry, Line, Mesh, MeshBasicMaterial, Object3D, RingGeometry, Scene, SphereGeometry, Vector3 } from "three";
import { pos3d } from "./positions";

// Represents any map object
export default class DUMapObject {
    id: string;
    sceneId: number;
    name: string;
    type: string;
    pos: Vector3;
    children: Set<DUMapObject>;
    transparent: boolean = false;
    radius?: number;
    gravity?: number;

    body: Mesh;
    ring: Mesh;
    line: Line;

    constructor(id: string, name: string, type: string, pos: Vector3, 
        children: Set<DUMapObject>, radius?: number, gravity?: number) { 
        this.id = id;
        this.name = name;
        this.type = type;
        this.pos = pos;
        this.children = children;
        this.radius = radius;
        this.gravity = gravity;
    }

    static parse(json: any): DUMapObject {
        // Normalize coordinates
        var pos = new Vector3(json.center.x, json.center.y, json.center.z)
            .divideScalar(1000000);

        // Get children
        var children: Set<DUMapObject> = new Set();
        for (var childJson of json.children)
            children.add(DUMapObject.parse(childJson));
    
        // Create the body
        return new DUMapObject(
            json.bodyId,
            json.name,
            json.type,
            pos,
            children,
            json.radius,
            json.gravity);
    }

    /**
     * Checks whether this object has any children.
     */
    public hasChildren() {
        return this.children.size > 0;
    }

    /**
     * Adds this and this object's children's 3d objects to the scene.
     */
    public render(scene: Scene) {
        // Generate the body
        this.body = getBodyMesh(this.type);
        this.body.position.set(this.pos.x, this.pos.y, this.pos.z);

        // If the sphere is a planet, render the 'stand'
        // TODO: re-add text renderings
        if (this.type == "planet") {
            // If the planet isn't close to the z = 0 plane, generate the stand
            if (Math.abs(this.pos.z) > 1) {
                this.line = new Line(
                    new BufferGeometry().setFromPoints([
                        this.pos,
                        new Vector3(this.pos.x, this.pos.y, 0)]),
                    new MeshBasicMaterial({
                        color: 0xeeeeee,
                    })
                );
                this.ring = new Mesh(
                    new RingGeometry(0, 3, 20),
                    new MeshBasicMaterial({
                        opacity: 0.4, 
                        transparent: true
                    })
                );
                this.ring.position.set(this.pos.x, this.pos.y, 0);
            }        
        }

        // Add the objects to the scene
        scene.add(this.body, this.line, this.ring);

        // Render children
        this.children.forEach(function(o: DUMapObject) {
            o.render(scene);
        });
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

function getBodyMesh(type: string): Mesh {
    switch (type) {
        case "star": 
            return new Mesh(
                new SphereGeometry(3.0),
                new MeshBasicMaterial({
                    color: 0xf4cd00,
                }));
        case "planet": 
            return new Mesh(
                new SphereGeometry(1.0),
                new MeshBasicMaterial({
                    color: 0xeeeeee,
                }));
        case "moon":
            return new Mesh(
                new SphereGeometry(0.4),
                new MeshBasicMaterial({
                    color: 0xbbbbbb,
                }));
    }
}