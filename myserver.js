const fastify = require('fastify') // or import fastify from 'fastify'
const multer = require('fastify-multer') // or import multer from 'fastify-multer'
    //https://github.com/fox1t/fastify-multer
    // base from https://github.com/expressjs/multer
const path = require('path')
const fs = require('fs')

let filenameGlobal

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      filenameGlobal = file.fieldname + '-' + uniqueSuffix + '.png'
      cb(null, file.fieldname + '-' + uniqueSuffix + '.png')
    }
})
  
const upload = multer({ storage: storage }) //({ dest: 'uploads/' })

const server = fastify()
// register fastify content parser
server.register(multer.contentParser)
server.register(require('@fastify/url-data'))
    //https://github.com/fastify/fastify-url-data
server.register(require('@chonla/fastify-qrcode'))
    //https://github.com/chonla/fastify-qrcode
    // base from https://github.com/soldair/node-qrcode
server.register(require('@fastify/static'), {
    root: path.join(__dirname, 'uploads'),
    prefix: '/uploads/', // optional: default '/'
})
    //https://github.com/fastify/fastify-static

function fullUrl(req) {
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),
        pathname: req.originalUrl
    });
}

server.get('/uploads/:imagename', function (request, reply) {
    const { imagename } = request.params
    if (!imagename) {
        reply
            .code(400)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send({ status: 0, message: 'please enter photo-name' })
    } else {
        fs.access('uploads/'+imagename, fs.F_OK, (err) => {
            if (err) {
                reply
                    .code(400)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send({ status: 0, message: 'photo not found' })
            } else {
                //file exists
                const urlData = request.urlData()
                const fullPhotoUrl = `${urlData.scheme}://${urlData.host}:${urlData.port}/uploads/${imagename}`;
                // reply
                //     .code(200)
                //     .header('Content-Type', 'application/json; charset=utf-8')
                //     .send({ status: 1, url: fullPhotoUrl })
                return reply.sendFile(imagename) // serving path.join(__dirname, 'public', 'myHtml.html') directly
            }
        })
    }
})

// or using the short hand declaration
server.post(
  '/upload_photo',
  { preHandler: upload.single('photo') },
  function(request, reply) {
    // request.file is the `avatar` file
    // request.body will hold the text fields, if there were any
    const file = request.file
    if (!file) {
        reply
            .code(400)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send({ status: 0, message: 'Please upload a file' })
    } else{
        const urlData = request.urlData()
        const fullPhotoUrl = `${urlData.scheme}://${urlData.host}:${urlData.port}/uploads/${filenameGlobal}`;
        console.log('full url 2='+fullPhotoUrl)

        // Generate qrcode
        server.qrcode.toDataURL(fullPhotoUrl, (error, base64) => {
            if (error) {
                reply
                    .code(400)
                    .header('Content-Type', 'application/json; charset=utf-8')
                    .send({ status: 0, message: 'error in generating QR code' })
            } else {
                reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send({ status: 1, message: 'Your file uploaded successfully', base64QR: base64 })
            }
        })
        
    }
  }
)
// server-errors shows like this in postman
// {
//     "statusCode": 500,
//     "error": "Internal Server Error",
//     "message": "req is not defined"
// }
// {
//     "statusCode": 500,
//     "error": "Internal Server Error",
//     "message": "Cannot access 'fullPhotoUrl' before initialization"
// }

// server.route({
//   method: 'POST',
//   url: '/profile',
//   preHandler: upload.single('avatar'),
//   handler: function(request, reply) {
//     // request.file is the `avatar` file
//     // request.body will hold the text fields, if there were any
//     reply.code(200).send('SUCCESS')
//   }
// })

// server.route({
//   method: 'POST',
//   url: '/photos/upload',
//   preHandler: upload.array('photos', 12),
//   handler: function(request, reply) {
//     // request.files is array of `photos` files
//     // request.body will contain the text fields, if there were any
//     reply.code(200).send('SUCCESS')
//   }
// })

// const cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
// server.route({
//   method: 'POST',
//   url: '/cool-profile',
//   preHandler: cpUpload,
//   handler: function(request, reply) {
//     // request.files is an object (String -> Array) where fieldname is the key, and the value is array of files
//     //
//     // e.g.
//     //  request.files['avatar'][0] -> File
//     //  request.files['gallery'] -> Array
//     //
//     // request.body will contain the text fields, if there were any
//     reply.code(200).send('SUCCESS')
//   }
// })

//const PORT = process.env.PORT || 5000;

// Run the server!
server.listen(process.env.PORT, function (err, address) {
    if (err) {
      server.log.error(err)
      process.exit(1)
    }
    // Server is now listening on ${address}
})