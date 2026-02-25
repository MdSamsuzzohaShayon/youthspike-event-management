import { HttpStatus, Injectable } from '@nestjs/common';
import { EventService } from 'src/event/event.service';
import { TemplateService } from 'src/template/template.service';

import { AppResponse } from 'src/shared/response';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { Template } from '../template.schema';
import { CreateTemplateInput, UpdateTemplateInput } from './template.input';
import { CreateOrUpdateTemplateResponse } from './template.response';
import * as GraphQLUploadModule from 'graphql-upload/GraphQLUpload.mjs';
const GraphQLUpload = GraphQLUploadModule.default;

@Injectable()
export class TemplateMutations {
  constructor(
    private eventService: EventService,
    private templateService: TemplateService,
    private playerRankingService: PlayerRankingService,
  ) { }



  async singleDelete(templateExist: Template) {


    const updatePromises = [];
    updatePromises.push(this.playerRankingService.deleteOne({ template: templateExist._id }));
    updatePromises.push(this.templateService.delete({ _id: templateExist._id }));
    await Promise.all(updatePromises);
  }

  async createTemplate(
    input: CreateTemplateInput
  ): Promise<CreateOrUpdateTemplateResponse> {
    try {

      const templateExist = await this.templateService.findOne({ name: input.name, event: input.event });
      if (templateExist) {
        return AppResponse.handleError({
          code: 406,
          success: false,
          message: 'There is already a template exist with this name in this event!',
        });
      }



      const newTemplate = await this.templateService.create(input);

      if (!newTemplate) {
        return AppResponse.handleError({ code: 406, success: false, message: "Template is not created successfully!" })
      }

      const promiseOperations = [];
      promiseOperations.push(this.eventService.updateOne({ _id: input.event }, { $addToSet: { templates: String(newTemplate._id) } }));

      const [createdTemplate, ...promises] = await Promise.all([this.templateService.findOne({ _id: newTemplate._id }),
      ...promiseOperations]);


      return {
        code: HttpStatus.CREATED,
        success: true,
        message: 'A template has been created successfully',
        data: createdTemplate,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async updateTemplate(
    input: UpdateTemplateInput,
    templateId: string,
    eventId: string,
  ): Promise<CreateOrUpdateTemplateResponse> {
    try {
      const [templateExist, eventExist] = await Promise.all([
        this.templateService.findById(templateId),
        this.eventService.findById(eventId),
      ]);
      if (!templateExist) return AppResponse.notFound('Template');
      if (!eventExist) return AppResponse.notFound('Event');

      const updatePromises = [];
      const templateObj: Partial<Template> = { ...input };




      updatePromises.push(this.templateService.updateOne({ _id: templateId }, templateObj));


      await Promise.all(updatePromises);
      const updatedTemplate = await this.templateService.findById(templateId);
      if (!updatedTemplate) {
        return AppResponse.notFound('Template');
      }


      return {
        code: HttpStatus.ACCEPTED,
        success: true,
        message: 'A template has been updated successfully',
        data: updatedTemplate,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }


  async deleteTemplate(templateId: string): Promise<CreateOrUpdateTemplateResponse> {
    try {
      const templateExist = await this.templateService.findById(templateId);
      if (!templateExist) return AppResponse.notFound('Template');
      await this.singleDelete(templateExist);
      return {
        code: HttpStatus.NO_CONTENT,
        success: true,
        message: 'A template has been deleted successfully',
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }



}
