import { reactive } from 'vue'
import { forEachValue } from './utils';

// 创建容器  返回store
const storeKey = 'store'
export default class Store {
    constructor(options){
        // { state, mutations, actions, modules }
        const store = this;

        store._state = reactive({data: options.state})

        const _getters = options.getters;  // {double: function => getter}

        store.getters = {}

        forEachValue(_getters, function(fn, key){
            Object.defineProperty(store.getters, key, {
                // 很遗憾，在vuex中不能使用computed实现，因为如果组件销毁了会移除计算属性 3.2中会修复的
                get: ()=> fn(store.state)
            })
        })

        store._mutations = Object.create(null)
        store._actions = Object.create(null)

        const _mutations = options.mutations;
        const _actions = options.actions;
        forEachValue(_mutations, (mutation, key)=>{
            store._mutations[key] = (payload) => {
                mutation.call(store, store.state, payload)
            }
        })

        forEachValue(_actions, (action, key)=>{
            store._actions[key] = (payload) => {
                action.call(store, store.state, payload)
            }
        })

    }

    commit = (type, payload) => {
        this._mutations[type](payload)
    }

    dispatch = (type, payload) => {
        this._actions[type](payload)
    }

    get state(){ 
        return this._state.data
    }

    install(app, injectKey){  // createApp().use(store, 'my')
        // 全局暴露一个 变量，暴露的是store的实例
        app.provide(injectKey || storeKey, this)

        // Vue2.x Vue.prototype.$store = this
        app.config.globalProperties.$store = this; // 增添$store属性 使得可以直接在模板中使用 $store.state.count

    }
}