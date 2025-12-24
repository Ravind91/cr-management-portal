import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertCircle, CheckCircle2, FileText, Upload, Download, File } from 'lucide-react';

export default function EditCRForm({ cr, onClose, onSuccess }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [originalStorageKey, setOriginalStorageKey] = useState(null);
  const [formData, setFormData] = useState({
    crCode: cr.crCode === 'N/A' ? '' : cr.crCode,
    crName: cr.crName === 'N/A' ? '' : cr.crName,
    description: cr.description,
    application: cr.application === 'Not Specified' ? '' : cr.application,
    status: cr.status,
    comments: cr.comments || '',
    uatDate: cr.uatDate || '',
    uatApprovedDate: cr.uatApprovedDate || '',
    productionDate: cr.productionDate || ''
  });
  const [crDocument, setCrDocument] = useState(null);
  const [crDocumentName, setCrDocumentName] = useState(cr.crDocumentName || null);
  const [isDocumentRemoved, setIsDocumentRemoved] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const applications = [
    'Warehouse Manager',
    'API',
    'Web Portal',
    'Support Tool'
  ];

  const allStatuses = ['Pending', 'Approved', 'Rejected', 'In Progress', 'Completed'];

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
              console.log('Found original storage key:', `cr:${key}`);
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
    loadCurrentUser();
    findOriginalStorageKey();
  }, [findOriginalStorageKey]);

  const loadCurrentUser = async () => {
    try {
      const sessionResult = await window.storage.get('current:session').catch(() => null);
      if (sessionResult) {
        const sessionData = JSON.parse(sessionResult.value);
        setCurrentUser(sessionData);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!validTypes.includes(file.type)) {
        setErrors({ ...errors, document: 'Please upload a Word document (.doc or .docx)' });
        e.target.value = '';
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, document: 'File size must be less than 10MB' });
        e.target.value = '';
        return;
      }

      setCrDocument(file);
      setCrDocumentName(file.name);
      setIsDocumentRemoved(false);
      setErrors({ ...errors, document: '' });
    }
    e.target.value = '';
  };

  const handleRemoveDocument = () => {
    setCrDocument(null);
    setCrDocumentName(null);
    setIsDocumentRemoved(true);
    setErrors({ ...errors, document: '' });
  };

  const handleDownloadDocument = async () => {
    try {
      if (crDocument) {
        const url = URL.createObjectURL(crDocument);
        const a = document.createElement('a');
        a.href = url;
        a.download = crDocument.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (originalStorageKey) {
        const docResult = await window.storage.get(`${originalStorageKey}:document`).catch(() => null);
        if (docResult) {
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
        } else {
          setSubmitStatus({ 
            type: 'error', 
            message: 'Document file not found. Please re-upload the document.' 
          });
        }
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: 'Failed to download document. File may be too large or corrupted.' 
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.crCode.trim() && formData.crCode.length > 50) {
      newErrors.crCode = 'CR Code must not exceed 50 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (currentUser?.role === 'BA Team' && !crDocumentName && !crDocument && !isDocumentRemoved) {
      newErrors.document = 'CR Document is required for BA Team';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!currentUser) {
      setSubmitStatus({ 
        type: 'error', 
        message: 'User session not found. Please login again.' 
      });
      return;
    }

    if (!originalStorageKey) {
      setSubmitStatus({ 
        type: 'error', 
        message: 'Could not find original CR. Please try again.' 
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const finalCRCode = formData.crCode.trim() || 'N/A';
      
      // Check if CR Code was changed and if new code already exists
      if (formData.crCode.trim() && formData.crCode.trim() !== cr.crCode && cr.crCode !== 'N/A') {
        const newStorageKey = `cr:${formData.crCode.trim()}`;
        if (newStorageKey !== originalStorageKey) {
          const existingCR = await window.storage.get(newStorageKey).catch(() => null);
          
          if (existingCR) {
            setErrors({ crCode: 'This CR Code already exists' });
            setSubmitStatus({ 
              type: 'error', 
              message: 'CR Code already exists. Please use a different code.' 
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      const updatedCRData = {
        ...cr,
        crCode: finalCRCode,
        crName: formData.crName.trim() || 'N/A',
        description: formData.description,
        application: formData.application || 'N/A',
        status: formData.status,
        comments: formData.comments,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.fullName,
        crDocumentName: crDocumentName,
        uatDate: formData.uatDate || null,
        uatApprovedDate: formData.uatApprovedDate || null,
        productionDate: formData.productionDate || null
      };

      if (formData.status === 'Approved' && cr.status !== 'Approved') {
        updatedCRData.approvedDate = new Date().toISOString().split('T')[0];
        updatedCRData.approvedBy = currentUser.fullName;
        updatedCRData.rejectedDate = null;
        updatedCRData.rejectedBy = null;
      }

      if (formData.status === 'Rejected' && cr.status !== 'Rejected') {
        updatedCRData.rejectedDate = new Date().toISOString().split('T')[0];
        updatedCRData.rejectedBy = currentUser.fullName;
        updatedCRData.approvedDate = null;
        updatedCRData.approvedBy = null;
      }

      if (formData.status === 'Pending' && (cr.status === 'Approved' || cr.status === 'Rejected')) {
        updatedCRData.approvedDate = null;
        updatedCRData.approvedBy = null;
        updatedCRData.rejectedDate = null;
        updatedCRData.rejectedBy = null;
      }

      if (isDocumentRemoved) {
        await window.storage.delete(`${originalStorageKey}:document`).catch(() => {});
        
        updatedCRData.crDocumentName = null;
        updatedCRData.crDocumentSize = null;
        updatedCRData.crDocumentType = null;
        updatedCRData.crDocumentUploadedBy = null;
        updatedCRData.crDocumentUploadedAt = null;
      }

      if (crDocument) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target.result;
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64Content = btoa(binary);
            
            const documentData = {
              name: crDocument.name,
              type: crDocument.type,
              size: crDocument.size,
              content: base64Content,
              uploadedBy: currentUser.fullName,
              uploadedAt: new Date().toISOString()
            };

            await window.storage.set(`${originalStorageKey}:document`, JSON.stringify(documentData));

            updatedCRData.crDocumentName = crDocument.name;
            updatedCRData.crDocumentSize = crDocument.size;
            updatedCRData.crDocumentType = crDocument.type;
            updatedCRData.crDocumentUploadedBy = currentUser.fullName;
            updatedCRData.crDocumentUploadedAt = new Date().toISOString();

            await window.storage.set(originalStorageKey, JSON.stringify(updatedCRData));

            setSubmitStatus({ 
              type: 'success', 
              message: 'Change Request and document updated successfully!' 
            });

            setTimeout(() => {
              if (onSuccess) onSuccess(finalCRCode);
              if (onClose) onClose();
            }, 1500);
          } catch (error) {
            console.error('Error uploading document:', error);
            setSubmitStatus({ 
              type: 'error', 
              message: 'Document too large. Please use a smaller file (max 2MB recommended).' 
            });
            setIsSubmitting(false);
          }
        };
        reader.readAsArrayBuffer(crDocument);
        return;
      }

      await window.storage.set(originalStorageKey, JSON.stringify(updatedCRData));

      setSubmitStatus({ 
        type: 'success', 
        message: 'Change Request updated successfully!' 
      });

      setTimeout(() => {
        if (onSuccess) onSuccess(finalCRCode);
        if (onClose) onClose();
      }, 1500);

    } catch (error) {
      console.error('Error updating CR:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: 'Failed to update Change Request. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBATeam = currentUser?.role === 'BA Team';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Change Request</h2>
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

        <div className="p-6">
          {submitStatus && (
            <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              submitStatus.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {submitStatus.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <p className={`text-sm ${submitStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {submitStatus.message}
              </p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CR Code
              </label>
              <input
                type="text"
                name="crCode"
                value={formData.crCode}
                onChange={handleChange}
                maxLength={50}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.crCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter CR Code"
              />
              {errors.crCode && (
                <p className="mt-1 text-sm text-red-600">{errors.crCode}</p>
              )}
              {formData.crCode && (
                <p className="mt-1 text-xs text-gray-500">{formData.crCode.length}/50 characters</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CR Name
              </label>
              <input
                type="text"
                name="crName"
                value={formData.crName}
                onChange={handleChange}
                maxLength={100}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a short name for this CR"
              />
              {formData.crName && (
                <p className="mt-1 text-xs text-gray-500">{formData.crName.length}/100 characters</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe the change request in detail..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">{formData.description.length} characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application
              </label>
              <select
                name="application"
                value={formData.application}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Application</option>
                {applications.map(app => (
                  <option key={app} value={app}>{app}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isBATeam ? (
                  allStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))
                ) : (
                  <>
                    {cr.status === 'Pending' && (
                      <>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </>
                    )}
                    {cr.status === 'Approved' && (
                      <>
                        <option value="Approved">Approved</option>
                        <option value="Pending">Pending</option>
                      </>
                    )}
                    {cr.status === 'Rejected' && (
                      <>
                        <option value="Rejected">Rejected</option>
                        <option value="Pending">Pending</option>
                      </>
                    )}
                    {(cr.status === 'In Progress' || cr.status === 'Completed') && (
                      <option value={cr.status}>{cr.status}</option>
                    )}
                  </>
                )}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {formData.status === 'Approved' && cr.status !== 'Approved' && 
                  '⚠️ Changing to Approved will set the approval date to today'}
                {formData.status === 'Rejected' && cr.status !== 'Rejected' && 
                  '⚠️ Changing to Rejected will set the rejected date to today'}
                {formData.status === 'Pending' && (cr.status === 'Approved' || cr.status === 'Rejected') && 
                  '⚠️ Changing back to Pending will clear the approval/rejection date'}
              </p>
            </div>

            {isBATeam && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UAT Date
                  </label>
                  <input
                    type="date"
                    name="uatDate"
                    value={formData.uatDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UAT Approved Date
                  </label>
                  <input
                    type="date"
                    name="uatApprovedDate"
                    value={formData.uatApprovedDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Production Date
                  </label>
                  <input
                    type="date"
                    name="productionDate"
                    value={formData.productionDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {isBATeam && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CR Document *
                </label>
                
                {(crDocumentName && !isDocumentRemoved) || crDocument ? (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <File className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-blue-900 font-medium block truncate">
                            {crDocument ? crDocument.name : crDocumentName}
                          </span>
                          {!crDocument && cr.crDocumentUploadedBy && (
                            <span className="text-xs text-blue-700">
                              Uploaded by {cr.crDocumentUploadedBy} on {new Date(cr.crDocumentUploadedAt).toLocaleDateString()}
                            </span>
                          )}
                          {crDocument && (
                            <span className="text-xs text-green-700 font-medium">
                              ✓ New file selected - Ready to upload
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={handleDownloadDocument}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          {crDocument ? 'Preview' : 'Download'}
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveDocument}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-white hover:bg-gray-50">
                  <input
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-blue-600 hover:text-blue-700 font-medium block">
                    {(crDocumentName && !isDocumentRemoved) || crDocument ? 'Click to replace document' : 'Click to upload CR Document'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Word document (.doc, .docx) - Max 2MB recommended</p>
                </label>
                {errors.document && (
                  <p className="mt-1 text-sm text-red-600">{errors.document}</p>
                )}
              </div>
            )}

            {!isBATeam && crDocumentName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CR Document
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="w-5 h-5 text-gray-600" />
                    <div>
                      <span className="text-sm text-gray-900 font-medium block">{crDocumentName}</span>
                      {cr.crDocumentUploadedBy && (
                        <span className="text-xs text-gray-600">
                          Uploaded by {cr.crDocumentUploadedBy} on {new Date(cr.crDocumentUploadedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadDocument}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                rows={3}
                maxLength={300}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Add any additional comments..."
              />
              <p className="mt-1 text-xs text-gray-500">{formData.comments.length}/300 characters</p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span className="font-medium">{isSubmitting ? 'Updating...' : 'Update CR'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}