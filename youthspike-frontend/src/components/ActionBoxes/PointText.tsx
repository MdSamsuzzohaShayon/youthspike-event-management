import React from 'react'

function PointText({ txt }: { txt: string }) {
    return (
        <div className='flex justify-start items-center w-full gap-x-2'>
            <div className="point w-6 h-6 rounded-full bg-green-100"></div>
            <p>{txt}</p>
        </div>
    )
}

export default PointText