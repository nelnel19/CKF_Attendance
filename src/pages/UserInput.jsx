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
  const [bouncingDots, setBouncingDots] = useState('');
  
  const fullNameInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Animated dots effect while loading
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setBouncingDots(prev => {
          if (prev === '...') return '';
          if (prev === '') return '.';
          if (prev === '.') return '..';
          return '...';
        });
      }, 400);
    } else {
      setBouncingDots('');
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Age category function
  const getAgeCategory = (age) => {
    if (age >= 1 && age <= 12) return 'Kids';
    if (age >= 13 && age <= 22) return 'Youth';
    if (age >= 23 && age <= 39) return 'Young Adult';
    if (age >= 40) return 'Adult';
    return 'Unknown';
  };

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
      ).slice(0, 8);
      
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
    
    setTimeout(() => {
      const genderSelect = document.querySelector('select[name="gender"]');
      if (genderSelect) genderSelect.focus();
    }, 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

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
      
      setSuccess(`✓ Attendance for ${formData.fullName} has been successfully added!`);
      
      setFormData({
        fullName: '',
        gender: '',
        age: '',
        address: '',
        contactNo: '',
        cellgroupLeader: '',
      });
      
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
      {/* Animated Background with particles */}
      <div className="animated-bg">
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              '--delay': `${i * 0.5}s`,
              '--duration': `${5 + Math.random() * 5}s`,
              '--start-x': `${Math.random() * 100}%`,
              '--end-x': `${Math.random() * 100}%`,
            }}></div>
          ))}
        </div>
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      {/* Header with Logo */}
      <div className="header">
        <img src="/ckflogo.jpg" alt="CKF Logo" className="custom-logo-img floating-logo" />
        <h1 className="title gradient-text">Attendance</h1>
      </div>

      <div className="form-card">
        {error && <div className="error-message shake-animation">{error}</div>}
        {success && <div className="success-message slide-in">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group floating-label-group" style={{ position: 'relative' }} ref={fullNameInputRef}>
            <label className="animated-label">
              Full Name 
              <span className="auto-fill-hint pulse-hint">(Start typing to see suggestions)</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              placeholder="Type name or use arrow keys to navigate..."
              required
              autoComplete="off"
              className="full-name-input input-glow"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown fade-in-up" ref={suggestionsRef}>
                {suggestions.map((member, index) => (
                  <div
                    key={member._id}
                    className={`suggestion-item ${index === selectedIndex ? 'selected slide-left' : ''}`}
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
                  <span className="keyboard-hint pulse-text">
                    ↑↓ to navigate • Enter to select • Esc to close
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group floating-label-group">
              <label className="animated-label">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="form-select input-glow"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="form-group floating-label-group">
              <label className="animated-label">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter age"
                required
                className="form-input input-glow"
              />
            </div>
          </div>

          <div className="form-group floating-label-group">
            <label className="animated-label">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter complete address"
              required
              className="form-input input-glow"
            />
          </div>

          <div className="form-row">
            <div className="form-group floating-label-group">
              <label className="animated-label">Contact No</label>
              <input
                type="text"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleChange}
                placeholder="Enter contact number"
                required
                className="form-input input-glow"
              />
            </div>

            <div className="form-group floating-label-group">
              <label className="animated-label">Cellgroup Leader</label>
              <input
                type="text"
                name="cellgroupLeader"
                value={formData.cellgroupLeader}
                onChange={handleChange}
                placeholder="Enter cellgroup leader name"
                required
                className="form-input input-glow"
              />
            </div>
          </div>

          <div className="button-group">
            <button type="submit" className="btn-primary btn-pulse" disabled={loading}>
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span> 
                  Adding{bouncingDots}
                </span>
              ) : (
                <span className="btn-text">
                  <span className="btn-icon">✓</span> Add Attendance
                </span>
              )}
            </button>
            <button type="button" className="btn-secondary btn-hover" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>
        </form>

        {/* Animated helper text */}
        <div className="helper-text">
          <div className="typing-animation">Ready to record attendance...</div>
        </div>
      </div>
    </div>
  );
};

export default UserInput;