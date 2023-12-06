import { IError } from '@/types';
import React, { useState } from 'react';

const exampleErr = {
  "name": "ApolloError",
  "graphQLErrors": [],
  "protocolErrors": [],
  "clientErrors": [],
  "networkError": {
    "name": "ServerError",
    "response": {},
    "statusCode": 400,
    "result": {
      "errors": [
        {
          "message": "Unknown argument \"abc\" on field \"Mutation.login\".",
          "locations": [
            {
              "line": 2,
              "column": 45
            }
          ],
          "extensions": {
            "code": "GRAPHQL_VALIDATION_FAILED",
            "exception": {
              "stacktrace": [
                "GraphQLError: Unknown argument \"abc\" on field \"Mutation.login\".",
                "    at Object.Argument (/home/shayon/Documents/Spikeball-tournament/youthspike-match-nest-backend/node_modules/graphql/validation/rules/KnownArgumentNamesRule.js:46:11)",
                "    at Object.enter (/home/shayon/Documents/Spikeball-tournament/youthspike-match-nest-backend/node_modules/graphql/language/visitor.js:301:32)",
                "    at Object.enter (/home/shayon/Documents/Spikeball-tournament/youthspike-match-nest-backend/node_modules/graphql/utilities/TypeInfo.js:391:27)",
                "    at visit (/home/shayon/Documents/Spikeball-tournament/youthspike-match-nest-backend/node_modules/graphql/language/visitor.js:197:21)",
                "    at validate (/home/shayon/Documents/Spikeball-tournament/youthspike-match-nest-backend/node_modules/graphql/validation/validate.js:91:24)",
                "    at validate (/home/shayon/Documents/Spikeball-tournament/youthspike-match-nest-backend/node_modules/apollo-server-core/src/requestPipeline.ts:474:27)",
                "    at processGraphQLRequest (/home/shayon/Documents/Spikeball-tournament/youthspike-match-nest-backend/node_modules/apollo-server-core/src/requestPipeline.ts:265:30)",
                "    at processTicksAndRejections (node:internal/process/task_queues:95:5)",
                "    at processHTTPRequest (/home/shayon/Documents/Spikeball-tournament/youthspike-match-nest-backend/node_modules/apollo-server-core/src/runHttpQuery.ts:436:24)"
              ]
            }
          }
        }
      ]
    }
  },
  "message": "Response not successful: Received status code 400"
}


const Message = ({ error }: { error: IError | null }) => {

  const [expandDetail, setExpandDetail] = useState<boolean>(false);

  if (error === null) return null;
  return (
    <div className='text-red-500 container mx-auto'>
      <div className="flex gap-2 items-center">
        <h2 >Error: </h2> <img src='/icons/error.svg' className='w-4 svg-white' />
        {error.name && <h2>{error.name}</h2>}
      </div>
      {(error && error?.message) && <p>{error.message}</p>}
      <div className="expand-detail mt-2">
        <button className="font-bold" onClick={(e) => setExpandDetail(!expandDetail)} >
          {expandDetail ? (<span className="flex justify-between items-center">
            Collapse <img src='/icons/right-arrow.svg' className='svg-white w-4 rotate-180' alt='arrow' />
          </span>) : (<span className="flex justify-between items-center">
            Expand <img src='/icons/right-arrow.svg' className='svg-white w-4 rotate-90' alt='arrow' />
          </span>)}
        </button>
      </div>
      {expandDetail && <div className="error-detail w-full">
        <p>
          {error.main ? JSON.stringify(error.main) : JSON.stringify(error)}
        </p>
      </div>}
    </div>
  )
}

export default Message