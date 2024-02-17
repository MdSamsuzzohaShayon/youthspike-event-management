import { MenuTitle } from '@/types/elements';
import React from 'react';

function CollapseContent({ title }: { title: MenuTitle | null }) {

    switch (title) {
        case MenuTitle.FWANGO:
            return (<p className="capitalize">
                FWANGO Content
            </p>);
        case MenuTitle.EDIT_MATCH:
            return (<p className="capitalize">
                .EDIT_MATCH Content
            </p>);
        case MenuTitle.EDIT_ROSTER:
            return (<p className="capitalize">
                EDIT_ROSTER Content
            </p>);
        case MenuTitle.DASHBOARD:
            return (<p className="capitalize">
                .DASHBOARD Content
            </p>);
        case MenuTitle.FIND_MATCHES:
            return (<p className="capitalize">
                .FIND_MATCHES Content
            </p>);

        default:
            return null;
    }
}

export default CollapseContent;