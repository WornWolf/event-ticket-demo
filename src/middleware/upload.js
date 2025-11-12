const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowFileTypes = /jpeg|jpg|png|gif|webp/
    const mimetype = allowFileTypes.test(file.mimetype);
    const extname = allowFileTypes.test(
        path.extname(file.originalname).toLowerCase()
    )

    if(mimetype && extname){
        return cb(null, true);
    }

    cb(
        new Error (
            "Error: file upload only supports the following filetypes - " + allowFileTypes
        )
    )
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {fileSize: 5 * 1024 * 1024}
})

module.exports = upload