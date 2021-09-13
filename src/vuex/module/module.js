import { forEachValue } from "../utils";

export default class Module{
    constructor(rawModule) {
        this._raw = rawModule;
        this._children = {};
        this.state = rawModule.state
        this.namespaced = rawModule.namespaced;
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

    forEachGetter(fn){
        if(this._raw.getters){
            forEachValue(this._raw.getters, fn)
        }
    }

    forEachMutation(fn){
        if(this._raw.mutations){
            forEachValue(this._raw.mutations, fn)
        }
    }

    forEachAction(fn){
        if(this._raw.actions){
            forEachValue(this._raw.actions, fn)
        }
    }
}