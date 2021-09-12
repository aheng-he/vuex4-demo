import { forEachValue } from "../utils";

export default class Module{
    constructor(rawModule) {
        this._raw = rawModule;
        this._children = {};
        this.state = rawModule.state
    }

    getChild(key){
        return this._children[key]
    }

    addChild(key, module){
        this._children[key] = module
    }

    forEachChild(fn){
        forEachValue(this._children, fn)
    }
}