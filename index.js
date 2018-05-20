
const fuse = require('fuse-bindings')
var pathToRegexp = require('path-to-regexp')

class Router {
    constructor(){
        this._routes = []
        this.route = this.route.bind(this)
    }
    route(request,callback,next){
        if(request.path.charAt(0) !== '/'){
            request.path = '/'+request.path
        }
        this._route(undefined,request,callback,next)
    }
    _route(offset = 0,request,callback,next){
        let routes = this._routes.filter((route)=> route.match(request));
        if(offset < routes.length){
            let route = routes[offset]
            route.load(request,callback,this._route.bind(this,offset+1,request,callback,next))
        }else{
            next()
        }
    }
    readdir(path,...callbacks){
        this._routes.push(new Route(path,'readdir',true,callbacks))
    }
    getattr(path,...callbacks){
        this._routes.push(new Route(path,'getattr',true,callbacks))
    }
    read(path,...callbacks){
        this._routes.push(new Route(path,'read',true,callbacks))
    }
    write(path,...callbacks){
        this._routes.push(new Route(path,'write',true,callbacks))
    }
    open(path,...callbacks){
        this._routes.push(new Route(path,'open',true,callbacks))
    }
    truncate(path,...callbacks){
        this._routes.push(new Route(path,'truncate',true,callbacks))
    }
    use(path,...callbacks){
        this._routes.push(new Route(path,undefined,false,callbacks))
    }
}
class Route {
    constructor(path,method,full=true,handles=[]){
        if(typeof path == 'function'){
            handles.unshift(path)
            path = undefined;
        }
        this.path = path;
        this.method = method;
        this.handles = handles;
        this.keys = []
        if(this.path){
            this.re = pathToRegexp(this.path, this.keys,{
                end:full
            })
        }
    }
    match(request){
        if(this.method && this.method !== request.method){
            return false;
        }
        if(this.path !== undefined){
            let match = this.re.exec(request.path)
            return match !== null;
        }else{
            return true;
        }
    }
    getRequestProps(request){
        if(this.path === undefined){
            return {
                params:{},
                path:request.path
            }
        }else {
            let match = this.re.exec(request.path)
            let params = {}
            let path =match.shift()
            delete match['index']
            delete match['input']
            for(let i in match){
                params[this.keys[i].name] = match[i]
            }
            return {
                path:request.path.substring(path.length),
                params
            }
        }

    }
    load(request,callback,next){
        let newRequest = Object.assign({},request,this.getRequestProps(request))
        this._load(0,newRequest,callback,next)
    }
    _load(offset=0,request,callback,next){
        if(offset < this.handles.length){
            this.handles[offset](request,callback,this._load.bind(this,offset+1,request,callback,next))
        }else{
            next()
        }
    }
}
class FUSERouter extends Router {
    constructor(){
        super()
    }
    start(mountPath){
        let self = this;
        fuse.mount(mountPath, {
            readdir (path, callback) {
                self.route({
                    method:'readdir',
                    path,
                    params:{}
                },callback,()=>{
                    callback(fuse.ENOSYS)
                })
            },
            getattr(path,callback){
                self.route({
                    method:'getattr',
                    path,
                    params:{}
                },callback,()=>{
                    callback(fuse.ENOSYS)
                })
            },
            truncate(path,size,callback){
                self.route({
                    method:'truncate',
                    properties:{
                        size
                    },
                    path,
                    params:{}
                },callback,()=>{
                    callback(fuse.ENOSYS)
                })
            },
            write(path,fileDescriptor,buffer,length,position,callback){
                self.route({
                    method:'write',
                    properties:{
                        fileDescriptor,
                        buffer,
                        length,
                        position
                    },
                    path,
                    params:{}
                },callback,()=>{
                    callback(fuse.ENOSYS)
                })
            },
            read(path,fileDescriptor,buffer,length,position,callback){
                self.route({
                    method:'read',
                    path,
                    properties:{
                        fileDescriptor,
                        buffer,
                        length,
                        position
                    },
                    params:{}
                },callback,()=>{
                    callback(fuse.ENOSYS)
                })
            },
            open(path,flags,callback){
                self.route({
                    method:'open',
                    path,
                    properties:{
                        flags,
                    },
                    params:{}
                },callback,()=>{
                    callback(fuse.ENOSYS)
                })
            }
        }, function (err) {
            if (err) throw err
            console.log('filesystem mounted on ' + mountPath)
        })
    }
}
module.exports = FUSERouter
module.exports.Router = Router