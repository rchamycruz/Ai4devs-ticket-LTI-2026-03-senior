import { Router, Request, Response, NextFunction } from 'express';
import { addCandidateHandler, uploadFileHandler } from '../presentation/controllers/candidateController';
import { upload } from '../infrastructure/fileUpload';

const router = Router();

router.post('/candidates', addCandidateHandler);

router.post(
    '/upload',
    (req: Request, res: Response, next: NextFunction) => {
        upload.single('file')(req, res, (err) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            next();
        });
    },
    uploadFileHandler
);

export default router;
