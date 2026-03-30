import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/userinput.css';

const API_URL = 'https://ckf-attendance-backend.onrender.com/api/users';
const CKF_MEMBERS_URL = 'https://ckf-attendance-backend.onrender.com/api/ckf-members';

const UserInput = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    age: '',
    address: '',
    contactNo: '',
    cellgroupLeader: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allMembers, setAllMembers] = useState([]);
  const [isCheckingName, setIsCheckingName] = useState(false);

  // Fetch all CKF members on component mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.get(CKF_MEMBERS_URL);
        setAllMembers(response.data.data);
      } catch (err) {
        console.error('Failed to fetch CKF members:', err);
      }
    };
    fetchMembers();
  }, []);

  // Handle full name input change and search for matches
  const handleNameChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, fullName: value }));
    
    if (value.trim().length > 2) {
      const matches = allMembers.filter(member => 
        member.fullName.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Auto-fill form when a suggestion is selected
  const handleSelectSuggestion = (member) => {
    setFormData({
      fullName: member.fullName,
      gender: member.gender,
      age: member.age,
      address: member.address,
      contactNo: member.contactNo,
      cellgroupLeader: member.cellgroupLeader,
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.fullName.trim()) {
      setError('Full Name is required');
      setLoading(false);
      return;
    }

    try {
      await axios.post(API_URL, {
        ...formData,
        age: parseInt(formData.age, 10),
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-input-container">
      <div className="header">
        <img src="/ckflogo.jpg" alt="CKF Logo" className="custom-logo-img" />
        <h1 className="title">Add New Member</h1>
      </div>

      <div className="form-card">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Full Name <span className="auto-fill-hint">(Auto-fill available)</span></label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleNameChange}
              placeholder="Start typing to see suggestions..."
              required
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((member) => (
                  <div
                    key={member._id}
                    className="suggestion-item"
                    onClick={() => handleSelectSuggestion(member)}
                  >
                    <div className="suggestion-name">{member.fullName}</div>
                    <div className="suggestion-details">
                      {member.cellgroupLeader} • {member.age} yrs
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter age"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter complete address"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Contact No</label>
              <input
                type="text"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleChange}
                placeholder="Enter contact number"
                required
              />
            </div>

            <div className="form-group">
              <label>Cellgroup Leader</label>
              <input
                type="text"
                name="cellgroupLeader"
                value={formData.cellgroupLeader}
                onChange={handleChange}
                placeholder="Enter cellgroup leader name"
                required
              />
            </div>
          </div>

          <div className="button-group">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Member'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserInput;