import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/userlists.css';

const API_URL = 'https://ckf-attendance-backend.onrender.com/api/users';

const UserLists = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setUsers(response.data.data);
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

  if (loading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="user-list-container">
      <div className="header">
        <div className="custom-logo">
          <span className="logo-text">CKF</span>
        </div>
        <h1 className="title">CKF Attendance</h1>
      </div>

      <Link to="/add" className="add-button">
        + Add New User
      </Link>

      <div className="table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Age</th>
              <th>Address</th>
              <th>Contact No</th>
              <th>Cellgroup Leader</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.fullName}</td>
                <td>{user.age}</td>
                <td>{user.address}</td>
                <td>{user.contactNo}</td>
                <td>{user.cellgroupLeader}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserLists;