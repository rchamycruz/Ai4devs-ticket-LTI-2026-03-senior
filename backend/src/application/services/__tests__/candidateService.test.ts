import { addCandidate } from '../candidateService';
import { ValidationError } from '../../../domain/models/ValidationError';

jest.mock('../../validator');
jest.mock('../../../domain/models/Candidate');

import { validateCandidateData } from '../../validator';
import { Candidate } from '../../../domain/models/Candidate';

const mockValidate = validateCandidateData as jest.Mock;
const MockCandidate = Candidate as jest.MockedClass<typeof Candidate>;

const validInput = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
};

describe('addCandidate service', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('calls validateCandidateData with the input', async () => {
        const mockSave = jest.fn().mockResolvedValue({ id: 1, ...validInput });
        MockCandidate.mockImplementation(() => ({ save: mockSave } as any));

        await addCandidate(validInput);

        expect(mockValidate).toHaveBeenCalledWith(validInput);
    });

    it('creates a Candidate and calls save(), returning the result', async () => {
        const savedCandidate = { id: 1, ...validInput };
        const mockSave = jest.fn().mockResolvedValue(savedCandidate);
        MockCandidate.mockImplementation(() => ({ save: mockSave } as any));

        const result = await addCandidate(validInput);

        expect(MockCandidate).toHaveBeenCalledTimes(1);
        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(result).toEqual(savedCandidate);
    });

    it('re-throws error thrown by validator', async () => {
        const validationErr = new ValidationError('firstName is required');
        mockValidate.mockImplementation(() => { throw validationErr; });

        await expect(addCandidate({ ...validInput, firstName: undefined })).rejects.toThrow('firstName is required');
    });

    it('re-throws "Email already exists" from save()', async () => {
        const mockSave = jest.fn().mockRejectedValue(new Error('Email already exists'));
        MockCandidate.mockImplementation(() => ({ save: mockSave } as any));

        await expect(addCandidate(validInput)).rejects.toThrow('Email already exists');
    });

    it('maps cv to resumes array in Candidate constructor call', async () => {
        const inputWithCv = {
            ...validInput,
            cv: { filePath: 'uploads/cv.pdf', fileType: 'application/pdf' },
        };
        const mockSave = jest.fn().mockResolvedValue({ id: 1 });
        MockCandidate.mockImplementation(() => ({ save: mockSave } as any));

        await addCandidate(inputWithCv);

        expect(MockCandidate).toHaveBeenCalledWith(
            expect.objectContaining({
                resumes: [{ filePath: 'uploads/cv.pdf', fileType: 'application/pdf' }],
            })
        );
    });

    it('defaults educations, workExperiences and resumes to empty arrays when absent', async () => {
        const mockSave = jest.fn().mockResolvedValue({ id: 1 });
        MockCandidate.mockImplementation(() => ({ save: mockSave } as any));

        await addCandidate(validInput);

        expect(MockCandidate).toHaveBeenCalledWith(
            expect.objectContaining({
                educations: [],
                workExperiences: [],
                resumes: [],
            })
        );
    });
});
