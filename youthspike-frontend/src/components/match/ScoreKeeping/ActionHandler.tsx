import React from 'react';

function ActionHandler() {

    const handleAceNoTouch=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        console.log("The serving player Served the ball so well that the receiver couldn't even touch the ball");
        
    }

    const handleAceNoThirdTouch=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        console.log("The Serving player put on a serve that was touched by the receiver and set by the setter but the serve was good enough that the receiver couldn't use their third hit");
        
    }

    const handleReceivingHittingError=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        console.log("The receiver during their hit did not get the ball back on the net");
        
    }

    const handleDefensiveConversion=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        console.log("The receiving team won the point by getting a defensive touch and put the ball away");
        
    }


    const handleServerDoNotKnow=(e: React.SyntheticEvent)=>{
        e.preventDefault();
    }

    const handleServiceFault=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        // Only Service Opportunity will be increased by 1
        const actionData = {
          match: "",
          server: "", 
          net: "",
          round: "",
        };
        

        
    }

    const handleOneTwoThreePutAway=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        console.log("The serve was received, the ball was set, and the ball was put away. This is generally the most likely outcome");
        
    }

    const handleRallyConversion=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        console.log("The serving team got the receiving teams hit and put the ball away");
        
    }

    const handleReceiverDoNotKnow=(e: React.SyntheticEvent)=>{
        e.preventDefault();
    }

  return (
    <div className="bottom-side border-t border-yellow-logo mt-6 flex flex-col md:flex-row justify-between items-start">
      <div className="w-full md:w-2/6 flex flex-col gap-y-2 mt-6">
        <h3 className="uppercase text-center">Serving Team</h3>
        <button className="btn-light uppercase" onClick={handleAceNoTouch}>ACE no-touch</button>
        <button className="btn-light uppercase" onClick={handleAceNoThirdTouch}>Ace no 3rd touch</button>
        <button className="btn-light uppercase" onClick={handleReceivingHittingError}>Receiving Hitting Error</button>
        <button className="btn-light uppercase" onClick={handleDefensiveConversion}>Defensive Conversion</button>
        <button className="btn-light uppercase" onClick={handleServerDoNotKnow} >Don't know</button>
      </div>
      <div className="w-full md:w-2/6 flex flex-col gap-y-2 mt-6">
        <h3 className="uppercase text-center">Receiving Team</h3>
        <button className="btn-light uppercase" onClick={handleServiceFault}>Service Fault</button>
        <button className="btn-info uppercase" onClick={handleOneTwoThreePutAway}>1-2-3 put away</button>
        <button className="btn-light uppercase" onClick={handleRallyConversion}>rally Conversion</button>
        <button className="btn-light uppercase" onClick={handleReceiverDoNotKnow}>Don't know</button>
      </div>
    </div>
  );
}

export default ActionHandler;
