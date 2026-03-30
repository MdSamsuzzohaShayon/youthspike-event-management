import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, UpdateQuery } from 'mongoose';
import { Template } from 'src/template/template.schema';

@Injectable()
export class TemplateService {
  constructor(@InjectModel(Template.name) private templateModel: Model<Template>) {}

  async query(filter: QueryFilter<Template>) {
    return this.templateModel.find(filter).sort({ name: 1 });
  }

  async findById(templateId: string): Promise<Template | null> {
    try {
      return await this.templateModel.findById(templateId).lean();
    } catch (error) {
      console.error('Error finding template by ID:', error);
      throw error;
    }
  }

  async findByName(name: string) {
    if (!name) return null;
    return this.templateModel.findOne({ name });
  }

  async findOne(filter: QueryFilter<Template>) {
    return this.templateModel.findOne(filter).lean();
  }





  async find(filter: QueryFilter<Template>, offset?: number, limit?: number) {
    let query = this.templateModel.find(filter).sort({ name: -1 }); // always sort for stable pagination

    if (typeof offset === 'number') {
      query = query.skip(offset);
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    return query.lean().exec();
  }


  async create(template: Template) {
    return this.templateModel.create(template);
  }

  async insertMany(templates: Template[]) {
    return this.templateModel.insertMany(templates);
  }

  async update(template: UpdateQuery<Template>, filter: QueryFilter<Template>) {
    const templateObj = { ...template };
    return this.templateModel.findOneAndUpdate(filter, templateObj, { upsert: true, new: true });
  }

  async updateMany(filter: QueryFilter<Template>, updateObj: UpdateQuery<Template>) {
    return this.templateModel.updateMany(filter, updateObj);
  }
  async updateOne(filter: QueryFilter<Template>, updateObj: UpdateQuery<Template>) {
    const updateTemplate = await this.templateModel.updateOne(filter, updateObj);
    return updateTemplate;
  }

  async delete(filter: QueryFilter<Template>) {
    return this.templateModel.deleteMany(filter);
  }
  async deleteOne(filter: QueryFilter<Template>) {
    return this.templateModel.deleteOne(filter);
  }
  async deleteMany(filter: QueryFilter<Template>) {
    return this.templateModel.deleteMany(filter);
  }

  async countDocuments(filter: QueryFilter<Template>) {
    return this.templateModel.countDocuments();
  }
}
