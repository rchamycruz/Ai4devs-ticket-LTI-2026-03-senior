import { ValidationError } from '../domain/models/ValidationError';

const NAME_PATTERN = /^[a-zA-ZÀ-ÿ\s'-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[679]\d{8}$/;
const MAX_EDUCATIONS = 3;

export function validateCandidateData(data: any): void {
    if (!data.firstName || typeof data.firstName !== 'string') {
        throw new ValidationError('firstName is required');
    }
    if (data.firstName.length < 2 || data.firstName.length > 100) {
        throw new ValidationError('firstName must be between 2 and 100 characters');
    }
    if (!NAME_PATTERN.test(data.firstName)) {
        throw new ValidationError('firstName contains invalid characters');
    }

    if (!data.lastName || typeof data.lastName !== 'string') {
        throw new ValidationError('lastName is required');
    }
    if (data.lastName.length < 2 || data.lastName.length > 100) {
        throw new ValidationError('lastName must be between 2 and 100 characters');
    }
    if (!NAME_PATTERN.test(data.lastName)) {
        throw new ValidationError('lastName contains invalid characters');
    }

    if (!data.email || typeof data.email !== 'string') {
        throw new ValidationError('email is required');
    }
    if (!EMAIL_PATTERN.test(data.email)) {
        throw new ValidationError('email format is invalid');
    }

    if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
        if (!PHONE_PATTERN.test(data.phone)) {
            throw new ValidationError('phone must be a valid Spanish phone number (e.g. 612345678)');
        }
    }

    if (data.address !== undefined && data.address !== null) {
        if (data.address.length > 100) {
            throw new ValidationError('address cannot exceed 100 characters');
        }
    }

    if (data.educations !== undefined) {
        if (!Array.isArray(data.educations)) {
            throw new ValidationError('educations must be an array');
        }
        if (data.educations.length > MAX_EDUCATIONS) {
            throw new ValidationError(`A candidate cannot have more than ${MAX_EDUCATIONS} education records`);
        }
        data.educations.forEach((edu: any, index: number) => {
            if (!edu.institution || typeof edu.institution !== 'string') {
                throw new ValidationError(`educations[${index}].institution is required`);
            }
            if (edu.institution.length > 100) {
                throw new ValidationError(`educations[${index}].institution cannot exceed 100 characters`);
            }
            if (!edu.title || typeof edu.title !== 'string') {
                throw new ValidationError(`educations[${index}].title is required`);
            }
            if (edu.title.length > 250) {
                throw new ValidationError(`educations[${index}].title cannot exceed 250 characters`);
            }
            if (!edu.startDate) {
                throw new ValidationError(`educations[${index}].startDate is required`);
            }
            if (isNaN(new Date(edu.startDate).getTime())) {
                throw new ValidationError(`educations[${index}].startDate is not a valid date`);
            }
            if (edu.endDate !== undefined && edu.endDate !== null) {
                if (isNaN(new Date(edu.endDate).getTime())) {
                    throw new ValidationError(`educations[${index}].endDate is not a valid date`);
                }
            }
        });
    }

    if (data.workExperiences !== undefined) {
        if (!Array.isArray(data.workExperiences)) {
            throw new ValidationError('workExperiences must be an array');
        }
        data.workExperiences.forEach((exp: any, index: number) => {
            if (!exp.company || typeof exp.company !== 'string') {
                throw new ValidationError(`workExperiences[${index}].company is required`);
            }
            if (exp.company.length > 100) {
                throw new ValidationError(`workExperiences[${index}].company cannot exceed 100 characters`);
            }
            if (!exp.position || typeof exp.position !== 'string') {
                throw new ValidationError(`workExperiences[${index}].position is required`);
            }
            if (exp.position.length > 100) {
                throw new ValidationError(`workExperiences[${index}].position cannot exceed 100 characters`);
            }
            if (!exp.startDate) {
                throw new ValidationError(`workExperiences[${index}].startDate is required`);
            }
            if (isNaN(new Date(exp.startDate).getTime())) {
                throw new ValidationError(`workExperiences[${index}].startDate is not a valid date`);
            }
            if (exp.endDate !== undefined && exp.endDate !== null) {
                if (isNaN(new Date(exp.endDate).getTime())) {
                    throw new ValidationError(`workExperiences[${index}].endDate is not a valid date`);
                }
            }
            if (exp.description !== undefined && exp.description !== null) {
                if (exp.description.length > 200) {
                    throw new ValidationError(`workExperiences[${index}].description cannot exceed 200 characters`);
                }
            }
        });
    }

    if (data.cv !== undefined && data.cv !== null) {
        if (!data.cv.filePath || !data.cv.fileType) {
            throw new ValidationError('cv must include both filePath and fileType');
        }
    }
}
