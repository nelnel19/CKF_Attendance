import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import '../styles/userlists.css';

const API_URL = 'https://ckf-attendance-backend.onrender.com/api/users';

const UserLists = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Modal state
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const getAgeCategory = (age) => {
    if (age >= 1 && age <= 12) return 'Kids';
    if (age >= 13 && age <= 22) return 'Youth';
    return 'Young Professionals';
  };

  // Filter users by category and date
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

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      setSelectedUsers(filteredUsers.map(user => user._id));
    } else {
      setSelectedUsers([]);
    }
  }, [selectAll, filteredUsers]);

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
    setSelectAll(false);
  };

  // Delete selected users
  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select users to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} selected member(s)? This action cannot be undone.`)) return;

    try {
      const deletePromises = selectedUsers.map(id => axios.delete(`${API_URL}/${id}`));
      await Promise.all(deletePromises);
      setSelectedUsers([]);
      setSelectAll(false);
      fetchUsers();
      alert(`Successfully deleted ${selectedUsers.length} member(s)`);
    } catch (err) {
      setError('Failed to delete some users');
    }
  };

  // Generate summary data
  const generateSummary = () => {
    const usersToSummarize = filterDate ? filteredUsers : users;
    
    const summary = {
      total: usersToSummarize.length,
      byCategory: {
        Kids: 0,
        Youth: 0,
        'Young Professionals': 0
      },
      byGender: {
        Male: 0,
        Female: 0
      },
      byCategoryAndGender: {
        Kids: { Male: 0, Female: 0 },
        Youth: { Male: 0, Female: 0 },
        'Young Professionals': { Male: 0, Female: 0 }
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

  // Export summary to Excel
  const exportSummaryToExcel = () => {
    if (!summaryData) return;

    const currentDate = new Date().toLocaleDateString();
    const reportDate = filterDate || 'All Time';

    const summaryRows = [
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
      ['Kids', summaryData.byCategory.Kids],
      ['Youth', summaryData.byCategory.Youth],
      ['Young Professionals', summaryData.byCategory['Young Professionals']],
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
      ['Young Professionals', summaryData.byCategoryAndGender['Young Professionals'].Male, summaryData.byCategoryAndGender['Young Professionals'].Female, summaryData.byCategory['Young Professionals']],
      [''],
      ['TOTAL', summaryData.byGender.Male, summaryData.byGender.Female, summaryData.total]
    ];

    const ws = XLSX.utils.aoa_to_sheet(summaryRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CKF_Summary');
    const fileName = `CKF_Summary_${reportDate.replace(/\//g, '-')}_${currentDate.replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handleDelete = async (id, fullName) => {
    if (window.confirm(`Are you sure you want to delete ${fullName}?`)) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete user');
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

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
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

  // Export to Excel
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
    XLSX.utils.book_append_sheet(wb, ws, 'CKF_Members');
    const date = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fileName = `CKF_Members_${date}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const clearDateFilter = () => {
    setFilterDate('');
  };

  const handleAddMember = () => {
    navigate('/add');
  };

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="user-list-container">
      {/* Fixed Header Section */}
      <div className="fixed-header">
        <div className="header">
          <img src="/ckflogo.jpg" alt="CKF Logo" className="custom-logo-img" />
          <h1 className="title">CKF Attendance</h1>
        </div>

        <div className="controls">
          <div className="action-buttons">
            <button onClick={handleAddMember} className="add-button">
              Add New Member
            </button>
            {selectedUsers.length > 0 && (
              <button onClick={handleDeleteSelected} className="delete-selected-btn">
                Delete Selected ({selectedUsers.length})
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
                <option value="Young Professionals">Young Professionals (23+)</option>
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
      </div>

      {/* Scrollable Table Section */}
      <div className="scrollable-table-wrapper">
        {filteredUsers.length === 0 ? (
          <div className="empty-message">
            {filterCategory === 'all' && !filterDate
              ? 'No members yet. Add your first member!'
              : `No members found matching your filters.`}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => setSelectAll(e.target.checked)}
                      className="select-all-checkbox"
                    />
                  </th>
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
                  <tr key={user._id} className={selectedUsers.includes(user._id) ? 'selected-row' : ''}>
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                        className="user-checkbox"
                      />
                    </td>
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
                      <button onClick={() => handleDelete(user._id, user.fullName)} className="delete-btn">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rest of your modals remain the same */}
      {/* Summary Modal */}
      {showSummaryModal && summaryData && (
        <div className="modal-overlay" onClick={() => setShowSummaryModal(false)}>
          <div className="summary-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Attendance Summary Report</h2>
              <button className="modal-close" onClick={() => setShowSummaryModal(false)}>&times;</button>
            </div>
            
            <div className="summary-body">
              <div className="summary-info">
                <p><strong>Report Date:</strong> {filterDate || 'All Time'}</p>
                <p><strong>Generated:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>Total Members:</strong> {summaryData.total}</p>
              </div>

              <div className="summary-section">
                <h3>By Age Category</h3>
                <div className="summary-stats">
                  <div className="stat-card">
                    <span className="stat-label">Kids</span>
                    <span className="stat-number">{summaryData.byCategory.Kids}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Youth</span>
                    <span className="stat-number">{summaryData.byCategory.Youth}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Young Professionals</span>
                    <span className="stat-number">{summaryData.byCategory['Young Professionals']}</span>
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
                      <td>Kids</td>
                      <td>{summaryData.byCategoryAndGender.Kids.Male}</td>
                      <td>{summaryData.byCategoryAndGender.Kids.Female}</td>
                      <td>{summaryData.byCategory.Kids}</td>
                    </tr>
                    <tr>
                      <td>Youth</td>
                      <td>{summaryData.byCategoryAndGender.Youth.Male}</td>
                      <td>{summaryData.byCategoryAndGender.Youth.Female}</td>
                      <td>{summaryData.byCategory.Youth}</td>
                    </tr>
                    <tr>
                      <td>Young Professionals</td>
                      <td>{summaryData.byCategoryAndGender['Young Professionals'].Male}</td>
                      <td>{summaryData.byCategoryAndGender['Young Professionals'].Female}</td>
                      <td>{summaryData.byCategory['Young Professionals']}</td>
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

      {/* Edit Modal */}
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
    </div>
  );
};

export default UserLists;