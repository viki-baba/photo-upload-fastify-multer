API for upload photo & that will give you QR code in base64 format

API route: url/upload_photo
method: POST
request: form-data parameter:
    key:photo
    value: image/photo that you want to upload
response:
    success: 1
    message: "Your file uploaded successfully"
    base64QR: QR code image in base64

Plugin used in this project is based on fastify-multer
& fastify-multer is based on expressjs/multer
fastify-qrcode plugin used to generate QR code image.