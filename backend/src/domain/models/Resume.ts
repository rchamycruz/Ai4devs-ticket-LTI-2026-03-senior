export class Resume {
    id?: number;
    filePath: string;
    fileType: string;
    uploadDate: Date;
    candidateId?: number;

    constructor(data: {
        id?: number;
        filePath: string;
        fileType: string;
        uploadDate?: Date;
        candidateId?: number;
    }) {
        this.id = data.id;
        this.filePath = data.filePath;
        this.fileType = data.fileType;
        this.uploadDate = data.uploadDate ?? new Date();
        this.candidateId = data.candidateId;
    }
}
