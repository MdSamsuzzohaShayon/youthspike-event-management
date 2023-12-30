import React from 'react'

function NetPlayer() {
    return (
        <div className="player-a flex justify-between items-center gap-1 mb-2">
            <div className="player-text w-4/6">
                <p>Firstname Lastname</p>
                <p>Rank 2</p>
            </div>
            <div className="player-img w-2/6">
                <img src="/free-logo.svg" alt="" className="w-12 h-12 rounded-full" />
            </div>
        </div>
    )
}

export default NetPlayer