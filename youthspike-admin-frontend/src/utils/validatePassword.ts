function validatePassword(
    password: string | undefined,
    confirmPassword: string | undefined
  ): string | null {
    if (!password || !confirmPassword) {
      return 'Password and confirm password are required.';
    }
  
    if (password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
  
    if (password.length > 20) {
      return 'Password must not exceed 20 characters.';
    }
  
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
  
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
  
    if (!hasNumber || !hasLetter) {
      return 'Password must contain at least one letter and one number.';
    }
  
    return null;
  }
  
  export default validatePassword;