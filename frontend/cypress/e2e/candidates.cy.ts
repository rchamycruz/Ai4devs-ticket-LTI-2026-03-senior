const API_URL = Cypress.env('API_URL') ?? 'http://localhost:3010';

describe('Dashboard', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('shows the recruiter dashboard heading', () => {
        cy.contains('Recruiter Dashboard').should('be.visible');
    });

    it('shows the Add Candidate button', () => {
        cy.get('[data-testid="btn-add-candidate"]').should('be.visible');
    });

    it('navigates to the add candidate form on button click', () => {
        cy.get('[data-testid="btn-add-candidate"]').click();
        cy.url().should('include', '/candidates/new');
        cy.contains('Add New Candidate').should('be.visible');
    });
});

describe('Add Candidate Form — UI Behaviours', () => {
    beforeEach(() => {
        cy.visit('/candidates/new');
    });

    it('renders all required personal info fields', () => {
        cy.get('[data-testid="input-firstName"]').should('be.visible');
        cy.get('[data-testid="input-lastName"]').should('be.visible');
        cy.get('[data-testid="input-email"]').should('be.visible');
        cy.get('[data-testid="input-phone"]').should('be.visible');
        cy.get('[data-testid="input-address"]').should('be.visible');
    });

    it('Add Education button is enabled initially and disabled at 3 records', () => {
        cy.get('[data-testid="btn-add-education"]').should('not.be.disabled');

        cy.get('[data-testid="btn-add-education"]').click();
        cy.get('[data-testid="btn-add-education"]').click();
        cy.get('[data-testid="btn-add-education"]').click();

        cy.get('[data-testid="btn-add-education"]').should('be.disabled');
        cy.get('[data-testid="education-item-0"]').should('be.visible');
        cy.get('[data-testid="education-item-1"]').should('be.visible');
        cy.get('[data-testid="education-item-2"]').should('be.visible');
    });

    it('Remove Education re-enables the Add button after reaching max', () => {
        cy.get('[data-testid="btn-add-education"]').click();
        cy.get('[data-testid="btn-add-education"]').click();
        cy.get('[data-testid="btn-add-education"]').click();
        cy.get('[data-testid="btn-add-education"]').should('be.disabled');

        cy.get('[data-testid="btn-remove-education-0"]').click();
        cy.get('[data-testid="btn-add-education"]').should('not.be.disabled');
    });

    it('Add Experience adds a row', () => {
        cy.get('[data-testid="btn-add-experience"]').click();
        cy.get('[data-testid="experience-item-0"]').should('be.visible');
    });

    it('Remove Experience removes the correct row', () => {
        cy.get('[data-testid="btn-add-experience"]').click();
        cy.get('[data-testid="btn-add-experience"]').click();
        cy.get('[data-testid="btn-remove-experience-0"]').click();
        cy.get('[data-testid="experience-item-0"]').should('exist');
        cy.get('[data-testid="experience-item-1"]').should('not.exist');
    });

    it('Back to Dashboard navigates to /', () => {
        cy.get('[data-testid="back-to-dashboard"]').click();
        cy.url().should('eq', Cypress.config('baseUrl') + '/');
        cy.contains('Recruiter Dashboard').should('be.visible');
    });

    it('Cancel button navigates back to /', () => {
        cy.get('[data-testid="btn-cancel"]').click();
        cy.url().should('eq', Cypress.config('baseUrl') + '/');
    });
});

describe('Add Candidate Form — Happy Path', () => {
    beforeEach(() => {
        cy.visit('/candidates/new');
        cy.intercept('POST', `${API_URL}/candidates`, {
            statusCode: 201,
            body: {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: null,
                address: null,
            },
        }).as('addCandidate');
    });

    it('submits the form and shows success alert', () => {
        cy.get('[data-testid="input-firstName"]').type('John');
        cy.get('[data-testid="input-lastName"]').type('Doe');
        cy.get('[data-testid="input-email"]').type('john.doe@example.com');

        cy.get('[data-testid="btn-submit"]').click();
        cy.wait('@addCandidate');

        cy.get('[data-testid="success-alert"]').should('be.visible');
        cy.get('[data-testid="success-alert"]').should('contain', 'Candidate added successfully');
    });

    it('resets the form after successful submit', () => {
        cy.get('[data-testid="input-firstName"]').type('John');
        cy.get('[data-testid="input-lastName"]').type('Doe');
        cy.get('[data-testid="input-email"]').type('john.doe@example.com');

        cy.get('[data-testid="btn-submit"]').click();
        cy.wait('@addCandidate');

        cy.get('[data-testid="input-firstName"]').should('have.value', '');
        cy.get('[data-testid="input-lastName"]').should('have.value', '');
        cy.get('[data-testid="input-email"]').should('have.value', '');
    });
});

describe('Add Candidate Form — Error Handling', () => {
    beforeEach(() => {
        cy.visit('/candidates/new');
    });

    it('shows error alert on validation error (400)', () => {
        cy.intercept('POST', `${API_URL}/candidates`, {
            statusCode: 400,
            body: { error: 'email format is invalid' },
        }).as('addCandidateFail');

        cy.get('[data-testid="input-firstName"]').type('John');
        cy.get('[data-testid="input-lastName"]').type('Doe');
        cy.get('[data-testid="input-email"]').type('not-an-email');

        cy.get('[data-testid="btn-submit"]').click();
        cy.wait('@addCandidateFail');

        cy.get('[data-testid="error-alert"]').should('be.visible');
        cy.get('[data-testid="error-alert"]').should('contain', 'email format is invalid');
    });

    it('shows error alert on duplicate email (400)', () => {
        cy.intercept('POST', `${API_URL}/candidates`, {
            statusCode: 400,
            body: { error: 'Email already exists' },
        }).as('dupEmail');

        cy.get('[data-testid="input-firstName"]').type('John');
        cy.get('[data-testid="input-lastName"]').type('Doe');
        cy.get('[data-testid="input-email"]').type('john.doe@example.com');

        cy.get('[data-testid="btn-submit"]').click();
        cy.wait('@dupEmail');

        cy.get('[data-testid="error-alert"]').should('be.visible');
        cy.get('[data-testid="error-alert"]').should('contain', 'Email already exists');
    });

    it('shows generic error alert on server error (500)', () => {
        cy.intercept('POST', `${API_URL}/candidates`, {
            statusCode: 500,
            body: { error: 'Internal server error' },
        }).as('serverError');

        cy.get('[data-testid="input-firstName"]').type('John');
        cy.get('[data-testid="input-lastName"]').type('Doe');
        cy.get('[data-testid="input-email"]').type('john.doe@example.com');

        cy.get('[data-testid="btn-submit"]').click();
        cy.wait('@serverError');

        cy.get('[data-testid="error-alert"]').should('be.visible');
    });
});
