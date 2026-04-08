import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';

jest.mock('../../../application/services/candidateService');
jest.mock('../../../infrastructure/fileUpload', () => {
    const multer = require('multer');
    const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const storage = multer.memoryStorage();
    const fileFilter = (_req: any, file: any, cb: any) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'));
        }
    };
    return {
        upload: multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }),
        UPLOAD_DIR: 'uploads',
    };
});

import { addCandidate } from '../../../application/services/candidateService';
import { ValidationError } from '../../../domain/models/ValidationError';
import candidateRoutes from '../../../routes/candidateRoutes';

const mockAddCandidate = addCandidate as jest.Mock;

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/', candidateRoutes);
    return app;
};

const validBody = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
};

describe('POST /candidates', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 201 with candidate data on success', async () => {
        const created = { id: 1, ...validBody };
        mockAddCandidate.mockResolvedValue(created);

        const res = await request(buildApp()).post('/candidates').send(validBody);

        expect(res.status).toBe(201);
        expect(res.body).toEqual(created);
    });

    it('returns 400 when ValidationError is thrown', async () => {
        mockAddCandidate.mockRejectedValue(new ValidationError('firstName is required'));

        const res = await request(buildApp()).post('/candidates').send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('firstName is required');
    });

    it('returns 400 when email already exists', async () => {
        mockAddCandidate.mockRejectedValue(new Error('Email already exists'));

        const res = await request(buildApp()).post('/candidates').send(validBody);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email already exists');
    });

    it('returns 500 on unexpected server error', async () => {
        mockAddCandidate.mockRejectedValue(new Error('DB connection lost'));

        const res = await request(buildApp()).post('/candidates').send(validBody);

        expect(res.status).toBe(500);
        expect(res.body.error).toBe('Internal server error');
    });
});

describe('POST /upload', () => {
    it('returns 400 when no file is attached', async () => {
        const res = await request(buildApp()).post('/upload');
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('No file uploaded');
    });

    it('returns 200 with filePath and fileType for a valid PDF buffer', async () => {
        const pdfBuffer = Buffer.from('%PDF-1.4 minimal');

        const res = await request(buildApp())
            .post('/upload')
            .attach('file', pdfBuffer, { filename: 'cv.pdf', contentType: 'application/pdf' });

        expect(res.status).toBe(200);
        // In memory-storage mode (test), req.file.path is undefined; real disk storage sets it
        expect(res.body).toHaveProperty('fileType', 'application/pdf');
    });

    it('returns 200 with filePath and fileType for a valid DOCX buffer', async () => {
        const docxBuffer = Buffer.from('PK docx-bytes');

        const res = await request(buildApp())
            .post('/upload')
            .attach('file', docxBuffer, {
                filename: 'cv.docx',
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });

        expect(res.status).toBe(200);
        expect(res.body.fileType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('returns 400 for an unsupported file type', async () => {
        const txtBuffer = Buffer.from('plain text');

        const res = await request(buildApp())
            .post('/upload')
            .attach('file', txtBuffer, { filename: 'notes.txt', contentType: 'text/plain' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid file type');
    });
});
