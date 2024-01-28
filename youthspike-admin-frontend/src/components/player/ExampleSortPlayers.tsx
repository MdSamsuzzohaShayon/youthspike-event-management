import React, { useEffect, useRef, useState } from 'react';

const initialPlayers = [
    { id: 1, name: "Player 1", content: "Player 1 Content" },
    { id: 2, name: "Player 2", content: "Player 2 Content" },
    { id: 3, name: "Player 3", content: "Player 3 Content" },
    { id: 4, name: "Player 4", content: "Player 4 Content" },
];
function ExampleSortPlayers() {
    const [people, setPeople] = useState(initialPlayers);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const dragPerson = useRef<number>(0);
    const dragOverPerson = useRef<number>(0);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, i: number) => {
        dragPerson.current = i;
        setIsDragging(true);
    }
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, i: number) => {
        dragOverPerson.current = i;
    }
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>, i: number) => {
        // Swap
        const peopleClone = people.slice();
        const temp = peopleClone[dragPerson.current];
        peopleClone[dragPerson.current] = peopleClone[dragOverPerson.current];
        peopleClone[dragOverPerson.current] = temp;
        setPeople(peopleClone);
        setIsDragging(false);
    }

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, i: number) => {
        dragPerson.current = i;
        setIsDragging(true);
    }

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault(); // Prevent scrolling while dragging
    }

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, i: number) => {
        // Swap
        const peopleClone = people.slice();
        const temp = peopleClone[dragPerson.current];
        peopleClone[dragPerson.current] = peopleClone[dragOverPerson.current];
        peopleClone[dragOverPerson.current] = temp;
        setPeople(peopleClone);
        setIsDragging(false);
    }


    return (
        <div>
            <h2>Sort players</h2>
            <div className="sort-players flex flex-col gap-2">
                {people.map((p, i) => (<div key={p.id} draggable className='w-full cursor-move'
                    onDragStart={(e) => handleDragStart(e, i)} onDragEnter={(e) => handleDragEnter(e, i)} onDragEnd={(e) => handleDragEnd(e, i)}
                    // onTouchStart={(e) => handleTouchStart(e, i)} onTouchMove={handleTouchMove} onTouchEnd={(e) => handleTouchEnd(e, i)}
                >
                    <p className={`p-2 bg-green-100 text-green-800 w-full ${isDragging ? "opacity-100" : ""}`}>{p.name}</p>
                </div>))}
            </div>
        </div>
    )
}

export default ExampleSortPlayers;