// components/player/TemplateRow.tsx
'use client';

import { ITemplate } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface ITemplateRowProps {
    template: ITemplate;
    onDelete: (e: React.SyntheticEvent, templateId: string) => void;
    onChange: (e: React.SyntheticEvent, templateId: string, input: Partial<ITemplate>) => void;
    eventId: string
}

function TemplateRow({ template, onDelete, onChange, eventId }: ITemplateRowProps) {
    const [showActions, setShowActions] = useState<boolean>(false);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowActions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div 
            className="grid grid-cols-12 gap-4 px-6 py-4 items-center group hover:bg-gradient-to-r hover:from-yellow-500/5 hover:to-transparent transition-all duration-300"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Name Column */}
            <div className="col-span-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Image src="/icons/sent-email.svg" alt="template" width={16} height={16} className="w-4 svg-white opacity-75" />
                    </div>
                    <span className="text-white font-medium truncate">{template.name}</span>
                </div>
            </div>

            {/* Subject Column */}
            <div className="col-span-3">
                <span className="text-gray-400 text-sm truncate block">
                    {template.subject || 'No subject'}
                </span>
            </div>

            {/* Images Column */}
            <div className="col-span-2">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                        <Image src="/icons/upload.svg" alt="images" width={12} height={12} className="svg-white opacity-75" />
                    </div>
                    <span className="text-gray-300">{template?.images?.length || 0}</span>
                </div>
            </div>

            {/* Default Column */}
            <div className="col-span-2">
                {template?.default ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                        <span className="text-xs font-medium text-yellow-500">Default</span>
                    </div>
                ) : (
                    <span className="text-gray-600 text-sm">—</span>
                )}
            </div>

            {/* Actions Column */}
            <div className="col-span-2 relative flex justify-end" ref={menuRef}>
                <button
                    onClick={() => setShowActions(!showActions)}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                        showActions || isHovered 
                            ? 'bg-yellow-500/20 text-yellow-500' 
                            : 'text-gray-500 hover:bg-gray-700/50'
                    }`}
                >
                    <Image 
                        src="/icons/dots-vertical.svg" 
                        alt="actions" 
                        width={20} 
                        height={20} 
                        className={`transition-transform duration-300 ${
                            showActions ? 'rotate-90' : ''
                        } svg-current`}
                        style={{ 
                            filter: showActions || isHovered ? 'brightness(0) invert(0.8)' : 'brightness(0) invert(0.6)' 
                        }}
                    />
                </button>

                {/* Dropdown Menu */}
                {showActions && (
                    <div className="absolute right-0 top-12 w-56 z-50 animate-slideDown">
                        <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden backdrop-blur-sm">
                            {/* Menu Header */}
                            <div className="px-4 py-3 bg-gradient-to-r from-yellow-500/10 to-transparent border-b border-gray-700">
                                <p className="text-xs font-medium text-yellow-500">Actions</p>
                            </div>

                            {/* Menu Items */}
                            <div className="p-2">
                                <button
                                    onClick={(e) => {
                                        onChange(e, template._id, { default: true });
                                        setShowActions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all duration-200 group/item"
                                >
                                    <Image src="/icons/checked.svg" alt="default" width={18} height={18} className="opacity-50 group-hover/item:opacity-100 svg-white" />
                                    <span>Make it default</span>
                                </button>

                                <Link
                                    href={`/${eventId}/templates/${template._id}`}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all duration-200 group/item"
                                    onClick={() => setShowActions(false)}
                                >
                                    <Image src="/icons/pencil.svg" alt="edit" width={18} height={18} className="opacity-50 group-hover/item:opacity-100 svg-white" />
                                    <span>Edit template</span>
                                </Link>

                                <Link
                                    href={`/${eventId}/templates/${template._id}`}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all duration-200 group/item"
                                    onClick={() => setShowActions(false)}
                                >
                                    <Image src="/icons/eye-open.svg" alt="view" width={18} height={18} className="opacity-50 group-hover/item:opacity-100 svg-white" />
                                    <span>View template</span>
                                </Link>

                                <div className="my-2 border-t border-gray-700" />

                                <button
                                    onClick={(e) => {
                                        onDelete(e, template._id);
                                        setShowActions(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 group/item"
                                >
                                    <Image src="/icons/delete.svg" alt="delete" width={18} height={18} className="opacity-50 group-hover/item:opacity-100 svg-white" />
                                    <span>Delete template</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TemplateRow;