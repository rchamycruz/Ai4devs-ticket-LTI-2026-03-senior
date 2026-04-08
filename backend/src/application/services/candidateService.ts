import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';

export const addCandidate = async (candidateData: any): Promise<Candidate> => {
    validateCandidateData(candidateData);

    const candidate = new Candidate({
        firstName: candidateData.firstName,
        lastName: candidateData.lastName,
        email: candidateData.email,
        phone: candidateData.phone,
        address: candidateData.address,
        educations: candidateData.educations ?? [],
        workExperiences: candidateData.workExperiences ?? [],
        resumes: candidateData.cv ? [candidateData.cv] : [],
    });

    return candidate.save();
};
