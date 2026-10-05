import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
    fileFilter: (_req, file, callback) => {
        const allowed = new Set([
            "image/jpeg",
            "image/png",
            "image/webp",
        ]);

        if (!allowed.has(file.mimetype)) {
            return callback(new Error("Only JPG, PNG, and WEBP images are allowed"));
        }

        callback(null, true);
    },
});

export default upload;
