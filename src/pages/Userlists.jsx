import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import '../styles/userlists.css';

const API_URL = 'https://ckf-attendance-backend.onrender.com/api/users';
const CKF_MEMBERS_URL = 'https://ckf-attendance-backend.onrender.com/api/ckf-members';

const UserLists = () => {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' or 'members'
  const [users, setUsers] = useState([]);
  const [ckfMembers, setCkfMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [error, setError] = useState('');
  const [membersError, setMembersError] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryType, setSummaryType] = useState('attendance');
  const [clearingAttendance, setClearingAttendance] = useState(false);

  // Modal state for attendance users
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    gender: '',
    age: '',
    address: '',
    contactNo: '',
    cellgroupLeader: '',
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Modal state for CKF members
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberFormData, setMemberFormData] = useState({
    fullName: '',
    gender: '',
    age: '',
    address: '',
    contactNo: '',
    cellgroupLeader: '',
    status: 'Active'
  });
  const [memberSaving, setMemberSaving] = useState(false);
  const [memberEditError, setMemberEditError] = useState('');

  // Add Member Modal State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    fullName: '',
    gender: '',
    age: '',
    address: '',
    contactNo: '',
    cellgroupLeader: '',
    status: 'Active'
  });
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');

  // Confirmation Modal State for Clear All
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  // Age category function
  const getAgeCategory = (age) => {
    if (age >= 1 && age <= 12) return 'Kids';
    if (age >= 13 && age <= 22) return 'Youth';
    if (age >= 23 && age <= 39) return 'Young Adult';
    if (age >= 40) return 'Adult';
    return 'Unknown';
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      const validUsers = response.data.data.filter(user => user.fullName && user.fullName.trim() !== '');
      setUsers(validUsers);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchCkfMembers = async () => {
    setMembersLoading(true);
    try {
      const response = await axios.get(CKF_MEMBERS_URL);
      setCkfMembers(response.data.data);
      setMembersError('');
    } catch (err) {
      setMembersError(err.response?.data?.message || 'Failed to fetch CKF members');
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCkfMembers();
  }, []);

  // Filter attendance users by category and date
  const filteredUsers = users.filter(user => {
    let matchCategory = true;
    let matchDate = true;

    if (filterCategory !== 'all') {
      matchCategory = getAgeCategory(user.age) === filterCategory;
    }

    if (filterDate) {
      const userDate = new Date(user.createdAt).toISOString().split('T')[0];
      matchDate = userDate === filterDate;
    }

    return matchCategory && matchDate;
  });

  // Filter CKF members by status and search
  const [memberFilterStatus, setMemberFilterStatus] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');

  const filteredMembers = ckfMembers.filter(member => {
    let matchStatus = true;
    let matchSearch = true;

    if (memberFilterStatus !== 'all') {
      matchStatus = member.status === memberFilterStatus;
    }

    if (memberSearch) {
      matchSearch = member.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
                   member.address.toLowerCase().includes(memberSearch.toLowerCase()) ||
                   member.cellgroupLeader.toLowerCase().includes(memberSearch.toLowerCase());
    }

    return matchStatus && matchSearch;
  });

  // Clear all attendance records
  const clearAllAttendance = async () => {
    setClearingAttendance(true);
    try {
      const deletePromises = users.map(user => axios.delete(`${API_URL}/${user._id}`));
      await Promise.all(deletePromises);
      await fetchUsers();
      setShowClearConfirmModal(false);
      alert('All attendance records have been cleared successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clear attendance records');
    } finally {
      setClearingAttendance(false);
    }
  };

  // Generate summary data for attendance
  const generateSummary = () => {
    setSummaryType('attendance');
    const usersToSummarize = filterDate ? filteredUsers : users;
    
    const summary = {
      total: usersToSummarize.length,
      byCategory: {
        Kids: 0,
        Youth: 0,
        'Young Adult': 0,
        Adult: 0
      },
      byGender: {
        Male: 0,
        Female: 0
      },
      byCategoryAndGender: {
        Kids: { Male: 0, Female: 0 },
        Youth: { Male: 0, Female: 0 },
        'Young Adult': { Male: 0, Female: 0 },
        Adult: { Male: 0, Female: 0 }
      }
    };

    usersToSummarize.forEach(user => {
      const category = getAgeCategory(user.age);
      const gender = user.gender || 'Other';
      
      summary.byCategory[category]++;
      
      if (gender === 'Male' || gender === 'Female') {
        summary.byGender[gender]++;
      }
      
      if (summary.byCategoryAndGender[category] && (gender === 'Male' || gender === 'Female')) {
        summary.byCategoryAndGender[category][gender]++;
      }
    });

    setSummaryData(summary);
    setShowSummaryModal(true);
  };

  // Generate summary for CKF members
  const generateCkfSummary = () => {
    setSummaryType('members');
    const summary = {
      total: ckfMembers.length,
      byGender: {
        Male: 0,
        Female: 0
      },
      byStatus: {
        Active: 0,
        Inactive: 0,
        Pending: 0
      },
      byCellgroup: {}
    };

    ckfMembers.forEach(member => {
      if (member.gender === 'Male' || member.gender === 'Female') {
        summary.byGender[member.gender]++;
      }
      
      if (member.status) {
        summary.byStatus[member.status]++;
      }
      
      const leader = member.cellgroupLeader || 'Unassigned';
      if (!summary.byCellgroup[leader]) {
        summary.byCellgroup[leader] = 0;
      }
      summary.byCellgroup[leader]++;
    });

    setSummaryData(summary);
    setShowSummaryModal(true);
  };

  // Export summary to Excel
  const exportSummaryToExcel = () => {
    if (!summaryData) return;

    const currentDate = new Date().toLocaleDateString();
    
    let summaryRows = [];
    
    if (summaryType === 'attendance') {
      const reportDate = filterDate || 'All Time';
      summaryRows = [
        ['CKF ATTENDANCE SUMMARY REPORT'],
        [''],
        [`Report Date: ${reportDate}`],
        [`Generated: ${currentDate}`],
        [''],
        ['OVERALL STATISTICS'],
        ['Total Members', summaryData.total],
        [''],
        ['BY AGE CATEGORY'],
        ['Category', 'Count'],
        ['Kids (1-12)', summaryData.byCategory.Kids],
        ['Youth (13-22)', summaryData.byCategory.Youth],
        ['Young Adult (23-39)', summaryData.byCategory['Young Adult']],
        ['Adult (40+)', summaryData.byCategory.Adult],
        [''],
        ['BY GENDER'],
        ['Gender', 'Count'],
        ['Male', summaryData.byGender.Male],
        ['Female', summaryData.byGender.Female],
        [''],
        ['DETAILED BREAKDOWN BY CATEGORY & GENDER'],
        ['Category', 'Male', 'Female', 'Total'],
        ['Kids', summaryData.byCategoryAndGender.Kids.Male, summaryData.byCategoryAndGender.Kids.Female, summaryData.byCategory.Kids],
        ['Youth', summaryData.byCategoryAndGender.Youth.Male, summaryData.byCategoryAndGender.Youth.Female, summaryData.byCategory.Youth],
        ['Young Adult', summaryData.byCategoryAndGender['Young Adult'].Male, summaryData.byCategoryAndGender['Young Adult'].Female, summaryData.byCategory['Young Adult']],
        ['Adult', summaryData.byCategoryAndGender.Adult.Male, summaryData.byCategoryAndGender.Adult.Female, summaryData.byCategory.Adult],
        [''],
        ['TOTAL', summaryData.byGender.Male, summaryData.byGender.Female, summaryData.total]
      ];
    } else {
      summaryRows = [
        ['CKF MEMBERS DIRECTORY REPORT'],
        [''],
        [`Generated: ${currentDate}`],
        [''],
        ['OVERALL STATISTICS'],
        ['Total Members', summaryData.total],
        [''],
        ['BY GENDER'],
        ['Gender', 'Count'],
        ['Male', summaryData.byGender.Male],
        ['Female', summaryData.byGender.Female],
        [''],
        ['BY STATUS'],
        ['Status', 'Count'],
        ['Active', summaryData.byStatus.Active],
        ['Inactive', summaryData.byStatus.Inactive],
        ['Pending', summaryData.byStatus.Pending],
        [''],
        ['BY CELLGROUP LEADER'],
        ['Cellgroup Leader', 'Count']
      ];
      
      Object.entries(summaryData.byCellgroup).forEach(([leader, count]) => {
        summaryRows.push([leader, count]);
      });
      
      summaryRows.push([''], ['TOTAL', summaryData.total]);
    }

    const ws = XLSX.utils.aoa_to_sheet(summaryRows);
    const wb = XLSX.utils.book_new();
    const sheetName = summaryType === 'attendance' ? 'CKF_Attendance_Summary' : 'CKF_Members_Directory';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const fileName = `${sheetName}_${currentDate.replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleDelete = async (id, fullName, type = 'attendance') => {
    if (window.confirm(`Are you sure you want to delete ${fullName}?`)) {
      try {
        if (type === 'attendance') {
          await axios.delete(`${API_URL}/${id}`);
          fetchUsers();
        } else {
          await axios.delete(`${CKF_MEMBERS_URL}/${id}`);
          fetchCkfMembers();
        }
      } catch (err) {
        if (type === 'attendance') {
          setError(err.response?.data?.message || 'Failed to delete user');
        } else {
          setMembersError(err.response?.data?.message || 'Failed to delete member');
        }
      }
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.fullName,
      gender: user.gender || '',
      age: user.age,
      address: user.address,
      contactNo: user.contactNo,
      cellgroupLeader: user.cellgroupLeader,
    });
    setEditError('');
    setIsModalOpen(true);
  };

  const openEditMemberModal = (member) => {
    setEditingMember(member);
    setMemberFormData({
      fullName: member.fullName,
      gender: member.gender || '',
      age: member.age,
      address: member.address,
      contactNo: member.contactNo,
      cellgroupLeader: member.cellgroupLeader,
      status: member.status || 'Active'
    });
    setMemberEditError('');
    setIsMemberModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setEditFormData({
      fullName: '',
      gender: '',
      age: '',
      address: '',
      contactNo: '',
      cellgroupLeader: '',
    });
    setEditError('');
  };

  const closeMemberModal = () => {
    setIsMemberModalOpen(false);
    setEditingMember(null);
    setMemberFormData({
      fullName: '',
      gender: '',
      age: '',
      address: '',
      contactNo: '',
      cellgroupLeader: '',
      status: 'Active'
    });
    setMemberEditError('');
  };

  const openAddMemberModal = () => {
    setNewMemberData({
      fullName: '',
      gender: '',
      age: '',
      address: '',
      contactNo: '',
      cellgroupLeader: '',
      status: 'Active'
    });
    setAddMemberError('');
    setIsAddMemberModalOpen(true);
  };

  const closeAddMemberModal = () => {
    setIsAddMemberModalOpen(false);
    setNewMemberData({
      fullName: '',
      gender: '',
      age: '',
      address: '',
      contactNo: '',
      cellgroupLeader: '',
      status: 'Active'
    });
    setAddMemberError('');
    setAddingMember(false);
  };

  const handleAddMemberChange = (e) => {
    const { name, value } = e.target;
    setNewMemberData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    setAddMemberError('');

    try {
      await axios.post(CKF_MEMBERS_URL, {
        ...newMemberData,
        age: parseInt(newMemberData.age, 10),
      });
      closeAddMemberModal();
      fetchCkfMembers();
    } catch (err) {
      setAddMemberError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMemberEditChange = (e) => {
    const { name, value } = e.target;
    setMemberFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setEditError('');

    try {
      await axios.put(`${API_URL}/${editingUser._id}`, {
        ...editFormData,
        age: parseInt(editFormData.age, 10),
      });
      closeModal();
      fetchUsers();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleMemberEditSubmit = async (e) => {
    e.preventDefault();
    setMemberSaving(true);
    setMemberEditError('');

    try {
      await axios.put(`${CKF_MEMBERS_URL}/${editingMember._id}`, {
        ...memberFormData,
        age: parseInt(memberFormData.age, 10),
      });
      closeMemberModal();
      fetchCkfMembers();
    } catch (err) {
      setMemberEditError(err.response?.data?.message || 'Failed to update member');
    } finally {
      setMemberSaving(false);
    }
  };

  const exportToExcel = () => {
    const exportData = filteredUsers.map(user => ({
      'Full Name': user.fullName,
      'Gender': user.gender || '-',
      'Age': user.age,
      'Age Category': getAgeCategory(user.age),
      'Address': user.address,
      'Contact No': user.contactNo,
      'Cellgroup Leader': user.cellgroupLeader,
      'Date Added': new Date(user.createdAt).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CKF_Attendance');
    const date = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fileName = `CKF_Attendance_${date}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportCkfMembersToExcel = () => {
    const exportData = filteredMembers.map(member => ({
      'Full Name': member.fullName,
      'Gender': member.gender || '-',
      'Age': member.age,
      'Age Category': getAgeCategory(member.age),
      'Address': member.address,
      'Contact No': member.contactNo,
      'Cellgroup Leader': member.cellgroupLeader,
      'Status': member.status || 'Active',
      'Date Joined': new Date(member.dateJoined).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CKF_Members');
    const date = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fileName = `CKF_Members_${date}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const clearDateFilter = () => {
    setFilterDate('');
  };

  const clearMemberFilters = () => {
    setMemberFilterStatus('all');
    setMemberSearch('');
  };

  if (loading && activeTab === 'attendance') return <div className="loading">Loading attendance records...</div>;
  if (membersLoading && activeTab === 'members') return <div className="loading">Loading CKF members...</div>;

  return (
    <div className="user-list-container">
      <div className="header">
        <img src="/ckflogo.jpg" alt="CKF Logo" className="custom-logo-img" />
        <h1 className="title">CKF Attendance System</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance Records
        </button>
        <button
          className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          CKF Members Directory
        </button>
      </div>

      {activeTab === 'attendance' && (
        <>
          <div className="controls">
            <div className="left-controls">
              <Link to="/add" className="add-button">
                + Add Attendance
              </Link>
              {users.length > 0 && (
                <button 
                  onClick={() => setShowClearConfirmModal(true)} 
                  className="clear-all-btn"
                  disabled={clearingAttendance}
                >
                  Clear All Attendance
                </button>
              )}
            </div>

            <div className="filter-group">
              <div className="filter">
                <label htmlFor="categoryFilter">Age Category:</label>
                <select
                  id="categoryFilter"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Kids">Kids (1-12)</option>
                  <option value="Youth">Youth (13-22)</option>
                  <option value="Young Adult">Young Adult (23-39)</option>
                  <option value="Adult">Adult (40+)</option>
                </select>
              </div>

              <div className="filter-divider"></div>

              <div className="filter">
                <label htmlFor="dateFilter">Date Added:</label>
                <input
                  type="date"
                  id="dateFilter"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="date-filter-input"
                />
                {filterDate && (
                  <button onClick={clearDateFilter} className="clear-date-btn" title="Clear date filter">
                    ×
                  </button>
                )}
              </div>

              <button className="summary-btn" onClick={generateSummary}>
                Generate Summary
              </button>

              {filteredUsers.length > 0 && (
                <button className="export-btn" onClick={exportToExcel}>
                  Export to Excel
                </button>
              )}
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          {filteredUsers.length === 0 ? (
            <div className="empty-message">
              {filterCategory === 'all' && !filterDate
                ? 'No attendance records yet. Add your first member!'
                : `No members found matching your filters.`}
            </div>
          ) : (
            <div className="table-wrapper">
              <div className="table-scroll-container">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Gender</th>
                      <th>Age</th>
                      <th>Age Category</th>
                      <th>Address</th>
                      <th>Contact No</th>
                      <th>Cellgroup Leader</th>
                      <th>Date Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user._id}>
                        <td>{user.fullName}</td>
                        <td>{user.gender || '-'}</td>
                        <td>{user.age}</td>
                        <td>{getAgeCategory(user.age)}</td>
                        <td>{user.address}</td>
                        <td>{user.contactNo}</td>
                        <td>{user.cellgroupLeader}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="actions">
                          <button onClick={() => openEditModal(user)} className="edit-btn">Edit</button>
                          <button onClick={() => handleDelete(user._id, user.fullName, 'attendance')} className="delete-btn">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'members' && (
        <>
          <div className="controls">
            <button 
              onClick={openAddMemberModal}
              className="add-button"
            >
              + Add New Member
            </button>

            <div className="filter-group">
              <div className="filter">
                <label htmlFor="statusFilter">Status:</label>
                <select
                  id="statusFilter"
                  value={memberFilterStatus}
                  onChange={(e) => setMemberFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="filter-divider"></div>

              <div className="filter">
                <label htmlFor="searchFilter">Search:</label>
                <input
                  type="text"
                  id="searchFilter"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Name, address, or leader..."
                  className="search-input"
                />
                {memberSearch && (
                  <button onClick={() => setMemberSearch('')} className="clear-date-btn" title="Clear search">
                    ×
                  </button>
                )}
              </div>

              {(memberFilterStatus !== 'all' || memberSearch) && (
                <button onClick={clearMemberFilters} className="clear-filters-btn">
                  Clear Filters
                </button>
              )}

              <button className="summary-btn" onClick={generateCkfSummary}>
                Generate Summary
              </button>

              {filteredMembers.length > 0 && (
                <button className="export-btn" onClick={exportCkfMembersToExcel}>
                  Export to Excel
                </button>
              )}
            </div>
          </div>

          {membersError && <div className="error">{membersError}</div>}

          {filteredMembers.length === 0 ? (
            <div className="empty-message">
              {memberSearch || memberFilterStatus !== 'all'
                ? `No members found matching your filters.`
                : 'No CKF members found in the database.'}
            </div>
          ) : (
            <div className="table-wrapper">
              <div className="table-scroll-container">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Gender</th>
                      <th>Age</th>
                      <th>Age Category</th>
                      <th>Address</th>
                      <th>Contact No</th>
                      <th>Cellgroup Leader</th>
                      <th>Status</th>
                      <th>Date Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map(member => (
                      <tr key={member._id}>
                        <td>{member.fullName}</td>
                        <td>{member.gender || '-'}</td>
                        <td>{member.age}</td>
                        <td>{getAgeCategory(member.age)}</td>
                        <td>{member.address}</td>
                        <td>{member.contactNo}</td>
                        <td>{member.cellgroupLeader}</td>
                        <td>
                          <span className={`status-badge status-${member.status?.toLowerCase() || 'active'}`}>
                            {member.status || 'Active'}
                          </span>
                        </td>
                        <td>{new Date(member.dateJoined).toLocaleDateString()}</td>
                        <td className="actions">
                          <button onClick={() => openEditMemberModal(member)} className="edit-btn">Edit</button>
                          <button onClick={() => handleDelete(member._id, member.fullName, 'members')} className="delete-btn">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Clear All Attendance Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowClearConfirmModal(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Clear Attendance Records</h2>
              <button className="modal-close" onClick={() => setShowClearConfirmModal(false)}>&times;</button>
            </div>
            <div className="confirm-body">
              <p>Are you sure you want to clear all attendance records for today?</p>
            </div>
            <div className="modal-footer">
              <button 
                onClick={clearAllAttendance} 
                className="btn-danger" 
                disabled={clearingAttendance}
              >
                {clearingAttendance ? 'Clearing...' : 'Yes, Clear'}
              </button>
              <button 
                onClick={() => setShowClearConfirmModal(false)} 
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummaryModal && summaryData && (
        <div className="modal-overlay" onClick={() => setShowSummaryModal(false)}>
          <div className="summary-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{summaryType === 'attendance' ? 'Attendance Summary Report' : 'Members Directory Summary'}</h2>
              <button className="modal-close" onClick={() => setShowSummaryModal(false)}>&times;</button>
            </div>
            
            <div className="summary-body">
              <div className="summary-info">
                <p><strong>Generated:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>Total Members:</strong> {summaryData.total}</p>
              </div>

              {summaryType === 'attendance' ? (
                <>
                  <div className="summary-section">
                    <h3>By Age Category</h3>
                    <div className="summary-stats">
                      <div className="stat-card">
                        <span className="stat-label">Kids (1-12)</span>
                        <span className="stat-number">{summaryData.byCategory.Kids}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Youth (13-22)</span>
                        <span className="stat-number">{summaryData.byCategory.Youth}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Young Adult (23-39)</span>
                        <span className="stat-number">{summaryData.byCategory['Young Adult']}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Adult (40+)</span>
                        <span className="stat-number">{summaryData.byCategory.Adult}</span>
                      </div>
                    </div>
                  </div>

                  <div className="summary-section">
                    <h3>By Gender</h3>
                    <div className="summary-stats">
                      <div className="stat-card">
                        <span className="stat-label">Male</span>
                        <span className="stat-number">{summaryData.byGender.Male}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Female</span>
                        <span className="stat-number">{summaryData.byGender.Female}</span>
                      </div>
                    </div>
                  </div>

                  <div className="summary-section">
                    <h3>Detailed Breakdown</h3>
                    <table className="summary-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Male</th>
                          <th>Female</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Kids (1-12)</td>
                          <td>{summaryData.byCategoryAndGender.Kids.Male}</td>
                          <td>{summaryData.byCategoryAndGender.Kids.Female}</td>
                          <td>{summaryData.byCategory.Kids}</td>
                        </tr>
                        <tr>
                          <td>Youth (13-22)</td>
                          <td>{summaryData.byCategoryAndGender.Youth.Male}</td>
                          <td>{summaryData.byCategoryAndGender.Youth.Female}</td>
                          <td>{summaryData.byCategory.Youth}</td>
                        </tr>
                        <tr>
                          <td>Young Adult (23-39)</td>
                          <td>{summaryData.byCategoryAndGender['Young Adult'].Male}</td>
                          <td>{summaryData.byCategoryAndGender['Young Adult'].Female}</td>
                          <td>{summaryData.byCategory['Young Adult']}</td>
                        </tr>
                        <tr>
                          <td>Adult (40+)</td>
                          <td>{summaryData.byCategoryAndGender.Adult.Male}</td>
                          <td>{summaryData.byCategoryAndGender.Adult.Female}</td>
                          <td>{summaryData.byCategory.Adult}</td>
                        </tr>
                        <tr className="summary-total">
                          <td><strong>TOTAL</strong></td>
                          <td><strong>{summaryData.byGender.Male}</strong></td>
                          <td><strong>{summaryData.byGender.Female}</strong></td>
                          <td><strong>{summaryData.total}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <>
                  <div className="summary-section">
                    <h3>By Gender</h3>
                    <div className="summary-stats">
                      <div className="stat-card">
                        <span className="stat-label">Male</span>
                        <span className="stat-number">{summaryData.byGender.Male}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Female</span>
                        <span className="stat-number">{summaryData.byGender.Female}</span>
                      </div>
                    </div>
                  </div>

                  <div className="summary-section">
                    <h3>By Status</h3>
                    <div className="summary-stats">
                      <div className="stat-card">
                        <span className="stat-label">Active</span>
                        <span className="stat-number">{summaryData.byStatus.Active}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Inactive</span>
                        <span className="stat-number">{summaryData.byStatus.Inactive}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Pending</span>
                        <span className="stat-number">{summaryData.byStatus.Pending}</span>
                      </div>
                    </div>
                  </div>

                  <div className="summary-section">
                    <h3>By Cellgroup Leader</h3>
                    <table className="summary-table">
                      <thead>
                        <tr>
                          <th>Cellgroup Leader</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(summaryData.byCellgroup).map(([leader, count]) => (
                          <tr key={leader}>
                            <td>{leader}</td>
                            <td>{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={exportSummaryToExcel} className="btn-primary export-summary-btn">
                Export to Excel
              </button>
              <button onClick={() => setShowSummaryModal(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal for Attendance Users */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Member</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            {editError && <div className="error-message">{editError}</div>}
            <form onSubmit={handleEditSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={editFormData.fullName}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={editFormData.age}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact No</label>
                  <input
                    type="text"
                    name="contactNo"
                    value={editFormData.contactNo}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={editFormData.address}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Cellgroup Leader</label>
                <input
                  type="text"
                  name="cellgroupLeader"
                  value={editFormData.cellgroupLeader}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="button-group">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal for CKF Members */}
      {isMemberModalOpen && (
        <div className="modal-overlay" onClick={closeMemberModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit CKF Member</h2>
              <button className="modal-close" onClick={closeMemberModal}>&times;</button>
            </div>
            {memberEditError && <div className="error-message">{memberEditError}</div>}
            <form onSubmit={handleMemberEditSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={memberFormData.fullName}
                    onChange={handleMemberEditChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={memberFormData.gender}
                    onChange={handleMemberEditChange}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={memberFormData.age}
                    onChange={handleMemberEditChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact No</label>
                  <input
                    type="text"
                    name="contactNo"
                    value={memberFormData.contactNo}
                    onChange={handleMemberEditChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={memberFormData.address}
                  onChange={handleMemberEditChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cellgroup Leader</label>
                  <input
                    type="text"
                    name="cellgroupLeader"
                    value={memberFormData.cellgroupLeader}
                    onChange={handleMemberEditChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={memberFormData.status}
                    onChange={handleMemberEditChange}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="button-group">
                <button type="submit" className="btn-primary" disabled={memberSaving}>
                  {memberSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn-secondary" onClick={closeMemberModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Member Modal for CKF Members */}
      {isAddMemberModalOpen && (
        <div className="modal-overlay" onClick={closeAddMemberModal}>
          <div className="modal-content add-member-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Add New CKF Member</h2>
                <p className="modal-subtitle">Fill in the details below to add a new member to the directory</p>
              </div>
              <button className="modal-close" onClick={closeAddMemberModal}>&times;</button>
            </div>
            {addMemberError && <div className="error-message">{addMemberError}</div>}
            <form onSubmit={handleAddMemberSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="fullName"
                    value={newMemberData.fullName}
                    onChange={handleAddMemberChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender <span className="required">*</span></label>
                  <select
                    name="gender"
                    value={newMemberData.gender}
                    onChange={handleAddMemberChange}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Age <span className="required">*</span></label>
                  <input
                    type="number"
                    name="age"
                    value={newMemberData.age}
                    onChange={handleAddMemberChange}
                    placeholder="Enter age"
                    min="0"
                    max="120"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number <span className="required">*</span></label>
                  <input
                    type="tel"
                    name="contactNo"
                    value={newMemberData.contactNo}
                    onChange={handleAddMemberChange}
                    placeholder="Enter contact number"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address <span className="required">*</span></label>
                <input
                  type="text"
                  name="address"
                  value={newMemberData.address}
                  onChange={handleAddMemberChange}
                  placeholder="Enter complete address"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cellgroup Leader <span className="required">*</span></label>
                  <input
                    type="text"
                    name="cellgroupLeader"
                    value={newMemberData.cellgroupLeader}
                    onChange={handleAddMemberChange}
                    placeholder="Enter cellgroup leader name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={newMemberData.status}
                    onChange={handleAddMemberChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="form-info">
                <p><strong>Note:</strong> All fields marked with <span className="required">*</span> are required.</p>
              </div>

              <div className="button-group">
                <button type="submit" className="btn-primary" disabled={addingMember}>
                  {addingMember ? 'Adding Member...' : 'Add Member'}
                </button>
                <button type="button" className="btn-secondary" onClick={closeAddMemberModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLists;