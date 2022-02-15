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

    /**
     * Parses the JSON fragment containing map data.
     * @param json the json string
     * @returns the top-level map object
     */
    static parse(json: any): DUMapObject {
        // Get children
        var children: Set<DUMapObject> = new Set();
        json.children.array.forEach((child: any) => {
            children.add(DUMapObject.parse(child));
        });
    
        // Create the body
        return new DUMapObject(
            json.bodyId,
            json.name,
            json.type,
            new Vector3(json.center.x, json.center.y, json.center.z).divideScalar(1000000),
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
     * Returns all children of this object.
     */
    public get allChildren(): Set<DUMapObject> {
        return Array.from(this.children)
            .reduce((s: Set<DUMapObject>, child: DUMapObject) => {
                child.allChildren.forEach(s.add, s);
                return s;
            }, new Set([this]));
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
    makeInterfaceList(parentDOM: HTMLElement, filters: Array<String>) {
        // By default the child element list is the parent's list
        // This changes if the object isn't filtered out 
        var childDOM = parentDOM;

        // Check if the object is filtered out
        if (filters.includes(this.type)) {
            // Add to the objects list
            var listElement = document.createElement("li");
            listElement.innerHTML = this.name;
            parentDOM.appendChild(listElement);

            // If the object has children, add a child DOM
            if (this.hasChildren())
                parentDOM.append(childDOM = document.createElement("ul"))
        } 

        // Make children
        Array.from(this.children).forEach((child: DUMapObject) => {
            child.makeInterfaceList(childDOM, filters);
        });
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