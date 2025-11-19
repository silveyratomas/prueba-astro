import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadRouter = Router();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(process.cwd(), 'public', 'uploads');
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'avatar-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'));
        }
    }
});

// POST /api/upload/avatar
uploadRouter.post('/avatar', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo' });
        }

        // Construct URL
        // Assuming the frontend can access /uploads/... via Astro or we serve it via Express
        // Let's return a relative URL that works if public/ is served
        const fileUrl = `/uploads/${req.file.filename}`;

        res.json({ url: fileUrl });
    } catch (e) {
        console.error('[upload] error', e);
        res.status(500).json({ error: 'Error al subir archivo' });
    }
});

export default uploadRouter;
