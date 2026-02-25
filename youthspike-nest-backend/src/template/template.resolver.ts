/* eslint-disable @typescript-eslint/no-unused-vars */
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/shared/auth/roles.decorator';
import { UserRole } from 'src/user/user.schema';
import { Template } from './template.schema';
import { CreateTemplateInput, TemplateSearchFilter, UpdateTemplateInput } from './resolvers/template.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/auth/jwt.guard';
import { RolesGuard } from 'src/shared/auth/roles.guard';
import {
  CreateOrUpdateTemplateResponse,
  GetTemplateResponse,
  GetTemplateSearchResponse,
  GetTemplatesResponse,
} from './resolvers/template.response';
import { TemplateFields } from './resolvers/template.fields';
import { TemplateQueries } from './resolvers/template.queries';
import { TemplateMutations } from './resolvers/template.mutations';
import * as GraphQLUploadModule from 'graphql-upload/GraphQLUpload.mjs';
import { EventDetails } from 'src/event/resolvers/event.response';
const GraphQLUpload = GraphQLUploadModule.default;

@Resolver((_of) => Template)
export class TemplateResolver {
  constructor(
    private readonly templateFields: TemplateFields,
    private readonly templateQueris: TemplateQueries,
    private readonly templateMutations: TemplateMutations,
  ) { }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => CreateOrUpdateTemplateResponse)
  async createTemplate(
    @Args('input') input: CreateTemplateInput,
  ) {
    return this.templateMutations.createTemplate(input);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => CreateOrUpdateTemplateResponse)
  async updateTemplate(
    @Args('input') input: UpdateTemplateInput,
    @Args('templateId') templateId: string,
    @Args('eventId') eventId: string
  ) {
    return this.templateMutations.updateTemplate(input, templateId, eventId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.director)
  @Mutation((_returns) => CreateOrUpdateTemplateResponse)
  async deleteTemplate(@Args('templateId') templateId: string): Promise<CreateOrUpdateTemplateResponse> {
    return this.templateMutations.deleteTemplate(templateId);
  }



  /**
   * Queries
   */
  @Query((_returns) => GetTemplatesResponse)
  async getTemplates(@Args('eventId', { nullable: true }) eventId: string) {
    return this.templateQueris.getTemplates(eventId);
  }

  @Query((returns) => GetTemplateResponse)
  async getTemplate(@Args('templateId') templateId: string) {
    return this.templateQueris.getTemplate(templateId);
  }


  @Query((_returns) => GetTemplateSearchResponse)
  async searchTemplates(@Args('eventId') eventId: string, @Args('filter', { nullable: true }) filter: TemplateSearchFilter) {
    return this.templateQueris.searchTemplates(eventId, filter);
  }


  /**
   * Resolvers
   */
  @ResolveField(() => EventDetails)
  async event(@Parent() template: Template) {
    return this.templateFields.event(template);
  }
}