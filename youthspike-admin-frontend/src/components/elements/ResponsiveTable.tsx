import React from 'react';

interface ITableProps {
    data: Record<string, unknown>[],
}

const ResponsiveTable = ({ data }: ITableProps) => {

    const renderTH = () => {
        const firstElem = data[0];
        const thEls: React.ReactNode[] = [];
        for (const [k, v] of Object.entries(firstElem)) {
            thEls.push(<th className="py-2 px-4 capitalize" key={k} >{k}</th>);
        }
        thEls.push(<th className="py-2 px-4 capitalize"  >Actions</th>);
        return <tr className="bg-gray-700">{thEls}</tr>;
    }

    const renderBody = () => {
        const firstElem = data[0];
        // Render row
        const trEls: React.ReactNode[] = [];
        for (let i = 0; i < data.length; i++) {
            // Render cols
            const tdEls: React.ReactNode[] = [];
            for (const [k, v] of Object.entries(firstElem)) {
                // @ts-ignore
                tdEls.push(<td className="py-2 px-4 capitalize" key={k} >{v ? v : ''}</td>);
            }
            tdEls.push(<td className="py-2 px-4 capitalize"  >Btns</td>);
            trEls.push(tdEls);

        }

        return <>{trEls}</>
    }
    if(data.length === 0) return <p>No Data Founds!</p>
    return (
        <div className="overflow-x-auto">
            <table className="w-full bg-transparent border shadow">
                <thead>
                    {renderTH()}
                </thead>
                <tbody>
                    {renderBody()}
                </tbody>
            </table>
        </div>
    );
};

export default ResponsiveTable;