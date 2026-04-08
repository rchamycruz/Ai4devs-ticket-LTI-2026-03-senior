export class WorkExperience {
    id?: number;
    company: string;
    position: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    candidateId?: number;

    constructor(data: {
        id?: number;
        company: string;
        position: string;
        description?: string | null;
        startDate: string | Date;
        endDate?: string | Date | null;
        candidateId?: number;
    }) {
        this.id = data.id;
        this.company = data.company;
        this.position = data.position;
        this.description = data.description ?? undefined;
        this.startDate = new Date(data.startDate);
        this.endDate = data.endDate ? new Date(data.endDate) : undefined;
        this.candidateId = data.candidateId;
    }
}
