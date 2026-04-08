import { validateCandidateData } from '../validator';

const validPayload = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
};

describe('validateCandidateData', () => {
    describe('firstName', () => {
        it('passes with valid firstName', () => {
            expect(() => validateCandidateData(validPayload)).not.toThrow();
        });

        it('throws when firstName is missing', () => {
            expect(() => validateCandidateData({ ...validPayload, firstName: undefined })).toThrow('firstName is required');
        });

        it('throws when firstName is empty string', () => {
            expect(() => validateCandidateData({ ...validPayload, firstName: '' })).toThrow('firstName is required');
        });

        it('throws when firstName is too short', () => {
            expect(() => validateCandidateData({ ...validPayload, firstName: 'A' })).toThrow('firstName must be between 2 and 100 characters');
        });

        it('throws when firstName is too long', () => {
            expect(() => validateCandidateData({ ...validPayload, firstName: 'A'.repeat(101) })).toThrow('firstName must be between 2 and 100 characters');
        });

        it('throws when firstName contains invalid characters', () => {
            expect(() => validateCandidateData({ ...validPayload, firstName: 'John123' })).toThrow('firstName contains invalid characters');
        });

        it('accepts firstName with accented chars and hyphens', () => {
            expect(() => validateCandidateData({ ...validPayload, firstName: "María-José" })).not.toThrow();
        });
    });

    describe('lastName', () => {
        it('throws when lastName is missing', () => {
            expect(() => validateCandidateData({ ...validPayload, lastName: undefined })).toThrow('lastName is required');
        });

        it('throws when lastName is too short', () => {
            expect(() => validateCandidateData({ ...validPayload, lastName: 'X' })).toThrow('lastName must be between 2 and 100 characters');
        });

        it('throws when lastName contains invalid characters', () => {
            expect(() => validateCandidateData({ ...validPayload, lastName: 'Doe#99' })).toThrow('lastName contains invalid characters');
        });
    });

    describe('email', () => {
        it('throws when email is missing', () => {
            expect(() => validateCandidateData({ ...validPayload, email: undefined })).toThrow('email is required');
        });

        it('throws when email has invalid format', () => {
            expect(() => validateCandidateData({ ...validPayload, email: 'not-an-email' })).toThrow('email format is invalid');
        });

        it('throws when email has spaces', () => {
            expect(() => validateCandidateData({ ...validPayload, email: 'john doe@example.com' })).toThrow('email format is invalid');
        });
    });

    describe('phone', () => {
        it('passes when phone is absent', () => {
            expect(() => validateCandidateData(validPayload)).not.toThrow();
        });

        it('passes when phone is null', () => {
            expect(() => validateCandidateData({ ...validPayload, phone: null })).not.toThrow();
        });

        it('passes with valid Spanish phone starting with 6', () => {
            expect(() => validateCandidateData({ ...validPayload, phone: '612345678' })).not.toThrow();
        });

        it('passes with valid Spanish phone starting with 7', () => {
            expect(() => validateCandidateData({ ...validPayload, phone: '712345678' })).not.toThrow();
        });

        it('passes with valid Spanish phone starting with 9', () => {
            expect(() => validateCandidateData({ ...validPayload, phone: '912345678' })).not.toThrow();
        });

        it('throws when phone starts with invalid digit', () => {
            expect(() => validateCandidateData({ ...validPayload, phone: '512345678' })).toThrow('phone must be a valid Spanish phone number');
        });

        it('throws when phone has wrong length', () => {
            expect(() => validateCandidateData({ ...validPayload, phone: '6123456' })).toThrow('phone must be a valid Spanish phone number');
        });
    });

    describe('address', () => {
        it('passes when address is absent', () => {
            expect(() => validateCandidateData(validPayload)).not.toThrow();
        });

        it('throws when address exceeds 100 characters', () => {
            expect(() => validateCandidateData({ ...validPayload, address: 'A'.repeat(101) })).toThrow('address cannot exceed 100 characters');
        });

        it('passes with address of exactly 100 chars', () => {
            expect(() => validateCandidateData({ ...validPayload, address: 'A'.repeat(100) })).not.toThrow();
        });
    });

    describe('educations', () => {
        const validEducation = {
            institution: 'MIT',
            title: 'BSc Computer Science',
            startDate: '2015-09-01',
        };

        it('passes with a valid education record', () => {
            expect(() => validateCandidateData({ ...validPayload, educations: [validEducation] })).not.toThrow();
        });

        it('throws when educations is not an array', () => {
            expect(() => validateCandidateData({ ...validPayload, educations: 'MIT' })).toThrow('educations must be an array');
        });

        it('throws when more than 3 education records are provided', () => {
            const educations = Array(4).fill(validEducation);
            expect(() => validateCandidateData({ ...validPayload, educations })).toThrow('A candidate cannot have more than 3 education records');
        });

        it('throws when institution exceeds 100 characters', () => {
            expect(() => validateCandidateData({ ...validPayload, educations: [{ ...validEducation, institution: 'X'.repeat(101) }] }))
                .toThrow('educations[0].institution cannot exceed 100 characters');
        });

        it('throws when title exceeds 250 characters', () => {
            expect(() => validateCandidateData({ ...validPayload, educations: [{ ...validEducation, title: 'X'.repeat(251) }] }))
                .toThrow('educations[0].title cannot exceed 250 characters');
        });

        it('throws when institution is missing', () => {
            expect(() => validateCandidateData({ ...validPayload, educations: [{ ...validEducation, institution: undefined }] }))
                .toThrow('educations[0].institution is required');
        });

        it('throws when title is missing', () => {
            expect(() => validateCandidateData({ ...validPayload, educations: [{ ...validEducation, title: undefined }] }))
                .toThrow('educations[0].title is required');
        });

        it('throws when startDate is missing', () => {
            expect(() => validateCandidateData({ ...validPayload, educations: [{ ...validEducation, startDate: undefined }] }))
                .toThrow('educations[0].startDate is required');
        });

        it('throws when startDate is invalid', () => {
            expect(() => validateCandidateData({ ...validPayload, educations: [{ ...validEducation, startDate: 'not-a-date' }] }))
                .toThrow('educations[0].startDate is not a valid date');
        });

        it('throws when endDate is invalid', () => {
            expect(() => validateCandidateData({ ...validPayload, educations: [{ ...validEducation, endDate: 'bad-date' }] }))
                .toThrow('educations[0].endDate is not a valid date');
        });

        it('passes with null endDate (ongoing)', () => {
            expect(() => validateCandidateData({ ...validPayload, educations: [{ ...validEducation, endDate: null }] })).not.toThrow();
        });
    });

    describe('workExperiences', () => {
        const validExp = {
            company: 'Acme',
            position: 'Engineer',
            startDate: '2020-01-01',
        };

        it('throws when workExperiences is not an array', () => {
            expect(() => validateCandidateData({ ...validPayload, workExperiences: 'Acme' })).toThrow('workExperiences must be an array');
        });

        it('passes with valid work experience', () => {
            expect(() => validateCandidateData({ ...validPayload, workExperiences: [validExp] })).not.toThrow();
        });

        it('throws when company exceeds 100 characters', () => {
            expect(() => validateCandidateData({ ...validPayload, workExperiences: [{ ...validExp, company: 'X'.repeat(101) }] }))
                .toThrow('workExperiences[0].company cannot exceed 100 characters');
        });

        it('throws when position exceeds 100 characters', () => {
            expect(() => validateCandidateData({ ...validPayload, workExperiences: [{ ...validExp, position: 'X'.repeat(101) }] }))
                .toThrow('workExperiences[0].position cannot exceed 100 characters');
        });

        it('throws when startDate is not a valid date string', () => {
            expect(() => validateCandidateData({ ...validPayload, workExperiences: [{ ...validExp, startDate: 'not-a-date' }] }))
                .toThrow('workExperiences[0].startDate is not a valid date');
        });

        it('throws when endDate is not a valid date string', () => {
            expect(() => validateCandidateData({ ...validPayload, workExperiences: [{ ...validExp, endDate: 'bad-date' }] }))
                .toThrow('workExperiences[0].endDate is not a valid date');
        });

        it('throws when company is missing', () => {
            expect(() => validateCandidateData({ ...validPayload, workExperiences: [{ ...validExp, company: undefined }] }))
                .toThrow('workExperiences[0].company is required');
        });

        it('throws when position is missing', () => {
            expect(() => validateCandidateData({ ...validPayload, workExperiences: [{ ...validExp, position: undefined }] }))
                .toThrow('workExperiences[0].position is required');
        });

        it('throws when startDate is missing', () => {
            expect(() => validateCandidateData({ ...validPayload, workExperiences: [{ ...validExp, startDate: undefined }] }))
                .toThrow('workExperiences[0].startDate is required');
        });

        it('throws when description exceeds 200 characters', () => {
            expect(() => validateCandidateData({ ...validPayload, workExperiences: [{ ...validExp, description: 'x'.repeat(201) }] }))
                .toThrow('workExperiences[0].description cannot exceed 200 characters');
        });
    });

    describe('cv', () => {
        it('passes with valid cv object', () => {
            expect(() => validateCandidateData({ ...validPayload, cv: { filePath: 'uploads/cv.pdf', fileType: 'application/pdf' } })).not.toThrow();
        });

        it('throws when cv has filePath but no fileType', () => {
            expect(() => validateCandidateData({ ...validPayload, cv: { filePath: 'uploads/cv.pdf' } }))
                .toThrow('cv must include both filePath and fileType');
        });

        it('throws when cv has fileType but no filePath', () => {
            expect(() => validateCandidateData({ ...validPayload, cv: { fileType: 'application/pdf' } }))
                .toThrow('cv must include both filePath and fileType');
        });

        it('passes when cv is absent', () => {
            expect(() => validateCandidateData(validPayload)).not.toThrow();
        });
    });
});
