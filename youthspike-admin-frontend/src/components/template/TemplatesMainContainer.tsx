// components/player/TemplatesMainContainer.tsx
'use client';

import { QueryRef, useReadQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { ITemplateResponse } from '@/types';
import { useMemo } from 'react';

interface TemplatesMainContainerProps {
  queryRef: QueryRef<{ getTemplates: ITemplateResponse }>;
}



export default function TemplatesMainContainer({ queryRef }: TemplatesMainContainerProps) {
  const router = useRouter();
  const { data } = useReadQuery(queryRef);



  const templates = useMemo(() => {
    return data?.getTemplates?.data || [];
  }, [data]);


  return (
    <div className="animate-fade-in">
      <div className="navigation my-8">
        {/* <EventNavigation event={event} /> */}
      </div>


      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
          <h2 className="text-xl font-semibold text-gray-800">
            Email Templates
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and customize your event templates
          </p>
        </div>

        {templates.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No templates found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Event</th>
                  <th className="px-6 py-4 text-center">Images</th>
                  <th className="px-6 py-4 text-center">Placeholders</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {templates.map((template) => (
                  <tr
                    key={template._id}
                    className="hover:bg-indigo-50 transition-all duration-200 cursor-pointer"
                    onClick={() => router.push(`/templates/${template._id}`)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {template.name}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${template.type === "PLAYER"
                            ? "bg-blue-100 text-blue-700"
                            : template.type === "TEAM"
                              ? "bg-green-100 text-green-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                      >
                        {template.type}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-600 truncate max-w-xs">
                      {template.subject}
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {template.event?.name}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-gray-800">
                        {template.images?.length || 0}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-gray-800">
                        {template.placeholders?.length || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
