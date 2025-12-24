// NewCRForm.jsx

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle2, FileText, Upload, Download, File } from 'lucide-react';

export default function NewCRForm({ onClose, onSuccess }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    crCode: '',
    crName: '',
    description: '',
    application: '',
    comments: '',
    uatDate: '',
    uatApprovedDate: '',
    productionDate: ''
  });
  const [crDocument, setCrDocument] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const applications = [
    'Warehouse Manager',
    'API',
    'Web Portal',
    'Support Tool'
  ];

  useEffect(() => {
    loadCurrentUser();
  }, []);

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
      setErrors({ ...errors, document: '' });
    }
    e.target.value = '';
  };

  const handleRemoveDocument = () => {
    setCrDocument(null);
    setErrors({ ...errors, document: '' });
  };

  const handleDownloadDocument = () => {
    if (crDocument) {
      const url = URL.createObjectURL(crDocument);
      const a = document.createElement('a');
      a.href = url;
      a.download = crDocument.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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

    if (currentUser?.role === 'BA Team' && !crDocument) {
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

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Determine the final CR Code and storage key
      let finalCRCode;
      let storageKey;
      
      if (formData.crCode.trim()) {
        // User provided a CR Code - use it
        finalCRCode = formData.crCode.trim();
        storageKey = `cr:${finalCRCode}`;
        
        // Check if this CR Code already exists
        const existingCR = await window.storage.get(storageKey).catch(() => null);
        if (existingCR) {
          setErrors({ crCode: 'This CR Code already exists' });
          setSubmitStatus({ 
            type: 'error', 
            message: 'CR Code already exists. Please use a different code.' 
          });
          setIsSubmitting(false);
          return;
        }
      } else {
        // No CR Code provided - use timestamp
        finalCRCode = 'N/A';
        storageKey = `cr:${Date.now()}`;
      }

      const crData = {
        crCode: finalCRCode,
        crName: formData.crName.trim() || 'N/A',
        description: formData.description,
        application: formData.application || 'N/A',
        requester: currentUser.fullName,
        requesterEmail: currentUser.email,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        approvedDate: null,
        approvedBy: null,
        rejectedDate: null,
        rejectedBy: null,
        comments: formData.comments,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.fullName,
        crDocumentName: crDocument ? crDocument.name : null,
        crDocumentSize: crDocument ? crDocument.size : null,
        crDocumentType: crDocument ? crDocument.type : null,
        crDocumentUploadedBy: crDocument ? currentUser.fullName : null,
        crDocumentUploadedAt: crDocument ? new Date().toISOString() : null,
        uatDate: formData.uatDate || null,
        uatApprovedDate: formData.uatApprovedDate || null,
        productionDate: formData.productionDate || null
      };

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

            await window.storage.set(`${storageKey}:document`, JSON.stringify(documentData));
            await window.storage.set(storageKey, JSON.stringify(crData));

            const crListResult = await window.storage.get('cr:list').catch(() => null);
            let crList = crListResult ? JSON.parse(crListResult.value) : [];
            crList.push(storageKey.replace('cr:', ''));
            await window.storage.set('cr:list', JSON.stringify(crList));

            setSubmitStatus({ 
              type: 'success', 
              message: 'Change Request created successfully with document!' 
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

      await window.storage.set(storageKey, JSON.stringify(crData));

      const crListResult = await window.storage.get('cr:list').catch(() => null);
      let crList = crListResult ? JSON.parse(crListResult.value) : [];
      crList.push(storageKey.replace('cr:', ''));
      await window.storage.set('cr:list', JSON.stringify(crList));

      setSubmitStatus({ 
        type: 'success', 
        message: 'Change Request created successfully!' 
      });

      setTimeout(() => {
        if (onSuccess) onSuccess(finalCRCode);
        if (onClose) onClose();
      }, 1500);

    } catch (error) {
      console.error('Error creating CR:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: `Failed to create Change Request: ${error.message}` 
      });
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
              <h2 className="text-xl font-bold text-gray-900">Create New Change Request</h2>
              <p className="text-sm text-gray-500">Fill in the details below</p>
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
                placeholder="Enter CR Code (optional)"
              />
              {errors.crCode && (
                <p className="mt-1 text-sm text-red-600">{errors.crCode}</p>
              )}
              {formData.crCode && (
                <p className="mt-1 text-xs text-gray-500">
                  {formData.crCode.length}/50 characters
                </p>
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
                <p className="mt-1 text-xs text-gray-500">
                  {formData.crName.length}/100 characters
                </p>
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
                placeholder="Describe the change request in detail... (Required)"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">{formData.description.length} characters (minimum 10)</p>
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
                Requester
              </label>
              <input
                type="text"
                value={currentUser?.fullName || 'Loading...'}
                readOnly
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Date
              </label>
              <input
                type="text"
                value={new Date().toISOString().split('T')[0]}
                readOnly
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
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
                
                {crDocument && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <File className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-blue-900 font-medium block truncate">
                            {crDocument.name}
                          </span>
                          <span className="text-xs text-green-700 font-medium">
                            ✓ File selected - Ready to upload
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={handleDownloadDocument}
                          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Preview
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
                )}

                <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-white hover:bg-gray-50">
                  <input
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-blue-600 hover:text-blue-700 font-medium block">
                    {crDocument ? 'Click to replace document' : 'Click to upload CR Document'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Word document (.doc, .docx) - Max 2MB recommended</p>
                </label>
                {errors.document && (
                  <p className="mt-1 text-sm text-red-600">{errors.document}</p>
                )}
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
            <span className="font-medium">{isSubmitting ? 'Creating...' : 'Create CR'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}