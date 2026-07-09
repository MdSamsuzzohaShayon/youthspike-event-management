import { gql } from "@apollo/client";

const GET_ARCHIVED_EVENTS = gql`
query GetArhivedEvents{
  getArchivedEvents{
    code
    success
    message
    data{
        _id
        name
        startDate
        endDate
        logo
        active
        description
        location
        netVariance
    }
  }
}
`;


const RESTORE_EVENT = gql`
mutation($eventId: String!){
  restoreEvent(eventId: $eventId){
    code
    success
    message
    data{
      _id
      createdAt
      updatedAt
      name
      logo
    }
  }
}
`;

const ARCHIVE_EVENT_FRAGMENT = gql`
  fragment EventFragment on Event {
    _id
    createdAt
    updatedAt
    name
    logo
    startDate
    endDate
    active
    description
    location
    netVariance
  }
`;


export { GET_ARCHIVED_EVENTS, RESTORE_EVENT, ARCHIVE_EVENT_FRAGMENT };