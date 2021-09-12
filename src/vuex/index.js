
import Store from './store'

function createStore(options){
    return new Store(options)
}

export {
    createStore
}