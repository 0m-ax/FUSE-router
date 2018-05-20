const FUSERouter = require('./index')
let app = new FUSERouter()
// // log the request object
// app.use('/', function (req, cb, next) {
//     console.log(req)
//     next()
// })

//let cool = new FUSERouter.Router()

// return info about the root directory
app.getattr('/', function (req, cb) {
    cb(0, {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        nlink: 1,
        size: 100,
        mode: 16877,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0
    })
})
// return list of files in directory
app.readdir('/', function (req, cb,next) {
    console.log('meme')
    next()
}, function (req, cb) {
    console.log('yes')
    cb(0, ['afile.txt'])
})
//app.use('/',cool.route)
let afile = new FUSERouter.Router()

// return info about the file
afile.getattr( function (req, cb) {
    cb(0, {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        nlink: 1,
        size: 'hello world\n'.length,
        mode: 33188,
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0
    })
})
// return contents of the file
afile.read( function (req, cb) {
    console.log(req)
    var str = 'hello world\n'.slice(req.properties.position, req.properties.position + req.properties.length)
    if (!str) return cb(0)
    console.log(str.length)
    req.properties.buffer.write(str)
    return cb(str.length)
})
// allow the OS to open the file
afile.open( function (req, cb) {
    cb(0, 42) // 42 is an fd
})
afile.truncate(function (req, cb) {
    cb(0)
})
afile.write(function (req, cb) {
    cb(req.properties.length)
})
app.use('/afile.txt',afile.route)
// mount the file system on ./test
app.start('./test')

// resurse
//app.use('/no',app.route)