import { EMenuTitle } from '@/types/elements';
import React from 'react';

function CollapseContent({ title }: { title: EMenuTitle | null }) {

    switch (title) {
        case EMenuTitle.FWANGO:
            return (<p className="capitalize">
                FWANGO Content
            </p>);
        case EMenuTitle.EDIT_MATCH:
            return (<p className="capitalize">
                .EDIT_MATCH Content
            </p>);
        case EMenuTitle.EDIT_ROSTER:
            return (<p className="capitalize">
                EDIT_ROSTER Content
            </p>);
        case EMenuTitle.DASHBOARD:
            return (<p className="capitalize">
                .DASHBOARD Content
            </p>);
        case EMenuTitle.FIND_MATCHES:
            return (<p className="capitalize">
                .FIND_MATCHES Content
            </p>);

        default:
            return null;
    }
}

export default CollapseContent;