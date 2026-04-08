import { Request, Response } from 'express';
import { addCandidate } from '../../application/services/candidateService';

export const addCandidateHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await addCandidate(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        if (error.name === 'ValidationError' || error.message === 'Email already exists') {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export const uploadFileHandler = (req: Request, res: Response): void => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    res.status(200).json({
        filePath: req.file.path,
        fileType: req.file.mimetype,
    });
};
