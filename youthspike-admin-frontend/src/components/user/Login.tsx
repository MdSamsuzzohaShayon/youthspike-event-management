import { ILoginProps } from '@/types';
import EmailInput from '../elements/forms/EmailInput';
import PasswordInput from '../elements/forms/PasswordInput';
import TextInput from '../elements/forms/TextInput';


function Login({ handleLogin, email, setEmail, password, setPassword }: ILoginProps) {

    const handleSetEmail = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        setEmail(inputEl.value);
    }
    const handleSetPassword = (e: React.SyntheticEvent) => {
        const inputEl = e.target as HTMLInputElement;
        setPassword(inputEl.value);
    }

    const handleLoginLocal = (e: React.SyntheticEvent) => {
        e.preventDefault();
        handleLogin(e);
    }

    return (
        <div className='h-screen w-full flex'>
            <div className="w-full md:w-3/6 flex justify-center items-center">
                <div className="w-full px-2 md:w-4/6 md:px-0">
                    <h1 className="text-3xl text-center font-bold p-2">Login</h1>
                    <form onSubmit={handleLoginLocal} className='w-full flex flex-col justify-center items-center gap-4 text-center'>
                        <TextInput name='email' vertical defaultValue={email} lblTxt='Email Address' handleInputChange={handleSetEmail} required />
                        <PasswordInput name='password' vertical defaultValue={password} lblTxt='Password' handleInputChange={handleSetPassword} required />
                        <button className="btn-primary" type="submit"> Submit</button>
                    </form>
                </div>
            </div>
            <div className="md:w-3/6 hidden md:flex justify-center items-center relative">
                <h1 className='absolute z-10 px-2'> Login to access as admin to league director</h1>
                <div className="img-holder w-full">
                    <img src="/login-bg.jpg" alt="login bg" className='w-full h-screen object-cover object-center' />
                </div>
            </div>
        </div>
    );
}


export default Login;