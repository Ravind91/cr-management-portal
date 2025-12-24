import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmModal({ cr, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Delete Confirmation</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-900 mb-4">
            Are you sure you want to delete this Change Request?
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">CR Code:</span>
              <span className="text-sm font-semibold text-gray-900">{cr.crCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">CR Name:</span>
              <span className="text-sm text-gray-900">{cr.crName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Application:</span>
              <span className="text-sm text-gray-900">{cr.application}</span>
            </div>
          </div>

          <p className="text-sm text-red-600 mt-4 font-medium">
            ⚠️ This action cannot be undone!
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            No, Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}