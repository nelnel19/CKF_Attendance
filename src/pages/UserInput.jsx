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
    <div className="split-layout">
      {/* LEFT SIDE - FORM */}
      <div className="form-side">
        <div className="form-container">
          <div className="header">
            <img src="/ckflogo.jpg" alt="CKF Logo" className="custom-logo-img" />
            <h1 className="title">Attendance</h1>
          </div>

          <div className="form-card">
            {error && <div className="error-message shake-animation">{error}</div>}
            {success && <div className="success-message slide-in">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ position: 'relative' }} ref={fullNameInputRef}>
                <label className="form-label">
                  Full Name 
                  <span className="auto-fill-hint">(Start typing to see suggestions)</span>
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
                  className="form-input-field"
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
                          <span>{member.cellgroupLeader}</span>
                          <span className="dot">•</span>
                          <span>{member.age} yrs</span>
                          <span className="dot">•</span>
                          <span>{member.gender}</span>
                        </div>
                      </div>
                    ))}
                    <div className="suggestion-footer">
                      ↑↓ to navigate • Enter to select • Esc to close
                    </div>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="form-select-field"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Enter age"
                    required
                    className="form-input-field"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter complete address"
                  required
                  className="form-input-field"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact No</label>
                  <input
                    type="text"
                    name="contactNo"
                    value={formData.contactNo}
                    onChange={handleChange}
                    placeholder="Enter contact number"
                    required
                    className="form-input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cellgroup Leader</label>
                  <input
                    type="text"
                    name="cellgroupLeader"
                    value={formData.cellgroupLeader}
                    onChange={handleChange}
                    placeholder="Enter cellgroup leader name"
                    required
                    className="form-input-field"
                  />
                </div>
              </div>

              <div className="button-group">
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <span className="loading-spinner">
                      <span className="spinner"></span> Adding{bouncingDots}
                    </span>
                  ) : (
                    <>
                      <span>✓</span> Add Attendance
                    </>
                  )}
                </button>
                <button type="button" className="btn-cancel" onClick={() => navigate('/')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - ANIMATED VISUAL */}
      <div className="visual-side">
        <div className="visual-content">
          {/* Animated Cross */}
          <div className="animated-cross-container">
            <svg className="animated-cross" viewBox="0 0 100 100" width="120" height="120">
              <line x1="50" y1="10" x2="50" y2="90" stroke="#CBB38F" strokeWidth="6" strokeLinecap="round">
                <animate attributeName="y1" values="10;20;10" dur="2s" repeatCount="indefinite" />
                <animate attributeName="y2" values="90;80;90" dur="2s" repeatCount="indefinite" />
              </line>
              <line x1="20" y1="50" x2="80" y2="50" stroke="#CBB38F" strokeWidth="6" strokeLinecap="round">
                <animate attributeName="x1" values="20;30;20" dur="2s" repeatCount="indefinite" />
                <animate attributeName="x2" values="80;70;80" dur="2s" repeatCount="indefinite" />
              </line>
            </svg>
          </div>

          {/* Rotating Rings */}
          <div className="rings-container">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>

          {/* Floating Orbs */}
          <div className="orbs-container">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
            <div className="orb orb-4"></div>
            <div className="orb orb-5"></div>
          </div>

          {/* Welcome Message */}
          <div className="welcome-message">
            <h2 className="welcome-title">Welcome to CKF</h2>
            <p className="welcome-subtitle">Christ the King Fellowship</p>
            <div className="verse-display">
              <p className="verse-text">"For where two or three gather in my name, there am I with them."</p>
              <p className="verse-ref">— Matthew 18:20</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-number-animated">{allMembers.length}</div>
              <div className="stat-label-animated">Total Members</div>
            </div>
            <div className="stat-card">
              <div className="stat-number-animated">{allMembers.filter(m => m.status === 'Active').length}</div>
              <div className="stat-label-animated">Active Members</div>
            </div>
          </div>

          {/* Animated Doves */}
          <div className="doves">
            <div className="dove dove-1">🕊️</div>
            <div className="dove dove-2">🕊️</div>
            <div className="dove dove-3">🕊️</div>
          </div>

          {/* Pulsing Light */}
          <div className="pulsing-light"></div>
        </div>
      </div>
    </div>
  );
};

export default UserInput;