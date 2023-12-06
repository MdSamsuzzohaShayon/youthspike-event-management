'use client';

/* Core */
import React from 'react';
import { Provider } from 'react-redux';

/* Instruments */
import { store } from '@/redux/store';

function ReduxProvider({ children }: React.PropsWithChildren) {
    return <Provider store={store}>{children}</Provider>;
}


export default ReduxProvider;
