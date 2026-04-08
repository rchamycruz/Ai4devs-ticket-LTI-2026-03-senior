import { Request, Response, NextFunction } from 'express';
import express from 'express';
import dotenv from 'dotenv';
import candidateRoutes from './routes/candidateRoutes';

dotenv.config();

export const app = express();

const port = 3010;

app.use(express.json());

app.get('/', (_req, res) => {
    res.send('Hola LTI!');
});

app.use('/', candidateRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.type('text/plain');
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
