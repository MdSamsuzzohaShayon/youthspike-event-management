import { IOption, IPlayer, IPlayerRankingItemExpRel } from '@/types';
import { GraphQLError } from 'graphql';
import { netSize, screen } from './constant';

export function isValidObjectId(docId: string) {
  // Pattern to match a valid ObjectId
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;

  // Check if the provided string matches the pattern
  return objectIdPattern.test(docId);
}

export function handleError(error: any) {
  // Check if the error is an instance of ApolloError
  if (error.name === 'ApolloError') {
    // Extract relevant error information
    const { graphQLErrors } = error;
    const message = error.message || 'An error occurred.';

    if (graphQLErrors && graphQLErrors.length > 0) {
      // Handle GraphQL specific errors
      return graphQLErrors.map((err: GraphQLError) => {
        // @ts-ignore
        const statusCode = err.extensions?.response?.statusCode || 500;
        const errorMessage = err.message || 'Error occurred in GraphQL operation.';
        console.error(`GraphQL Error: ${errorMessage}, Status Code: ${statusCode}`);

        // Format the response for the client
        return {
          message: errorMessage,
          code: statusCode,
          name: statusCode,
        };
      });
    }
    // Generic error handling
    console.error(`Generic Error: ${message}`);
    return [
      {
        message,
        code: 500, // Internal Server Error
        name: 500,
      },
    ];
  }
  // Handle non-Apollo errors
  console.error('Non-Apollo Error:', error);
  return [
    {
      message: 'An unexpected error occurred',
      code: 500,
      name: 500,
    },
  ];
}

export const sortPlayerRanking = (pl: IPlayer[], rankings?: IPlayerRankingItemExpRel[]) => {
  let sortedRankings: IPlayerRankingItemExpRel[] = [];
  let sortedPlayers = [];
  if (rankings && rankings.length > 0) {
    sortedRankings = [...rankings].sort((a, b) => a.rank - b.rank);
    const playerIds = new Set();

    for (let i = 0; i < sortedRankings.length; i += 1) {
      const findPlayer = pl.find((p) => p._id === sortedRankings[i].player._id);
      if (findPlayer) {
        playerIds.add(findPlayer._id);
        sortedPlayers.push(findPlayer);
      }
    }
  } else {
    sortedPlayers = [...pl];
  }

  return { sortedRankings, sortedPlayers };
};

export const divisionsToOptionList = (divisions: string) => {
  const divs: IOption[] = [];
  if (divisions && divisions.trim() !== '') {
    const dl = divisions.split(',');
    for (let i = 0; i < dl.length; i += 1) {
      if (dl[i].trim() !== '') {
        divs.push({ id: i+1, text: dl[i], value: dl[i].toLowerCase() });
      }
    }
  }
  return divs;
};



export const toOrdinal = (n: number): string => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;

  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
};

export const fsToggle = (screenWidth: number) => {
  const fontStyle = { fontSize: screenWidth > screen.xs ? `${netSize.hfm}rem` : `${netSize.fsm}rem` };
  return fontStyle;
};

export const setNetH = (screenWidth: number) => {
  const hStyle = { height: screenWidth > screen.xs ? `${netSize.mhl}rem` : `${netSize.mhm}rem` };
  return hStyle;
};
