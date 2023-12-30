import Link from 'next/link'
import React from 'react'

function Page404NotFound() {
    return (
        <div className='container mx-auto px-2'>
            <h1 className="mt-8 text-red-500 bg-red-200 p-2">Page 404 Not Found!</h1>
            <Link href="/" >Home</Link>
        </div>
    )
}

export default Page404NotFound