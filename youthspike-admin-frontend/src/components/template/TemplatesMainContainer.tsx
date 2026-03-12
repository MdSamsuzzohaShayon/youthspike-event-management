// components/player/TemplatesMainContainer.tsx
'use client';

import { QueryRef, useMutation, useReadQuery } from '@apollo/client/react';
import { IResponse, ITemplate, ITemplateResponse } from '@/types';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLdoId } from '@/lib/LdoProvider';
import TemplateRow from './TemplateRow';
import { DELETE_TEMPLATE, GET_TEMPLATES, UPDATE_TEMPLATE } from '@/graphql/templates';
import Loader from '../elements/Loader';
import { useMessage } from '@/lib/MessageProvider';
import { handleError } from '@/utils/handleError';
import Image from 'next/image';

interface TemplatesMainContainerProps {
  queryRef: QueryRef<{ getTemplates: ITemplateResponse }>;
  eventId: string;
}

interface IUpdateTemplate extends IResponse {
  data: ITemplate;
}

type UpdateTemplateMutationData = { updateTemplate: IUpdateTemplate };
type UpdateTemplateMutationVars = { input: Partial<ITemplate>, templateId: string, eventId: string };

type DeleteTemplateMutationData = { deleteTemplate: IResponse };
type DeleteTemplateMutationVars = { templateId: string };

export default function TemplatesMainContainer({ queryRef, eventId }: TemplatesMainContainerProps) {
  const { ldoIdUrl } = useLdoId();
  const { showMessage } = useMessage();
  const { data } = useReadQuery(queryRef);
  const [mutateTemplate, { loading: mutateLoading }] = useMutation<UpdateTemplateMutationData, UpdateTemplateMutationVars>(UPDATE_TEMPLATE);
  const [deleteTemplate, { loading: deleteLoading }] = useMutation<DeleteTemplateMutationData, DeleteTemplateMutationVars>(DELETE_TEMPLATE);
  const [searchTerm, setSearchTerm] = useState('');

  // Memoization
  const templates = useMemo(() => {
    return data?.getTemplates?.data || [];
  }, [data]);

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    return templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [templates, searchTerm]);

  const handleDelete = async (
    e: React.SyntheticEvent,
    templateId: string
  ) => {
    e.preventDefault();

    try {
      await deleteTemplate({
        variables: { templateId },

        update(cache, { data }) {
          if (!data?.deleteTemplate?.success) return;

          // ✅ Read existing cache
          const existing = cache.readQuery<{
            getTemplates: ITemplateResponse;
          }>({
            query: GET_TEMPLATES,
            variables: { eventId },
          });

          if (!existing) return;

          // ✅ Remove deleted template
          const updatedTemplates =
            existing.getTemplates.data.filter(
              (t) => t._id !== templateId
            );

          // ✅ Write back
          cache.writeQuery({
            query: GET_TEMPLATES,
            variables: { eventId },
            data: {
              getTemplates: {
                ...existing.getTemplates,
                data: updatedTemplates,
              },
            },
          });
        },
      });
    } catch (err: any) {
      handleError({ error: err, showMessage });
    }
  };

  const handleTypeChange = async (
    e: React.SyntheticEvent,
    templateId: string,
    input: Partial<ITemplate>
  ) => {
    e.preventDefault();

    try {
      await mutateTemplate({
        variables: { input, templateId, eventId },

        update(cache, { data }) {
          const updatedTemplate =
            data?.updateTemplate?.data;

          if (!updatedTemplate) return;

          const existing = cache.readQuery<{
            getTemplates: ITemplateResponse;
          }>({
            query: GET_TEMPLATES,
            variables: { eventId },
          });

          if (!existing) return;

          // ✅ enforce single default template
          const updatedTemplates =
            existing.getTemplates.data.map((t) => {

              // If updated template is default
              if (updatedTemplate.default) {
                return {
                  ...t,
                  ...(t._id === updatedTemplate._id
                    ? updatedTemplate
                    : { default: false }),
                };
              }

              // normal update
              return t._id === updatedTemplate._id
                ? updatedTemplate
                : t;
            });

          cache.writeQuery({
            query: GET_TEMPLATES,
            variables: { eventId },
            data: {
              getTemplates: {
                ...existing.getTemplates,
                data: updatedTemplates,
              },
            },
          });
        },
      });
    } catch (err: any) {
      handleError({ error: err, showMessage });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 animate-fadeIn">
      {/* Header Section with Gradient */}
      <div className="max-w-7xl mx-auto">
        <div className="relative mb-8 rounded-2xl bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-transparent p-8">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
          <div className="relative">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2">
              Email Templates
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Manage and customize your event templates with our intuitive template builder
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/5 group-hover:to-yellow-500/0 rounded-xl transition-all duration-500" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-400 text-sm font-medium">Total Templates</h3>
                <Image src="/icons/sent-email.svg" alt="templates" width={24} height={24} className="opacity-50 group-hover:opacity-100 transition-opacity svg-white" />
              </div>
              <p className="text-3xl font-bold text-white">{templates.length}</p>
            </div>
          </div>

          <div className="group relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/5 group-hover:to-yellow-500/0 rounded-xl transition-all duration-500" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-400 text-sm font-medium">Default Template</h3>
                <Image src="/icons/checked.svg" alt="default" width={24} height={24} className="opacity-50 group-hover:opacity-100 transition-opacity svg-white" />
              </div>
              <p className="text-3xl font-bold text-white">
                {templates.filter(t => t.default).length || 0}
              </p>
            </div>
          </div>

          <div className="group relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/10">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/5 group-hover:to-yellow-500/0 rounded-xl transition-all duration-500" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-400 text-sm font-medium">Total Images</h3>
                <Image src="/icons/group.svg" alt="images" width={24} height={24} className="opacity-50 group-hover:opacity-100 transition-opacity svg-white" />
              </div>
              <p className="text-3xl font-bold text-white">
                {templates.reduce((acc, t) => acc + (t.images?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Image src="/icons/search.svg" alt="search" width={20} height={20} className="text-gray-500 svg-white" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-300"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Link
            href={`/${eventId}/templates/new/${ldoIdUrl}`}
            className="btn-info"
          >
            <span className="relative flex items-center gap-2">
              <Image src="/icons/plus.svg" alt="add" width={20} height={20} className="svg-black" />
              Create New Template
            </span>
          </Link>
        </div>

        {/* Templates Table */}
        <div className="relative rounded-2xl bg-gray-800/30 backdrop-blur-sm border border-gray-700">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-yellow-500/20 to-yellow-600/5 border-b border-gray-700">
            <div className="col-span-3 text-xs font-semibold text-yellow-400 uppercase tracking-wider">Name</div>
            <div className="col-span-3 text-xs font-semibold text-yellow-400 uppercase tracking-wider">Subject</div>
            <div className="col-span-2 text-xs font-semibold text-yellow-400 uppercase tracking-wider">Images</div>
            <div className="col-span-2 text-xs font-semibold text-yellow-400 uppercase tracking-wider">Default</div>
            <div className="col-span-2 text-xs font-semibold text-yellow-400 uppercase tracking-wider text-right">Actions</div>
          </div>

          {/* Table Body */}
          {mutateLoading || deleteLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-20 h-20 mb-4 opacity-50">
                <Image src="/icons/alert.svg" alt="no data" width={80} height={80} className="svg-white" />
              </div>
              <p className="text-gray-500 text-lg mb-2">No templates found</p>
              <p className="text-gray-600 text-sm text-center max-w-md">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first template'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {filteredTemplates.map((template, index) => (
                <TemplateRow
                  key={template._id || index}
                  template={template}
                  onDelete={handleDelete}
                  onChange={handleTypeChange}
                  eventId={eventId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
          <p>Showing {filteredTemplates.length} of {templates.length} templates</p>
          {filteredTemplates.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>All systems operational</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}