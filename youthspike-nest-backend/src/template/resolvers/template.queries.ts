import { TemplateService } from 'src/template/template.service';
import { GroupService } from 'src/group/group.service';
import { HttpStatus, Injectable } from '@nestjs/common';
import { AppResponse } from 'src/shared/response';
import { EventService } from 'src/event/event.service';
import { TemplateSearchFilter } from './template.input';
import { QueryFilter } from 'mongoose';
import { Template } from '../template.schema';

// ITemplateQueries

@Injectable()
export class TemplateQueries {
  constructor(
    private eventService: EventService,
    private templateService: TemplateService,
    private groupService: GroupService,
  ) { }

  async getTemplates(eventId: string) {
    try {
      const query: Record<string, any> = {};
      if (eventId) query.event = eventId;
      const templates = await this.templateService.find(query);
      return {
        code: HttpStatus.OK,
        success: true,
        message: 'List of templates!',
        data: templates,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

  async getTemplate(templateId: string) {
    try {
      const templateExist = await this.templateService.findById(templateId);
      // getPlayer Rankings
      if (!templateExist) return AppResponse.notFound('Template');

      return {
        code: HttpStatus.OK,
        success: true,
        data: templateExist,
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }



  async searchTemplates(eventId: string, filter: TemplateSearchFilter) {
    try {
      // event, templates, matches, nets, rounds
      const [event, groups] = await Promise.all([
        this.eventService.findOne({ _id: eventId }),
        this.groupService.find({ event: eventId }),
      ]);

      const templateQuery: QueryFilter<Template> = { event: eventId };

      if (filter?.search) {
        templateQuery.name = { $regex: filter.search, $options: 'i' }; // case-insensitive search
      }

      // Default pagination (if missing)
      const offset = filter?.offset ?? 0;
      const limit = filter?.limit ?? 30;

      const templates = await this.templateService.find(templateQuery, offset, limit);



      return {
        code: HttpStatus.OK,
        success: true,
        data: {
          event,
          templates,
          groups
        },
      };
    } catch (err) {
      return AppResponse.handleError(err);
    }
  }

}
