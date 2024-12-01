import { gql } from "@apollo/client";


const ADD_GROUP = gql`
mutation CreateGroup($input: CreateGroupInput!) {
  createGroup(input: $input) {
    code
    message
    success
    data {
      _id
      active
      name
      division
    }
  }
}
`;

const UPDATE_GROUP = gql`
mutation UpdateGroup($updateInput: UpdateGroupInput!, $eventId: String) {
  updateGroup(updateInput: $updateInput, eventId: $eventId) {
    code
    message
    success
    data {
      _id
      active
    }
  }
}
`;

const GET_EVENT_WITH_GROUP = gql`
  query GetEvent($eventId: String!) {
    getEvent(eventId: $eventId) {
      code
      success
      message
      data {
        _id
        divisions
        name
        teams {
            _id
            name
            division
            group{
              _id
              name
            }
        }
        groups{
            _id
            name
        }
      }
    }
  }
`;

const GET_GROUPS = gql`
query GetEvent($eventId: String!) {
  getEvent(eventId: $eventId) {
    code
    message
    success
    data {
      _id
      name
      logo
      startDate
      endDate
      active
      autoAssign
      autoAssignLogic
      coachPassword
      divisions
      groups {
        _id
        active
        division
        rule
        name
        teams {
          _id
          name
        }
      }
    }
  }
}
`;


const GET_A_GROUP = gql`
query GetGroup($groupId: String!) {
  getGroup(groupId: $groupId) {
    code
    message
    success
    data {
      _id
      active
      division
      name
      rule
      teams {
        _id
        name
        division
      }
      event {
        _id
        divisions
      }
    }
  }
}
`;

export { GET_EVENT_WITH_GROUP, ADD_GROUP, UPDATE_GROUP, GET_GROUPS, GET_A_GROUP };