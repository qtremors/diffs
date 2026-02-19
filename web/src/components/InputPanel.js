"use client";

import React from 'react';
import { Upload, FileText } from 'lucide-react';

export default function InputPanel({ oldText, setOldText, newText, setNewText }) {
  const handleFileUpload = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (target === 'old') setOldText(event.target.result);
        if (target === 'new') setNewText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <FileText size={16} className="text-sky-400" />
            Original Text
          </label>
          <label className="text-xs cursor-pointer flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
            <Upload size={14} />
            <span>Upload File</span>
            <input 
              type="file" 
              className="hidden" 
              onChange={(e) => handleFileUpload(e, 'old')}
            />
          </label>
        </div>
        <textarea
          value={oldText}
          onChange={(e) => setOldText(e.target.value)}
          placeholder="Paste original text here..."
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <FileText size={16} className="text-emerald-400" />
            Modified Text
          </label>
          <label className="text-xs cursor-pointer flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
            <Upload size={14} />
            <span>Upload File</span>
            <input 
              type="file" 
              className="hidden" 
              onChange={(e) => handleFileUpload(e, 'new')}
            />
          </label>
        </div>
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Paste modified text here..."
        />
      </div>
    </div>
  );
}
