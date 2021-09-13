import { forEachValue } from "../utils";

export default class ModuleCollection{
    constructor(rootModule){
        this.root = null;
        this.register(rootModule, [])
    }

    register(rawModule, path){
        const newModule = new Module(rawModule)

        if(path.length == 0){
            // 是一个根模块
            this.root = newModule;
        }else{ // path = [a]   =>  path.slice(0, -1) = []
            // 获取path中除了最后一项的前面几项， 从root开始向下获取child
            const parent = path.slice(0, -1).reduce((module, current)=>{
                return module.getChild(current)
            }, this.root)

            // 当前path中的最后一项就是 当前模块的key
            parent.addChild(path[path.length - 1], newModule)
        }

        // 如果用户传入的含有 modules属性，说明是一个子模块
        if(rawModule.modules){
            forEachValue(rawModule.modules, (rawChildModule, key)=>{
                // 递归注册子模块
                this.register(rawChildModule, path.concat(key))
            })
        }
    }

    getNamespaced(path){
        let module = this.root;
        return path.reduce((nameSpaceStr, key)=>{ // [a,c] => a/c
            module = module.getChild(key);  // 获取子模块
            return nameSpaceStr + (module.namespaced ? key + "/" : "")
        },"")
    }
}

// 深度优先

// 先注册 root 模块
// 然后遍历 root 的modules属性，
// 开始注册a模块  path = [a]  =>  path.slice(0, -1) = []  => parent = this.root
// a模块注册到 root._children = {a}
// a模块注册完成后 开始遍历a的modules属性
// 开始递归注册 c模块, path = [a, c] =>  path.slice(0, -1) = [a]  => parent = this.root.getChild(a) = a
// 将c模块注册到a的子模块上 a._children = {c}
// 弹出调用栈
// 开始注册b模块， path = [b]  path.slice(0, -1) = []  => parent = this.root
// register(a)
//     register(a/c)
// register(b)


// {
// root
//     modules: {
//         a: {
//             modules: {
//                 c: {}
//             }
//         },
//         b: {}
//     }
// }

// 格式化用户的参数，实现根据自己的需要，后续使用时方便

// root = {
//     _raw:rootModule,
//     state:rootModule.state, // 用户管理 
//     _children:{
//         a:{ // > 1
//             _raw:aModule,
//             state:aModule.state,
//             _children:{ // > 1
//                 c:{
//                     _raw:useCssModule,
//                     state:cModule.state,
//                     _children:{}
//                 }
//             }
//         },
//         b:{
//             _raw:bModule,
//             state:bModule.state,
//             _children:{}
//         }
//     }
// }