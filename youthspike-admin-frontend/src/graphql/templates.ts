import { gql } from "@apollo/client";

// Query to fetch template
export const GET_TEMPLATES_RAW = `
query GetTemplates($eventId: String!) {
    getTemplates(eventId: $eventId) {
      code
      success
      message
      data {
        _id
        name
        default
        type
        subject
        body
        images
        placeholders
      }
    }
  }
`
export const GET_TEMPLATES = gql`${GET_TEMPLATES_RAW}`;

// Mutation to save template
export const SAVE_TEMPLATE_RAW = `
  mutation CreateTemplate($input: CreateTemplateInput!){
    createTemplate(input: $input){
      code
      success
      message
      data{
        _id
        name
        default
        type
        subject
        body
        images
        placeholders
      }
    }
  }
`;

export const SAVE_TEMPLATE = gql`${SAVE_TEMPLATE_RAW}`;

// Mutation to save version
export const UPDATE_TEMPLATE_RAW = `
mutation UpdateTemplate($input: UpdateTemplateInput!, $templateId: String!, $eventId: String!) {
  updateTemplate(input: $input, templateId: $templateId, eventId: $eventId) {
    code
    success
    message
    data{
      _id
      name
      default
      type
      subject
      body
      images
      placeholders
    }
  }
}
`;

export const UPDATE_TEMPLATE = gql`${UPDATE_TEMPLATE_RAW}`;

export const DELETE_TEMPLATE_RAW = `
mutation DeleteMutation($templateId:String!){
  deleteTemplate(templateId: $templateId){
    code
    success
    message
  }
}

`;

export const DELETE_TEMPLATE = gql`${DELETE_TEMPLATE_RAW}`