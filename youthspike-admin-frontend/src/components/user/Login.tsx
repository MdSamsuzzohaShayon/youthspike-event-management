import { ILoginProps } from '@/types';
import PasswordInput from '../elements/forms/PasswordInput';
import TextInput from '../elements/forms/TextInput';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cardAnimate, headingAnimate } from '@/utils/animation';
import { useState } from 'react';

const { initial: hInitial, animate: hAnimate, exit: hExit, transition: hTransition } = headingAnimate;
const { initial: cInitial, animate: cAnimate, exit: cExit, transition: cTransition } = cardAnimate;

function Login({ handleLogin, email, setEmail, password, setPassword, passcode, setPasscode }: ILoginProps) {
    const [passcodeOpener, setPasscodeOpener] = useState<boolean>(false);

    const handleSetEmail = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        setEmail(inputEl.value);
    }
    const handleSetPassword = (e: React.SyntheticEvent) => {
        const inputEl = e.target as HTMLInputElement;
        setPassword(inputEl.value);
    }
    const handlePasscodeChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        setPasscode(inputEl.value);
    }
    const handleLoginLocal = (e: React.SyntheticEvent) => {
        e.preventDefault();
        handleLogin(e);
    }

    return (
        <div className="flex w-full min-h-screen bg-gradient-to-r from-[#fce013] to-[#fff293]">
            <div className="flex flex-col items-center justify-center w-full md:w-1/2 px-6 py-12 md:py-0">
                <motion.h1
                    className="text-4xl font-bold text-white mb-6"
                    initial={hInitial}
                    animate={hAnimate}
                    exit={hExit}
                    transition={{ ...hTransition, delay: 0.3 }}
                >
                    Login
                </motion.h1>
                <div className="w-full md:w-4/6">
                    <motion.div
                        initial={cInitial}
                        animate={cAnimate}
                        exit={cExit}
                        transition={{ ...cTransition, delay: 0.5 }}
                        className="flex justify-center mb-6"
                    >
                        <Image alt="Logo" src="/free-logo.png" width={80} height={80} className="rounded-full shadow-md" />
                    </motion.div>
                    <form
                        onSubmit={handleLoginLocal}
                        className="flex flex-col gap-4 bg-white p-8 rounded-lg shadow-lg text-gray-700"
                    >
                        <motion.div
                            initial={cInitial}
                            animate={cAnimate}
                            exit={cExit}
                            transition={{ ...cTransition, delay: 0.6 }}
                        >
                            <TextInput
                                name="email"
                                vertical
                                defaultValue={email}
                                lblTxt="Username"
                                handleInputChange={handleSetEmail}
                                required
                            />
                        </motion.div>
                        <motion.div
                            initial={cInitial}
                            animate={cAnimate}
                            exit={cExit}
                            transition={{ ...cTransition, delay: 0.8 }}
                        >
                            <PasswordInput
                                name="password"
                                vertical
                                defaultValue={password}
                                lblTxt="Password"
                                handleInputChange={handleSetPassword}
                                svgColor='svg-black'
                                required
                            />
                        </motion.div>
                        {passcodeOpener && (
                            <motion.div
                                initial={cInitial}
                                animate={cAnimate}
                                exit={cExit}
                                transition={{ ...cTransition, delay: 1.0 }}
                            >
                                <PasswordInput
                                    name="passcode"
                                    vertical
                                    lblTxt="Passcode"
                                    defaultValue={passcode}
                                    handleInputChange={handlePasscodeChange}
                                    svgColor='svg-black'
                                    tooltip="This field is essential to grant permissions."
                                />
                            </motion.div>
                        )}
                        <motion.button
                            type="submit"
                            className="w-full btn-info"
                            initial={cInitial}
                            animate={cAnimate}
                            exit={cExit}
                            transition={{ ...cTransition, delay: 1.2 }}
                        >
                            Submit
                        </motion.button>
                        {!passcodeOpener && <p role='presentation' onClick={(e)=> setPasscodeOpener(true)}>Have passcode?</p>}
                    </form>
                </div>
            </div>
            <div className="hidden md:flex md:w-1/2 items-center justify-center relative bg-white">
                <motion.h1
                    className="absolute top-1/2 transform -translate-y-1/2 text-xl font-semibold text-white z-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    Access as Admin to League Director
                </motion.h1>
                <div className="w-full h-screen overflow-hidden">
                    <img src="/login-bg.jpg" alt="Login background" className="object-cover w-full h-full" />
                </div>
            </div>
        </div>
    );
}

export default Login;
