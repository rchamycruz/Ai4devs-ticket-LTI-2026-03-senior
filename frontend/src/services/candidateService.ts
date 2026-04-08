import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:3010';

export type EducationInput = {
    institution: string;
    title: string;
    startDate: string;
    endDate?: string;
};

export type WorkExperienceInput = {
    company: string;
    position: string;
    description?: string;
    startDate: string;
    endDate?: string;
};

export type CvInput = {
    filePath: string;
    fileType: string;
};

export type CreateCandidatePayload = {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    educations?: EducationInput[];
    workExperiences?: WorkExperienceInput[];
    cv?: CvInput;
};

export type CandidateResponse = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    address?: string | null;
};

export type UploadResponse = {
    filePath: string;
    fileType: string;
};

export const candidateService = {
    uploadCV: async (file: File): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post<UploadResponse>(`${API_BASE_URL}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    addCandidate: async (payload: CreateCandidatePayload): Promise<CandidateResponse> => {
        const response = await axios.post<CandidateResponse>(`${API_BASE_URL}/candidates`, payload);
        return response.data;
    },
};
