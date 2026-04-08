import { prisma } from '../../infrastructure/prismaClient';
import { Education } from './Education';
import { WorkExperience } from './WorkExperience';
import { Resume } from './Resume';

export class Candidate {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    educations: Education[];
    workExperiences: WorkExperience[];
    resumes: Resume[];

    constructor(data: {
        id?: number;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string | null;
        address?: string | null;
        educations?: any[];
        workExperiences?: any[];
        resumes?: any[];
    }) {
        this.id = data.id;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.email = data.email;
        this.phone = data.phone ?? undefined;
        this.address = data.address ?? undefined;
        this.educations = (data.educations ?? []).map((e) => new Education(e));
        this.workExperiences = (data.workExperiences ?? []).map((w) => new WorkExperience(w));
        this.resumes = (data.resumes ?? []).map((r) => new Resume(r));
    }

    async save(): Promise<Candidate> {
        try {
            const result = await prisma.candidate.create({
                data: {
                    firstName: this.firstName,
                    lastName: this.lastName,
                    email: this.email,
                    phone: this.phone,
                    address: this.address,
                    educations: {
                        create: this.educations.map((e) => ({
                            institution: e.institution,
                            title: e.title,
                            startDate: e.startDate,
                            endDate: e.endDate,
                        })),
                    },
                    workExperiences: {
                        create: this.workExperiences.map((w) => ({
                            company: w.company,
                            position: w.position,
                            description: w.description,
                            startDate: w.startDate,
                            endDate: w.endDate,
                        })),
                    },
                    resumes: {
                        create: this.resumes.map((r) => ({
                            filePath: r.filePath,
                            fileType: r.fileType,
                            uploadDate: r.uploadDate,
                        })),
                    },
                },
                include: {
                    educations: true,
                    workExperiences: true,
                    resumes: true,
                },
            });
            return new Candidate(result);
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    static async findOne(id: number): Promise<Candidate | null> {
        const data = await prisma.candidate.findUnique({
            where: { id },
            include: {
                educations: true,
                workExperiences: true,
                resumes: true,
            },
        });
        return data ? new Candidate(data) : null;
    }
}
