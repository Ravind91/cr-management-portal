import React, { useState, useEffect, useCallback } from 'react';
import { X, FileText, File, Calendar, User, Download } from 'lucide-react';

export default function DescriptionModal({ cr, onClose }) {
  const [downloadError, setDownloadError] = useState(null);
  const [originalStorageKey, setOriginalStorageKey] = useState(null);

  const findOriginalStorageKey = useCallback(async () => {
    try {
      const crListResult = await window.storage.get('cr:list').catch(() => null);
      if (crListResult) {
        const crList = JSON.parse(crListResult.value);
        
        for (const key of crList) {
          const crResult = await window.storage.get(`cr:${key}`).catch(() => null);
          if (crResult) {
            const storedCR = JSON.parse(crResult.value);
            if (storedCR.createdAt === cr.createdAt && storedCR.requester === cr.requester && storedCR.description === cr.description) {
              setOriginalStorageKey(`cr:${key}`);
              console.log('Found original storage key for document:', `cr:${key}`);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error finding original storage key:', error);
    }
  }, [cr.createdAt, cr.requester, cr.description]);

  useEffect(() => {
    console.log('CR Details Modal - Full CR Object:', cr);
    console.log('Has document?', {
      hasDocumentName: !!cr.crDocumentName,
      documentName: cr.crDocumentName,
      documentSize: cr.crDocumentSize,
      uploadedBy: cr.crDocumentUploadedBy,
      uploadedAt: cr.crDocumentUploadedAt
    });
    
    if (cr.crDocumentName) {
      findOriginalStorageKey();
    }
  }, [cr, cr.crDocumentName, findOriginalStorageKey]);

  const handleDownloadDocument = async () => {
    try {
      setDownloadError(null);
      
      console.log('Attempting to download document for CR:', cr.crCode);
      console.log('Original storage key:', originalStorageKey);
      console.log('Document metadata:', {
        name: cr.crDocumentName,
        size: cr.crDocumentSize,
        type: cr.crDocumentType,
        uploadedBy: cr.crDocumentUploadedBy
      });

      if (!originalStorageKey) {
        console.error('Original storage key not found');
        setDownloadError('Unable to locate document. Please try refreshing the page.');
        return;
      }
      
      const docResult = await window.storage.get(`${originalStorageKey}:document`).catch((err) => {
        console.error('Error fetching document:', err);
        return null;
      });
      
      if (docResult) {
        console.log('Document found in storage');
        const docData = JSON.parse(docResult.value);
        
        const byteCharacters = atob(docData.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: docData.type });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = docData.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Document downloaded successfully');
      } else {
        console.error('Document not found in storage for key:', `${originalStorageKey}:document`);
        setDownloadError('Document file not found in storage. It may have been uploaded but not saved properly.');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      setDownloadError('Failed to download document. File may be corrupted or too large.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">CR Details</h2>
              <p className="text-sm text-gray-500">{cr.crCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* CR Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">CR Code</p>
                <p className="text-base font-semibold text-gray-900">{cr.crCode}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">CR Name</p>
                <p className="text-base font-semibold text-gray-900">{cr.crName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Application</p>
                <p className="text-base text-gray-900">{cr.application}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Requester</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <p className="text-base text-gray-900">{cr.requester}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Request Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-base text-gray-900">{cr.requestDate}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  cr.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  cr.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  cr.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  cr.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  cr.status === 'Completed' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {cr.status}
                </span>
              </div>
            </div>

            {/* Approval/Rejection Details */}
            {(cr.approvedDate || cr.rejectedDate) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-200">
                {cr.approvedDate && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Approved Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <p className="text-base text-green-700 font-medium">{cr.approvedDate}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Approved By</p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-500" />
                        <p className="text-base text-gray-900">{cr.approvedBy}</p>
                      </div>
                    </div>
                  </>
                )}
                {cr.rejectedDate && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Rejected Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-500" />
                        <p className="text-base text-red-700 font-medium">{cr.rejectedDate}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Rejected By</p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-red-500" />
                        <p className="text-base text-gray-900">{cr.rejectedBy}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* New Date Fields Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">UAT Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <p className="text-base text-gray-900">{cr.uatDate || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">UAT Approved Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <p className="text-base text-gray-900">{cr.uatApprovedDate || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Production Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <p className="text-base text-gray-900">{cr.productionDate || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* CR Document Section */}
            {cr.crDocumentName ? (
              <div className="pb-6 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <File className="w-5 h-5 text-blue-600" />
                  CR Document
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <File className="w-6 h-6 text-blue-600" />
                        <p className="text-base font-semibold text-blue-900">{cr.crDocumentName}</p>
                      </div>
                      <div className="space-y-1">
                        {cr.crDocumentSize && (
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Size:</span> {(cr.crDocumentSize / 1024).toFixed(2)} KB
                          </p>
                        )}
                        {cr.crDocumentType && (
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Type:</span> {cr.crDocumentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'Word Document (.docx)' : 'Word Document (.doc)'}
                          </p>
                        )}
                        {cr.crDocumentUploadedBy && (
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Uploaded by:</span> {cr.crDocumentUploadedBy}
                          </p>
                        )}
                        {cr.crDocumentUploadedAt && (
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Uploaded on:</span> {new Date(cr.crDocumentUploadedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-blue-300">
                    {!originalStorageKey && (
                      <p className="text-xs text-orange-600 mb-2">⏳ Locating document...</p>
                    )}
                    <button
                      onClick={handleDownloadDocument}
                      disabled={!originalStorageKey}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Download className="w-5 h-5" />
                      Download Document
                    </button>
                    {downloadError && (
                      <p className="text-xs text-red-600 mt-2">⚠️ {downloadError}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="pb-6 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <File className="w-5 h-5 text-gray-400" />
                  CR Document
                </h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <File className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No document uploaded for this CR</p>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="pb-6 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Description</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{cr.description}</p>
              </div>
            </div>

            {/* Comments if available */}
            {cr.comments && (
              <div className="pb-6 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Comments</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{cr.comments}</p>
                </div>
              </div>
            )}

            {/* Metadata */}
            {(cr.createdBy || cr.updatedBy) && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Metadata</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                  {cr.createdBy && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Created by:</span> {cr.createdBy} on {new Date(cr.createdAt).toLocaleString()}
                    </p>
                  )}
                  {cr.updatedBy && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Last updated by:</span> {cr.updatedBy} on {new Date(cr.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}