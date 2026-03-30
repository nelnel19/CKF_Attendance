import { useState, useEffect, useRef } from 'react';
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
  const [success, setSuccess] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allMembers, setAllMembers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const fullNameInputRef = useRef(null);
  const suggestionsRef = useRef(null);

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
    setSelectedIndex(-1);
    
    if (value.trim().length > 2) {
      const matches = allMembers.filter(member => 
        member.fullName.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8); // Limit to 8 suggestions
      
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      
      case 'Tab':
        // Close suggestions when tabbing away
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      
      default:
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

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
    setSelectedIndex(-1);
    
    // Move focus to the next field after selection
    setTimeout(() => {
      const genderSelect = document.querySelector('select[name="gender"]');
      if (genderSelect) genderSelect.focus();
    }, 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear success message when user starts typing again
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

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
      
      // Show success message
      setSuccess(`✓ Attendance for ${formData.fullName} has been successfully added!`);
      
      // Reset form after successful submission
      setFormData({
        fullName: '',
        gender: '',
        age: '',
        address: '',
        contactNo: '',
        cellgroupLeader: '',
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fullNameInputRef.current && !fullNameInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="user-input-container">
      <div className="header">
        <img src="/ckflogo.jpg" alt="CKF Logo" className="custom-logo-img" />
        <h1 className="title">Attendance</h1>
      </div>

      <div className="form-card">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ position: 'relative' }} ref={fullNameInputRef}>
            <label>Full Name <span className="auto-fill-hint">(Start typing to see suggestions)</span></label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              placeholder="Type name or use arrow keys to navigate..."
              required
              autoComplete="off"
              className="full-name-input"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown" ref={suggestionsRef}>
                {suggestions.map((member, index) => (
                  <div
                    key={member._id}
                    className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => handleSelectSuggestion(member)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="suggestion-name">{member.fullName}</div>
                    <div className="suggestion-details">
                      <span className="suggestion-leader">{member.cellgroupLeader}</span>
                      <span className="suggestion-separator">•</span>
                      <span className="suggestion-age">{member.age} yrs</span>
                      <span className="suggestion-separator">•</span>
                      <span className="suggestion-gender">{member.gender}</span>
                    </div>
                  </div>
                ))}
                <div className="suggestion-footer">
                  <span className="keyboard-hint">
                    ↑↓ to navigate • Enter to select • Esc to close
                  </span>
                </div>
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
                className="form-select"
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
                className="form-input"
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
              className="form-input"
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
                className="form-input"
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
                className="form-input"
              />
            </div>
          </div>

          <div className="button-group">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Attendace'}
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