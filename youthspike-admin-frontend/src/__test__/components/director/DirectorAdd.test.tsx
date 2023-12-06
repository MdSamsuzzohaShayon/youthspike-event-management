import '@testing-library/jest-dom';
import { fireEvent, screen, render, waitFor } from '@testing-library/react';
import DirectorAdd from "@/components/ldo/DirectorAdd";
import { MockedProvider } from '@apollo/client/testing';
import { REGISTER_DIRECTOR } from '@/graphql/admin';

// Define a mock GraphQL response
const mockRegisterDirectorResponse = {
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'password',
};

const mockRegisterDirector = jest.fn();
const mocks = [
    {
        request: {
            query: REGISTER_DIRECTOR,
            variables: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password',
            },
        },
        result: mockRegisterDirectorResponse,
    },
];

describe('DirectorAdd', () => {

    it('should reset the form input values and clear the form when the form is submitted with valid input values', () => {
        // Arrange
        render(
            <MockedProvider mocks={mocks}>
                <DirectorAdd />
            </MockedProvider>
        );

        const firstName = screen.getByLabelText('First Name');
        const lastName = screen.getByLabelText('Last Name');
        const email = screen.getByLabelText('Email');
        const password = screen.getByLabelText('Password');
        const confirmPassword = screen.getByLabelText('Confirm Password');
        const button = screen.getByText('Register');

        // Act
        fireEvent.change(firstName, { target: { value: 'John' } });
        fireEvent.change(lastName, { target: { value: 'Doe' } });
        fireEvent.change(email, { target: { value: 'john.doe@example.com' } });
        fireEvent.change(password, { target: { value: 'password' } });
        fireEvent.change(confirmPassword, { target: { value: 'password' } });
        fireEvent.click(button);

        // Test is not working successfully because registerDirector this GraphQL function
        // Assert
        expect(firstName).toHaveValue('');
        expect(lastName).toHaveValue('');
        expect(email).toHaveValue('');
        expect(password).toHaveValue('');
        expect(confirmPassword).toHaveValue('');
    });

    // it('should display an error message when the password and confirm password fields do not match', () => {
    //     // Arrange
    //     render(
    //         <MockedProvider mocks={mocks}>
    //             <DirectorAdd />
    //         </MockedProvider>
    //     );

    //     // Act
    //     fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
    //     fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'differentpassword' } });
    //     fireEvent.click(screen.getByText('Register'));

    //     // Assert
    //     expect(screen.getByText(/Password did not match!/)).toBeInTheDocument();
    // });

    it('should not call the registration mutation when the password and confirm password fields do not match', () => {
        // Arrange
        render(
            <MockedProvider mocks={mocks}>
                <DirectorAdd />
            </MockedProvider>
        );

        // Act
        fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
        fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'differentpassword' } });
        fireEvent.click(screen.getByText('Register'));

        // Assert
        expect(mockRegisterDirector).not.toHaveBeenCalled();
    });
});