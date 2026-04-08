import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Card } from 'react-bootstrap';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Container className="py-5" style={{ maxWidth: '900px' }}>
            <h1 className="mb-4">Recruiter Dashboard</h1>
            <Card>
                <Card.Body className="d-flex align-items-center justify-content-between">
                    <div>
                        <Card.Title>Candidates</Card.Title>
                        <Card.Text className="text-muted">Manage candidate profiles and their application progress.</Card.Text>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/candidates/new')}
                        aria-label="Add new candidate"
                        data-testid="btn-add-candidate"
                    >
                        + Add Candidate
                    </Button>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Dashboard;
