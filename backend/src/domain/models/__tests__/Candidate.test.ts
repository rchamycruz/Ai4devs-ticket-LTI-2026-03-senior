import { Candidate } from '../Candidate';
import { Education } from '../Education';
import { WorkExperience } from '../WorkExperience';
import { Resume } from '../Resume';

jest.mock('../../../infrastructure/prismaClient', () => ({
    prisma: {
        candidate: {
            create: jest.fn(),
            findUnique: jest.fn(),
        },
    },
}));

import { prisma } from '../../../infrastructure/prismaClient';

const mockPrismaCreate = prisma.candidate.create as jest.Mock;
const mockPrismaFindUnique = prisma.candidate.findUnique as jest.Mock;

const validData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '612345678',
    address: '123 Main St',
    educations: [
        { institution: 'MIT', title: 'BSc Computer Science', startDate: '2015-09-01', endDate: '2019-06-01' },
    ],
    workExperiences: [
        { company: 'Acme Corp', position: 'Engineer', startDate: '2019-07-01', description: 'Backend dev' },
    ],
    resumes: [{ filePath: 'uploads/cv.pdf', fileType: 'application/pdf' }],
};

describe('Candidate constructor', () => {
    it('assigns scalar fields correctly', () => {
        const candidate = new Candidate(validData);
        expect(candidate.firstName).toBe('John');
        expect(candidate.lastName).toBe('Doe');
        expect(candidate.email).toBe('john.doe@example.com');
        expect(candidate.phone).toBe('612345678');
        expect(candidate.address).toBe('123 Main St');
    });

    it('maps educations to Education instances', () => {
        const candidate = new Candidate(validData);
        expect(candidate.educations).toHaveLength(1);
        expect(candidate.educations[0]).toBeInstanceOf(Education);
        expect(candidate.educations[0].institution).toBe('MIT');
    });

    it('maps workExperiences to WorkExperience instances', () => {
        const candidate = new Candidate(validData);
        expect(candidate.workExperiences).toHaveLength(1);
        expect(candidate.workExperiences[0]).toBeInstanceOf(WorkExperience);
        expect(candidate.workExperiences[0].company).toBe('Acme Corp');
    });

    it('maps resumes to Resume instances', () => {
        const candidate = new Candidate(validData);
        expect(candidate.resumes).toHaveLength(1);
        expect(candidate.resumes[0]).toBeInstanceOf(Resume);
        expect(candidate.resumes[0].filePath).toBe('uploads/cv.pdf');
    });

    it('defaults optional fields to undefined when null is provided', () => {
        const candidate = new Candidate({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: null,
            address: null,
        });
        expect(candidate.phone).toBeUndefined();
        expect(candidate.address).toBeUndefined();
    });

    it('defaults arrays to empty when not provided', () => {
        const candidate = new Candidate({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
        });
        expect(candidate.educations).toEqual([]);
        expect(candidate.workExperiences).toEqual([]);
        expect(candidate.resumes).toEqual([]);
    });
});

describe('Candidate.save()', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('calls prisma.candidate.create with correct nested structure and returns Candidate', async () => {
        const createdRecord = {
            id: 1,
            ...validData,
            educations: validData.educations.map((e, i) => ({ id: i + 1, ...e, candidateId: 1, endDate: new Date(e.endDate!) })),
            workExperiences: validData.workExperiences.map((w, i) => ({ id: i + 1, ...w, candidateId: 1, endDate: null })),
            resumes: validData.resumes.map((r, i) => ({ id: i + 1, ...r, candidateId: 1, uploadDate: new Date() })),
        };
        mockPrismaCreate.mockResolvedValue(createdRecord);

        const candidate = new Candidate(validData);
        const result = await candidate.save();

        expect(mockPrismaCreate).toHaveBeenCalledTimes(1);
        expect(mockPrismaCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john.doe@example.com',
                    educations: expect.objectContaining({ create: expect.any(Array) }),
                    workExperiences: expect.objectContaining({ create: expect.any(Array) }),
                    resumes: expect.objectContaining({ create: expect.any(Array) }),
                }),
                include: { educations: true, workExperiences: true, resumes: true },
            })
        );
        expect(result).toBeInstanceOf(Candidate);
        expect(result.id).toBe(1);
    });

    it('throws "Email already exists" when Prisma raises P2002', async () => {
        const prismaError = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
        mockPrismaCreate.mockRejectedValue(prismaError);

        const candidate = new Candidate(validData);
        await expect(candidate.save()).rejects.toThrow('Email already exists');
    });

    it('rethrows non-P2002 errors as-is', async () => {
        mockPrismaCreate.mockRejectedValue(new Error('Connection refused'));

        const candidate = new Candidate(validData);
        await expect(candidate.save()).rejects.toThrow('Connection refused');
    });
});

describe('Candidate.findOne()', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns null when candidate is not found', async () => {
        mockPrismaFindUnique.mockResolvedValue(null);
        const result = await Candidate.findOne(999);
        expect(result).toBeNull();
    });

    it('returns a Candidate instance when found', async () => {
        const record = {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: null,
            address: null,
            educations: [],
            workExperiences: [],
            resumes: [],
        };
        mockPrismaFindUnique.mockResolvedValue(record);
        const result = await Candidate.findOne(1);
        expect(result).toBeInstanceOf(Candidate);
        expect(result!.id).toBe(1);
        expect(result!.email).toBe('john@example.com');
    });

    it('calls findUnique with correct id and include', async () => {
        mockPrismaFindUnique.mockResolvedValue(null);
        await Candidate.findOne(42);
        expect(mockPrismaFindUnique).toHaveBeenCalledWith({
            where: { id: 42 },
            include: { educations: true, workExperiences: true, resumes: true },
        });
    });
});
