import { ILoginProps } from '@/types';
import PasswordInput from '../elements/forms/PasswordInput';
import TextInput from '../elements/forms/TextInput';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cardAnimate, headingAnimate } from '@/utils/animation';
import Message from '../elements/Message';

const { initial: hInitial, animate: hAnimate, exit: hExit, transition: hTransition } = headingAnimate;
const { initial: cInitial, animate: cAnimate, exit: cExit, transition: cTransition } = cardAnimate;


function Login({ handleLogin, email, setEmail, password, setPassword, actErr }: ILoginProps) {

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
        <div className='w-full flex'>
            <div className="w-full md:w-3/6 flex flex-col justify-center items-center">
                <div className="w-full flex justify-center items-center">
                    <div className="px-2">
                        {actErr && <Message error={actErr} />}
                    </div>
                </div>
                <div className="w-full px-2 md:w-4/6 md:px-0">
                    <motion.h1 className="text-3xl text-center font-bold p-2" initial={hInitial} animate={hAnimate} exit={hExit} transition={{ ...hTransition, delay: 0.4 }} >Login</motion.h1>
                    <form onSubmit={handleLoginLocal} className='w-full flex flex-col justify-center items-center gap-4 text-center'>
                        <motion.div initial={cInitial} animate={cAnimate} exit={cExit} transition={{ ...cTransition, delay: 0.6 }} className='w-full text-center flex items-center justify-center'>
                            <Image alt="American Spikers Logo" src="/free-logo.png" width={100} height={100} className='w-32 text-center' />
                        </motion.div>
                        <motion.div initial={cInitial} animate={cAnimate} exit={cExit} transition={{ ...cTransition, delay: 0.8 }} className='w-full'>
                            <TextInput name='email' vertical defaultValue={email} lblTxt='Username' handleInputChange={handleSetEmail} required />
                        </motion.div>
                        <motion.div initial={cInitial} animate={cAnimate} exit={cExit} transition={{ ...cTransition, delay: 1 }} className='w-full'>
                            <PasswordInput name='password' vertical defaultValue={password} lblTxt='Password' handleInputChange={handleSetPassword} required />
                        </motion.div>
                        <motion.button initial={cInitial} animate={cAnimate} exit={cExit} transition={{ ...cTransition, delay: 1.2 }} className="btn-primary" type="submit"> Submit</motion.button>
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