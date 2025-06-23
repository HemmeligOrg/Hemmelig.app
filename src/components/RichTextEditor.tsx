import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  List,
  ListOrdered,
  Quote,
  Type,
  Undo,
  Redo,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);

  const toolbarButtons = [
    { icon: Bold, label: 'Bold', command: 'bold' },
    { icon: Italic, label: 'Italic', command: 'italic' },
    { icon: Strikethrough, label: 'Strikethrough', command: 'strikethrough' },
    { icon: Code, label: 'Code', command: 'code' },
    { icon: Link, label: 'Link', command: 'link' },
    { icon: Type, label: 'Clear Format', command: 'removeFormat' },
  ];

  const formatButtons = [
    { label: 'P', command: 'formatBlock', value: 'p' },
    { label: 'H1', command: 'formatBlock', value: 'h1' },
    { label: 'H2', command: 'formatBlock', value: 'h2' },
    { label: 'H3', command: 'formatBlock', value: 'h3' },
  ];

  const listButtons = [
    { icon: List, label: 'Bullet List', command: 'insertUnorderedList' },
    { icon: ListOrdered, label: 'Numbered List', command: 'insertOrderedList' },
    { icon: Quote, label: 'Quote', command: 'formatBlock', value: 'blockquote' },
  ];

  const actionButtons = [
    { icon: Undo, label: 'Undo', command: 'undo' },
    { icon: Redo, label: 'Redo', command: 'redo' },
  ];

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Toolbar Toggle for Mobile */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setShowToolbar(!showToolbar)}
          className="flex items-center justify-between w-full p-3 bg-slate-700/30 rounded-xl border border-slate-600/30 text-slate-300 hover:text-white transition-all duration-200"
        >
          <span className="text-sm font-medium">Formatting Tools</span>
          {showToolbar ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Toolbar */}
      <div className={`${showToolbar ? 'block' : 'hidden'} sm:block`}>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:flex-wrap p-3 sm:p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
          {/* Format buttons - Mobile: Full width rows */}
          <div className="flex flex-wrap gap-1 w-full sm:w-auto">
            {toolbarButtons.map(({ icon: Icon, label, command }) => (
              <button
                key={command}
                type="button"
                onClick={() => executeCommand(command)}
                className="flex-1 sm:flex-none p-2 rounded-lg bg-slate-600/50 hover:bg-slate-500/50 text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 min-w-[44px] touch-manipulation"
                title={label}
              >
                <Icon className="w-4 h-4 mx-auto" />
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-px h-8 bg-slate-600 mx-2"></div>
          <div className="block sm:hidden w-full h-px bg-slate-600 my-1"></div>

          {/* Text format buttons */}
          <div className="flex gap-1 w-full sm:w-auto">
            {formatButtons.map(({ label, command, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => executeCommand(command, value)}
                className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-slate-600/50 hover:bg-slate-500/50 text-slate-300 hover:text-white transition-all duration-200 text-sm font-medium min-w-[44px] touch-manipulation"
                title={`Format as ${label}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-px h-8 bg-slate-600 mx-2"></div>
          <div className="block sm:hidden w-full h-px bg-slate-600 my-1"></div>

          {/* List buttons */}
          <div className="flex gap-1 w-full sm:w-auto">
            {listButtons.map(({ icon: Icon, label, command, value }) => (
              <button
                key={command}
                type="button"
                onClick={() => executeCommand(command, value)}
                className="flex-1 sm:flex-none p-2 rounded-lg bg-slate-600/50 hover:bg-slate-500/50 text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 min-w-[44px] touch-manipulation"
                title={label}
              >
                <Icon className="w-4 h-4 mx-auto" />
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-px h-8 bg-slate-600 mx-2"></div>
          <div className="block sm:hidden w-full h-px bg-slate-600 my-1"></div>

          {/* Action buttons */}
          <div className="flex gap-1 w-full sm:w-auto">
            {actionButtons.map(({ icon: Icon, label, command }) => (
              <button
                key={command}
                type="button"
                onClick={() => executeCommand(command)}
                className="flex-1 sm:flex-none p-2 rounded-lg bg-slate-600/50 hover:bg-slate-500/50 text-slate-300 hover:text-white transition-all duration-200 hover:scale-105 min-w-[44px] touch-manipulation"
                title={label}
              >
                <Icon className="w-4 h-4 mx-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className={`relative transition-all duration-300 ${isFocused ? 'ring-2 ring-teal-500/50' : ''}`}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Enter your secret message here..."
          className="w-full h-48 sm:h-64 p-4 sm:p-6 bg-slate-700/50 border border-slate-600/50 rounded-xl text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all duration-300 text-sm sm:text-base"
          style={{ lineHeight: '1.6' }}
        />
        
        {/* Character count */}
        <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
          {value.length} characters
        </div>
      </div>
    </div>
  );
}