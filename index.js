
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
        //console.log('_r',offset)
        let routes = this._routes.filter((route)=>route.match(request))
        //console.log(routes)
        if(offset < routes.length){
            let route = routes[offset]
            route.load(request,callback,this._route.bind(this,offset+1,request,callback,next))
        }else{
            next()
        }
    }
    readdir(path,callback){
        this._routes.push(new Route(path,'readdir',true,callback))
    }
    getattr(path,callback){
        this._routes.push(new Route(path,'getattr',true,callback))
    }
    read(path,callback){
        this._routes.push(new Route(path,'read',true,callback))
    }
    write(path,callback){
        this._routes.push(new Route(path,'write',true,callback))
    }
    open(path,callback){
        this._routes.push(new Route(path,'open',true,callback))
    }
    truncate(path,callback){
        this._routes.push(new Route(path,'truncate',true,callback))
    }
    use(path,callback){
        this._routes.push(new Route(path,undefined,false,callback))
    }
}
class Route {
    constructor(path,methord,full=true,handle){
        this.path = path;
        this.methord = methord;
        this.handle = handle;
        this.keys = []
        this.re = pathToRegexp(this.path, this.keys,{
            end:full
        })
    }
    match(request){
        if(this.methord && this.methord !== request.methord){
            return false;
        }
        let match = this.re.exec(request.path)
        return match !== null;
    }
    getRequestProps(request){
        let match = this.re.exec(request.path)
        //let path = match.join()
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
    load(request,callback,next){
        let newRequest = Object.assign({},request,this.getRequestProps(request))
        this.handle(newRequest,callback,next)
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
                    methord:'readdir',
                    path,
                    params:{}
                },callback,()=>{
                    callback(fuse.ENOSYS)
                })
            },
            getattr(path,callback){
                self.route({
                    methord:'getattr',
                    path,
                    params:{}
                },callback,()=>{
                    callback(fuse.ENOSYS)
                })
            },
            truncate(path,size,callback){
                self.route({
                    methord:'truncate',
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
                    methord:'write',
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
                    methord:'read',
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
                    methord:'open',
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