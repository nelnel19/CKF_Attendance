import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import '../styles/userlists.css';

const API_URL = 'https://ckf-attendance-backend.onrender.com/api/users';

const UserLists = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

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

  const filteredUsers = filterCategory === 'all'
    ? users
    : users.filter(user => getAgeCategory(user.age) === filterCategory);

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
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CKF_Members');
    const date = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fileName = `CKF_Members_${date}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="user-list-container">
      <div className="header">
        <img src="/ckflogo.jpg" alt="CKF Logo" className="custom-logo-img" />
        <h1 className="title">CKF Attendance</h1>
      </div>

      <div className="controls">
        <Link to="/add" className="add-button">
          Add New Member
        </Link>

        <div className="filter-group">
          <div className="filter">
            <label htmlFor="categoryFilter">Filter by Age Category:</label>
            <select
              id="categoryFilter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All</option>
              <option value="Kids">Kids (1-12)</option>
              <option value="Youth">Youth (13-22)</option>
              <option value="Young Professionals">Young Professionals (23+)</option>
            </select>
          </div>

          {filteredUsers.length > 0 && (
            <button className="export-btn" onClick={exportToExcel}>
              Export to Excel
            </button>
          )}
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-message">
          {filterCategory === 'all'
            ? 'No members yet. Add your first member!'
            : `No members in the ${filterCategory} category.`}
        </div>
      ) : (
        <div className="table-wrapper">
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