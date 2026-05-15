'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RouterService from './router-service';

export default function RouterProvider() {
    const router = useRouter();

    useEffect(() => {
        RouterService.setRouter(router);
    }, [router]);

    return null;
}