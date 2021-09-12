import { storeKey } from './injectKey';
import ModuleCollection from './module/module-collection';


function installModule(store, rootState, path, module) { // 递归安装
    let isRoot = !path.length;  // 如果数组是空数组 说明是根，否则不是

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

    if(!isRoot){
        let parentState = path.slice(0, -1).reduce((state, key)=> state[key], rootState)
        parentState[path[path.length - 1]] = module.state
    }

    module.forEachValue((child, key)=>{
        installModule(store, rootState, path.concat(key), child)
    })

}
// 创建容器  返回store
export default class Store {
    constructor(options){
        // { state, mutations, actions, modules }
        const store = this;
        // 收集，模块
        store._modules = new ModuleCollection(options)

        // 定义状态
        const state = store._modules.root.state; // 根状态

        installModule(store, state, [], store._modules.root);

    }

    install(app, injectKey){  // createApp().use(store, 'my')
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