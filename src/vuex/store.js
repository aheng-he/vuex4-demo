import { reactive } from 'vue';
import { storeKey } from './injectKey';
import ModuleCollection from './module/module-collection';
import { forEachValue, isPromise } from './utils';

function getNestedState(state, path) { // 根据路径 获取store.上面的最新状态
    return path.reduce((state, key) => state[key], state)
}

function installModule(store, rootState, path, module) { // 递归安装
    let isRoot = !path.length;  // 如果数组是空数组 说明是根，否则不是


    const namespaced = store._modules.getNamespaced(path)
    // rootState = {
    //     state: state,
    //     a:{
    //         state: a.state,
    //         c: {
    //             state: c.state
    //         }
    //     },
    //     b: b.state,
    // }

    if (!isRoot) {
        let parentState = path.slice(0, -1).reduce((state, key) => state[key], rootState)
        parentState[path[path.length - 1]] = module.state
    }

 
    module.forEachGetter((getter, key) => {  // {double: function(state){}}
        store._wrappedGetters[namespaced + key] = () => {
            // store.state 使用store.state是因为module.state不是响应式的
            return getter(getNestedState(store.state, path))
        }
    })
    // mutation   {add:[mutation]}
    module.forEachMutation((mutation, key) => {
        const entry = store._mutations[namespaced + key] || (store._mutations[namespaced + key] = [])
        entry.push((payload) => {  // store.commit("add", payload)
            mutation.call(store, getNestedState(store.state, path), payload)
        })
    })

    // actions mutation和action的一个区别， action执行后返回一个是promise 
    module.forEachAction((action, key) => {
        const entry = store._actions[namespaced + key] || (store._actions[namespaced + key] = [])
        entry.push((payload) => {
            let res = action.call(store, store, payload)
            // 判断res是否为一个promise
            if (!isPromise(res)) {
                return Promise.resolve(res)
            }
            return res
        })
    })

    module.forEachValue((child, key) => {
        installModule(store, rootState, path.concat(key), child)
    })


}

// 将state和getter放置到store上，并处理响应式
function resetStoreState(store, state) {
    store._state = reactive({ data: state })  // 用data包裹一层是为了修改的时候方便 store._state.date = 'xxx' 不会影响数据的响应式
    const wrappedGetters = store._wrappedGetters;
    store.getters = {};
    forEachValue(wrappedGetters, (getter, key) => {
        Object.defineProperty(store.getters, key, {
            get: getter,
            enumerable: true
        })
    })
}
// 创建容器  返回store
export default class Store {
    constructor(options) {
        // { state, mutations, actions, modules }
        const store = this;
        // 收集，模块
        store._modules = new ModuleCollection(options)

        // {add:[fn,fn,fn]}  发布订阅模式
        store._wrappedGetters = Object.create(null);
        store._mutations = Object.create(null);
        store._actions = Object.create(null);
        // 定义状态
        const state = store._modules.root.state; // 根状态

        installModule(store, state, [], store._modules.root);
        // 重置Store的状态
        resetStoreState(store, state);


    }

    get state() {
        return this._state.data
    }

    commit = (type, payload) => {
        const entry = this._mutations[type] || []
        entry.forEach(handler => handler(payload))
    }
    dispatch = (type, payload) => {
        const entry = this._actions[type] || []
        return Promise.all(entry.map(handler => handler(payload)))
    }
    install(app, injectKey) {  // createApp().use(store, 'my')
        // 全局暴露一个 变量，暴露的是store的实例
        app.provide(injectKey || storeKey, this)

        // Vue2.x Vue.prototype.$store = this
        app.config.globalProperties.$store = this; // 增添$store属性 使得可以直接在模板中使用 $store.state.count

    }
}


// 格式化用户的参数，实现根据自己的需要，后续使用时方便

// root = {
//     _raw:rootModule,
//     state:rootModule.state, // 用户管理 
//     _children:{
//         aCount:{ // > 1
//             _raw:aModule,
//             state:aModule.state,
//             _children:{ // > 1
//                 cCount:{
//                     _raw:useCssModule,
//                     state:cModule.state,
//                     _children:{}
//                 }
//             }
//         },
//         bCount:{
//             _raw:bModule,
//             state:bModule.state,
//             _children:{}
//         }
//     }
// }