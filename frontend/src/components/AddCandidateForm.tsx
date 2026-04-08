import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Form,
    Button,
    Alert,
    Card,
    Row,
    Col,
    Spinner,
} from 'react-bootstrap';
import {
    candidateService,
    EducationInput,
    WorkExperienceInput,
    CvInput,
} from '../services/candidateService';

const MAX_EDUCATIONS = 3;

type PersonalInfo = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
};

const EMPTY_EDUCATION: EducationInput = {
    institution: '',
    title: '',
    startDate: '',
    endDate: '',
};

const EMPTY_EXPERIENCE: WorkExperienceInput = {
    company: '',
    position: '',
    description: '',
    startDate: '',
    endDate: '',
};

const AddCandidateForm: React.FC = () => {
    const navigate = useNavigate();

    const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
    });
    const [educations, setEducations] = useState<EducationInput[]>([]);
    const [workExperiences, setWorkExperiences] = useState<WorkExperienceInput[]>([]);
    const [cv, setCv] = useState<CvInput | null>(null);
    const [cvFileName, setCvFileName] = useState('');
    const [isUploadingCv, setIsUploadingCv] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPersonalInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddEducation = () => {
        if (educations.length < MAX_EDUCATIONS) {
            setEducations((prev) => [...prev, { ...EMPTY_EDUCATION }]);
        }
    };

    const handleRemoveEducation = (index: number) => {
        setEducations((prev) => prev.filter((_, i) => i !== index));
    };

    const handleEducationChange = (index: number, field: keyof EducationInput, value: string) => {
        setEducations((prev) =>
            prev.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu))
        );
    };

    const handleAddExperience = () => {
        setWorkExperiences((prev) => [...prev, { ...EMPTY_EXPERIENCE }]);
    };

    const handleRemoveExperience = (index: number) => {
        setWorkExperiences((prev) => prev.filter((_, i) => i !== index));
    };

    const handleExperienceChange = (
        index: number,
        field: keyof WorkExperienceInput,
        value: string
    ) => {
        setWorkExperiences((prev) =>
            prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp))
        );
    };

    const handleCvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingCv(true);
        setErrorMessage('');
        try {
            const uploaded = await candidateService.uploadCV(file);
            setCv(uploaded);
            setCvFileName(file.name);
        } catch (err: any) {
            const msg =
                err.response?.data?.error ??
                'Failed to upload CV. Only PDF and DOCX files up to 10MB are allowed.';
            setErrorMessage(msg);
            setCv(null);
            setCvFileName('');
        } finally {
            setIsUploadingCv(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const payload = {
                firstName: personalInfo.firstName,
                lastName: personalInfo.lastName,
                email: personalInfo.email,
                phone: personalInfo.phone || undefined,
                address: personalInfo.address || undefined,
                educations:
                    educations.length > 0
                        ? educations.map((edu) => ({
                              institution: edu.institution,
                              title: edu.title,
                              startDate: edu.startDate,
                              endDate: edu.endDate || undefined,
                          }))
                        : undefined,
                workExperiences:
                    workExperiences.length > 0
                        ? workExperiences.map((exp) => ({
                              company: exp.company,
                              position: exp.position,
                              description: exp.description || undefined,
                              startDate: exp.startDate,
                              endDate: exp.endDate || undefined,
                          }))
                        : undefined,
                cv: cv ?? undefined,
            };

            await candidateService.addCandidate(payload);
            setSuccessMessage('Candidate added successfully!');
            setPersonalInfo({ firstName: '', lastName: '', email: '', phone: '', address: '' });
            setEducations([]);
            setWorkExperiences([]);
            setCv(null);
            setCvFileName('');
        } catch (err: any) {
            const msg =
                err.response?.data?.error ?? 'An unexpected error occurred. Please try again.';
            setErrorMessage(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container className="py-4" style={{ maxWidth: '800px' }}>
            <Button
                variant="link"
                className="mb-3 px-0"
                onClick={() => navigate('/')}
                aria-label="Back to dashboard"
                data-testid="back-to-dashboard"
            >
                ← Back to Dashboard
            </Button>

            <h2 className="mb-4">Add New Candidate</h2>

            {successMessage && (
                <Alert
                    variant="success"
                    dismissible
                    onClose={() => setSuccessMessage('')}
                    data-testid="success-alert"
                >
                    {successMessage}
                </Alert>
            )}
            {errorMessage && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setErrorMessage('')}
                    data-testid="error-alert"
                >
                    {errorMessage}
                </Alert>
            )}

            <Form onSubmit={handleSubmit} noValidate>
                {/* Personal Information */}
                <Card className="mb-4">
                    <Card.Header>
                        <strong>Personal Information</strong>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="firstName">
                                    <Form.Label>First Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="firstName"
                                        value={personalInfo.firstName}
                                        onChange={handlePersonalInfoChange}
                                        placeholder="Enter first name"
                                        required
                                        aria-label="First name"
                                        data-testid="input-firstName"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="lastName">
                                    <Form.Label>Last Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="lastName"
                                        value={personalInfo.lastName}
                                        onChange={handlePersonalInfoChange}
                                        placeholder="Enter last name"
                                        required
                                        aria-label="Last name"
                                        data-testid="input-lastName"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3" controlId="email">
                            <Form.Label>Email Address *</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={personalInfo.email}
                                onChange={handlePersonalInfoChange}
                                placeholder="Enter email address"
                                required
                                aria-label="Email address"
                                data-testid="input-email"
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="phone">
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="phone"
                                        value={personalInfo.phone}
                                        onChange={handlePersonalInfoChange}
                                        placeholder="e.g. 612345678"
                                        aria-label="Phone number"
                                        data-testid="input-phone"
                                    />
                                    <Form.Text className="text-muted">
                                        Spanish format: starts with 6, 7 or 9
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="address">
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="address"
                                        value={personalInfo.address}
                                        onChange={handlePersonalInfoChange}
                                        placeholder="Enter address"
                                        aria-label="Address"
                                        data-testid="input-address"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Education */}
                <Card className="mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <strong>Education</strong>
                        <Button
                            variant="outline-primary"
                            size="sm"
                            type="button"
                            onClick={handleAddEducation}
                            disabled={educations.length >= MAX_EDUCATIONS}
                            aria-label="Add education record"
                            data-testid="btn-add-education"
                        >
                            + Add Education
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        {educations.length === 0 && (
                            <p className="text-muted mb-0" data-testid="education-empty-message">
                                No education records added yet.
                            </p>
                        )}
                        {educations.map((edu, index) => (
                            <Card
                                key={index}
                                className="mb-3 border-secondary"
                                data-testid={`education-item-${index}`}
                            >
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <strong>Education {index + 1}</strong>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            type="button"
                                            onClick={() => handleRemoveEducation(index)}
                                            aria-label={`Remove education ${index + 1}`}
                                            data-testid={`btn-remove-education-${index}`}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group
                                                className="mb-2"
                                                controlId={`edu-institution-${index}`}
                                            >
                                                <Form.Label>Institution *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={edu.institution}
                                                    onChange={(e) =>
                                                        handleEducationChange(
                                                            index,
                                                            'institution',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. MIT"
                                                    required
                                                    aria-label={`Education ${index + 1} institution`}
                                                    data-testid={`edu-institution-${index}`}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group
                                                className="mb-2"
                                                controlId={`edu-title-${index}`}
                                            >
                                                <Form.Label>Degree / Title *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={edu.title}
                                                    onChange={(e) =>
                                                        handleEducationChange(
                                                            index,
                                                            'title',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. BSc Computer Science"
                                                    required
                                                    aria-label={`Education ${index + 1} title`}
                                                    data-testid={`edu-title-${index}`}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group
                                                className="mb-2"
                                                controlId={`edu-startDate-${index}`}
                                            >
                                                <Form.Label>Start Date *</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={edu.startDate}
                                                    onChange={(e) =>
                                                        handleEducationChange(
                                                            index,
                                                            'startDate',
                                                            e.target.value
                                                        )
                                                    }
                                                    required
                                                    aria-label={`Education ${index + 1} start date`}
                                                    data-testid={`edu-startDate-${index}`}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group
                                                className="mb-2"
                                                controlId={`edu-endDate-${index}`}
                                            >
                                                <Form.Label>End Date</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={edu.endDate ?? ''}
                                                    onChange={(e) =>
                                                        handleEducationChange(
                                                            index,
                                                            'endDate',
                                                            e.target.value
                                                        )
                                                    }
                                                    aria-label={`Education ${index + 1} end date`}
                                                    data-testid={`edu-endDate-${index}`}
                                                />
                                                <Form.Text className="text-muted">
                                                    Leave empty if ongoing
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        ))}
                    </Card.Body>
                </Card>

                {/* Work Experience */}
                <Card className="mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <strong>Work Experience</strong>
                        <Button
                            variant="outline-primary"
                            size="sm"
                            type="button"
                            onClick={handleAddExperience}
                            aria-label="Add work experience"
                            data-testid="btn-add-experience"
                        >
                            + Add Experience
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        {workExperiences.length === 0 && (
                            <p className="text-muted mb-0" data-testid="experience-empty-message">
                                No work experience records added yet.
                            </p>
                        )}
                        {workExperiences.map((exp, index) => (
                            <Card
                                key={index}
                                className="mb-3 border-secondary"
                                data-testid={`experience-item-${index}`}
                            >
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <strong>Experience {index + 1}</strong>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            type="button"
                                            onClick={() => handleRemoveExperience(index)}
                                            aria-label={`Remove experience ${index + 1}`}
                                            data-testid={`btn-remove-experience-${index}`}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group
                                                className="mb-2"
                                                controlId={`exp-company-${index}`}
                                            >
                                                <Form.Label>Company *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={exp.company}
                                                    onChange={(e) =>
                                                        handleExperienceChange(
                                                            index,
                                                            'company',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. Acme Corp"
                                                    required
                                                    aria-label={`Experience ${index + 1} company`}
                                                    data-testid={`exp-company-${index}`}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group
                                                className="mb-2"
                                                controlId={`exp-position-${index}`}
                                            >
                                                <Form.Label>Position *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={exp.position}
                                                    onChange={(e) =>
                                                        handleExperienceChange(
                                                            index,
                                                            'position',
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g. Software Engineer"
                                                    required
                                                    aria-label={`Experience ${index + 1} position`}
                                                    data-testid={`exp-position-${index}`}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Form.Group
                                        className="mb-2"
                                        controlId={`exp-description-${index}`}
                                    >
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            value={exp.description ?? ''}
                                            onChange={(e) =>
                                                handleExperienceChange(
                                                    index,
                                                    'description',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Brief description of responsibilities"
                                            maxLength={200}
                                            aria-label={`Experience ${index + 1} description`}
                                            data-testid={`exp-description-${index}`}
                                        />
                                    </Form.Group>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group
                                                className="mb-2"
                                                controlId={`exp-startDate-${index}`}
                                            >
                                                <Form.Label>Start Date *</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={exp.startDate}
                                                    onChange={(e) =>
                                                        handleExperienceChange(
                                                            index,
                                                            'startDate',
                                                            e.target.value
                                                        )
                                                    }
                                                    required
                                                    aria-label={`Experience ${index + 1} start date`}
                                                    data-testid={`exp-startDate-${index}`}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group
                                                className="mb-2"
                                                controlId={`exp-endDate-${index}`}
                                            >
                                                <Form.Label>End Date</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={exp.endDate ?? ''}
                                                    onChange={(e) =>
                                                        handleExperienceChange(
                                                            index,
                                                            'endDate',
                                                            e.target.value
                                                        )
                                                    }
                                                    aria-label={`Experience ${index + 1} end date`}
                                                    data-testid={`exp-endDate-${index}`}
                                                />
                                                <Form.Text className="text-muted">
                                                    Leave empty if current
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        ))}
                    </Card.Body>
                </Card>

                {/* CV Upload */}
                <Card className="mb-4">
                    <Card.Header>
                        <strong>CV / Resume</strong>
                    </Card.Header>
                    <Card.Body>
                        <Form.Group controlId="cvUpload">
                            <Form.Label>Upload CV (PDF or DOCX, max 10MB)</Form.Label>
                            <Form.Control
                                type="file"
                                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleCvChange}
                                disabled={isUploadingCv}
                                aria-label="Upload CV file"
                                data-testid="input-cv-file"
                            />
                            {isUploadingCv && (
                                <div
                                    className="mt-2 d-flex align-items-center gap-2"
                                    data-testid="cv-uploading"
                                >
                                    <Spinner animation="border" size="sm" />
                                    <span>Uploading…</span>
                                </div>
                            )}
                            {cv && !isUploadingCv && (
                                <Form.Text
                                    className="text-success d-block mt-1"
                                    data-testid="cv-upload-success"
                                >
                                    ✓ {cvFileName} uploaded successfully
                                </Form.Text>
                            )}
                        </Form.Group>
                    </Card.Body>
                </Card>

                {/* Actions */}
                <div className="d-flex gap-3">
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting || isUploadingCv}
                        aria-label="Submit candidate form"
                        data-testid="btn-submit"
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Adding Candidate…
                            </>
                        ) : (
                            'Add Candidate'
                        )}
                    </Button>
                    <Button
                        variant="outline-secondary"
                        type="button"
                        onClick={() => navigate('/')}
                        disabled={isSubmitting}
                        aria-label="Cancel and go back"
                        data-testid="btn-cancel"
                    >
                        Cancel
                    </Button>
                </div>
            </Form>
        </Container>
    );
};

export default AddCandidateForm;
