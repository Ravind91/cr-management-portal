// Dashboard.jsx

import NewCRForm from './NewCRForm';
import EditCRForm from './EditCRForm';
import DescriptionModal from './DescriptionModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import ChangePasswordModal from './ChangePasswordModal';
import Toast from './Toast';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  LogOut,
  Plus,
  Search,
  Filter,
  User,
  Calendar,
  AlertCircle,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  KeyRound,
  ChevronDown
} from 'lucide-react';

export default function Dashboard({ onNavigate }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changeRequests, setChangeRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showNewCRForm, setShowNewCRForm] = useState(false);
  const [selectedCR, setSelectedCR] = useState(null);
  const [editingCR, setEditingCR] = useState(null);
  const [deletingCR, setDeletingCR] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [toast, setToast] = useState(null);
  
  // New date filter state
  const [showDateFilters, setShowDateFilters] = useState(false);
  const [dateFilterType, setDateFilterType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadUserSession();
    loadChangeRequests();
  }, []);

  useEffect(() => {
    // Close profile menu when clicking outside
    const handleClickOutside = (event) => {
      const profileButton = document.getElementById('profile-menu-button');
      const profileMenu = document.getElementById('profile-menu');
      
      if (profileButton && profileMenu && 
          !profileButton.contains(event.target) && 
          !profileMenu.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const loadUserSession = async () => {
    try {
      const sessionResult = await window.storage.get('current:session').catch(() => null);
      
      if (sessionResult) {
        const sessionData = JSON.parse(sessionResult.value);
        setCurrentUser(sessionData);
      } else {
        console.log('No active session found');
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChangeRequests = async () => {
    try {
      const crListResult = await window.storage.get('cr:list').catch(() => null);
      
      if (crListResult) {
        const crList = JSON.parse(crListResult.value);
        const requests = [];
        
        for (const crId of crList) {
          const crResult = await window.storage.get(`cr:${crId}`).catch(() => null);
          if (crResult) {
            requests.push(JSON.parse(crResult.value));
          }
        }
        
        requests.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.requestDate);
          const dateB = new Date(b.createdAt || b.requestDate);
          return dateB - dateA;
        });
        
        setChangeRequests(requests);
      } else {
        setChangeRequests([]);
      }
    } catch (error) {
      console.error('Error loading change requests:', error);
      setChangeRequests([]);
    }
  };

  const handleLogout = async () => {
    try {
      await window.storage.delete('current:session');
      setCurrentUser(null);
      if (onNavigate) onNavigate('login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeleteCR = async (cr) => {
    try {
      await window.storage.delete(`cr:${cr.crCode}`);

      const crListResult = await window.storage.get('cr:list').catch(() => null);
      if (crListResult) {
        let crList = JSON.parse(crListResult.value);
        crList = crList.filter(code => code !== cr.crCode);
        await window.storage.set('cr:list', JSON.stringify(crList));
      }

      setDeletingCR(null);
      loadChangeRequests();
      setToast({ message: `CR "${cr.crCode}" deleted successfully!`, type: 'success' });
    } catch (error) {
      console.error('Error deleting CR:', error);
      setToast({ message: 'Failed to delete CR. Please try again.', type: 'error' });
    }
  };

  const handleDateSearch = () => {
    setCurrentPage(1);
  };

  const clearDateFilters = () => {
    setDateFilterType('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const stats = {
    total: changeRequests.length,
    pending: changeRequests.filter(cr => cr.status === 'Pending').length,
    approved: changeRequests.filter(cr => cr.status === 'Approved').length,
    rejected: changeRequests.filter(cr => cr.status === 'Rejected').length,
    inProgress: changeRequests.filter(cr => cr.status === 'In Progress').length,
    completed: changeRequests.filter(cr => cr.status === 'Completed').length
  };

  const filteredRequests = useMemo(() => {
    let filtered = [...changeRequests];

    if (searchTerm) {
      filtered = filtered.filter(cr => {
        const matchesSearch = cr.crCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             cr.crName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             cr.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             cr.application?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      });
    }

    if (filterStatus !== 'All') {
      filtered = filtered.filter(cr => cr.status === filterStatus);
    }

    if (dateFilterType && (dateFrom || dateTo)) {
      filtered = filtered.filter(cr => {
        let dateValue = null;
        
        switch(dateFilterType) {
          case 'requestDate':
            dateValue = cr.requestDate;
            break;
          case 'approvedDate':
            dateValue = cr.approvedDate;
            break;
          case 'rejectedDate':
            dateValue = cr.rejectedDate;
            break;
          case 'uatDate':
            dateValue = cr.uatDate;
            break;
          case 'uatApprovedDate':
            dateValue = cr.uatApprovedDate;
            break;
          case 'productionDate':
            dateValue = cr.productionDate;
            break;
          default:
            return true;
        }
        
        if (!dateValue) return false;
        
        if (dateFrom && dateValue < dateFrom) return false;
        if (dateTo && dateValue > dateTo) return false;
        
        return true;
      });
    }

    return filtered;
  }, [changeRequests, searchTerm, filterStatus, dateFilterType, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredRequests.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleExportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredRequests.map(cr => ({
        'CR Code': cr.crCode || 'N/A',
        'CR Name': cr.crName || 'N/A',
        'Application': cr.application || 'N/A',
        'Requester': cr.requester || 'N/A',
        'Request Date': cr.requestDate || 'N/A',
        'Approved Date': cr.approvedDate || 'N/A',
        'Rejected Date': cr.rejectedDate || 'N/A',
        'UAT Date': cr.uatDate || 'N/A',
        'UAT Approved Date': cr.uatApprovedDate || 'N/A',
        'Production Date': cr.productionDate || 'N/A',
        'Status': cr.status || 'N/A'
      }));

      // Create CSV content
      const headers = ['CR Code', 'CR Name', 'Application', 'Requester', 'Request Date', 'Approved Date', 'Rejected Date', 'UAT Date', 'UAT Approved Date', 'Production Date', 'Status'];
      
      let csvContent = headers.join(',') + '\n';
      
      exportData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // Escape values that contain commas or quotes
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvContent += values.join(',') + '\n';
      });

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `CR_Report_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToast({ message: 'Report exported successfully!', type: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      setToast({ message: 'Failed to export report. Please try again.', type: 'error' });
    }
  };

  const isDevOrQA = currentUser?.role === 'Dev Team' || currentUser?.role === 'QA Team';
  const canEditDelete = !isDevOrQA;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Session</h2>
          <p className="text-gray-600 mb-6">Please login to access the dashboard.</p>
          <button 
            onClick={() => onNavigate && onNavigate('login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              {/* CellDe Logo */}
              <img 
                src="/cellde-logo.png" 
                alt="CellDe Logo" 
                className="h-10"
              />
              <div className="border-l border-gray-300 pl-4 ml-2">
                <h1 className="text-lg font-bold text-gray-900">CR Management Portal</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  id="profile-menu-button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <User className="w-5 h-5 text-gray-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{currentUser.fullName}</p>
                    <p className="text-xs text-gray-500">{currentUser.role}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div 
                    id="profile-menu"
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{currentUser.fullName}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {currentUser.role}
                      </span>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowChangePassword(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <KeyRound className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">Change Password</span>
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page Title Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 border-b border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Change Request Dashboard</h2>
              <p className="text-blue-100 text-xs mt-0.5">Manage and track all change requests</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isDevOrQA && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col h-full">
                <p className="text-sm font-medium text-gray-600 mb-3">Total Requests</p>
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col h-full">
                <p className="text-sm font-medium text-gray-600 mb-3">Pending</p>
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col h-full">
                <p className="text-sm font-medium text-gray-600 mb-3">Approved</p>
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col h-full">
                <p className="text-sm font-medium text-gray-600 mb-3">Rejected</p>
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col h-full">
                <p className="text-sm font-medium text-gray-600 mb-3">In Progress</p>
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col h-full">
                <p className="text-sm font-medium text-gray-600 mb-3">Completed</p>
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-3xl font-bold text-purple-600">{stats.completed}</p>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by CR Code, Name, or Application..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <button 
                  onClick={() => setShowDateFilters(!showDateFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">Date Filters</span>
                </button>
                
                <button 
                  onClick={handleExportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-medium">Export</span>
                </button>
                
                {!isDevOrQA && (
                  <button 
                    onClick={() => setShowNewCRForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">New CR</span>
                  </button>
                )}
              </div>
            </div>

            {showDateFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Filter By
                    </label>
                    <select
                      value={dateFilterType}
                      onChange={(e) => setDateFilterType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Date Type</option>
                      <option value="requestDate">Request Date</option>
                      <option value="approvedDate">Approved Date</option>
                      <option value="rejectedDate">Rejected Date</option>
                      <option value="uatDate">UAT Date</option>
                      <option value="uatApprovedDate">UAT Approved Date</option>
                      <option value="productionDate">Production Date</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      From
                    </label>
                    <input 
                      type="date" 
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      disabled={!dateFilterType}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      To
                    </label>
                    <input 
                      type="date" 
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      disabled={!dateFilterType}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={handleDateSearch}
                      disabled={!dateFilterType}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Search
                    </button>
                    <button 
                      onClick={clearDateFilters}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CR Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CR Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UAT Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UAT Approved Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Production Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  {canEditDelete && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPageData.length === 0 ? (
                  <tr>
                    <td colSpan={canEditDelete ? "13" : "12"} className="px-6 py-12 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No change requests found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {searchTerm || filterStatus !== 'All' || dateFilterType
                          ? 'Try adjusting your search or filters' 
                          : 'Create your first change request to get started'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentPageData.map((cr, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{cr.crCode}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900" title={cr.crName}>
                          {cr.crName.length > 15 ? `${cr.crName.substring(0, 15)}...` : cr.crName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{cr.application}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{cr.requester}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{cr.requestDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{cr.approvedDate || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{cr.rejectedDate || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{cr.uatDate || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{cr.uatApprovedDate || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{cr.productionDate || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(cr.status)}`}>
                          {cr.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => setSelectedCR(cr)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          View Details
                        </button>
                      </td>
                      {canEditDelete && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => setEditingCR(cr)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit CR"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => setDeletingCR(cr)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete CR"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredRequests.length > itemsPerPage && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredRequests.length)}</span> of{' '}
                  <span className="font-medium">{filteredRequests.length}</span> results
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  <span className="px-3 py-2 text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {filteredRequests.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total: {filteredRequests.length} change request{filteredRequests.length !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>Last updated: {new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {showNewCRForm && !isDevOrQA && (
        <NewCRForm 
          onClose={() => setShowNewCRForm(false)}
          onSuccess={(crCode) => {
            setShowNewCRForm(false);
            setTimeout(() => {
              loadChangeRequests();
            }, 500);
            setToast({ message: `CR "${crCode}" created successfully!`, type: 'success' });
          }}
        />
      )}

      {editingCR && !isDevOrQA && (
        <EditCRForm 
          cr={editingCR}
          onClose={() => setEditingCR(null)}
          onSuccess={(crCode) => {
            setEditingCR(null);
            loadChangeRequests();
            setToast({ message: `CR "${crCode}" updated successfully!`, type: 'success' });
          }}
        />
      )}

      {selectedCR && (
        <DescriptionModal 
          cr={selectedCR}
          onClose={() => setSelectedCR(null)}
        />
      )}

      {deletingCR && !isDevOrQA && (
        <DeleteConfirmModal 
          cr={deletingCR}
          onConfirm={() => handleDeleteCR(deletingCR)}
          onCancel={() => setDeletingCR(null)}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal 
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {
            setShowChangePassword(false);
            setToast({ message: 'Password changed successfully!', type: 'success' });
          }}
        />
      )}

      {toast && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}