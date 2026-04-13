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
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const fullNameInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Carousel images
  const carouselImages = [
    '/pic1.JPG',
    '/pic2.JPG',
    '/pic3.JPG',
    '/pic4.JPG',
    '/pic5.JPG'
  ];

  // Auto-rotate carousel with smooth transition
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselImages.length]);

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

  const handleNameChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, fullName: value }));
    setSelectedIndex(-1);
    
    if (value.trim().length > 2) {
      const matches = allMembers.filter(member => 
        member.fullName.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6);
      
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
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
      default:
        break;
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

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
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ position: 'relative' }} ref={fullNameInputRef}>
                <label className="form-label">
                  Full Name 
                  <span className="auto-fill-hint">(Start typing)</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleNameChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type name to search..."
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
                          <span>•</span>
                          <span>{member.age} yrs</span>
                        </div>
                      </div>
                    ))}
                    <div className="suggestion-footer">
                      ↑↓ • Enter • Esc
                    </div>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} required className="form-select-field">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Age" required className="form-input-field" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Complete address" required className="form-input-field" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact No</label>
                  <input type="text" name="contactNo" value={formData.contactNo} onChange={handleChange} placeholder="Contact number" required className="form-input-field" />
                </div>

                <div className="form-group">
                  <label className="form-label">Cellgroup Leader</label>
                  <input type="text" name="cellgroupLeader" value={formData.cellgroupLeader} onChange={handleChange} placeholder="Leader name" required className="form-input-field" />
                </div>
              </div>

              <div className="button-group">
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? (
                    <span><span className="spinner"></span> Adding{bouncingDots}</span>
                  ) : (
                    <>✓ Add Attendance</>
                  )}
                </button>
                <button type="button" className="btn-cancel" onClick={() => navigate('/')}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - SMOOTH SLIDESHOW */}
      <div className="visual-side">
        <div className="slideshow-container">
          {carouselImages.map((img, index) => (
            <div
              key={index}
              className={`slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${img})` }}
            >
              <div className="slide-overlay">
                <div className="slide-content">
                  <h2>Christ the King Fellowship</h2>
                  <p>Building lives, sharing God's love</p>
                  <div className="verse">"For where two or three gather in my name, there am I with them."</div>
                  <div className="verse-ref">— Matthew 18:20</div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Dots Indicator */}
          <div className="slideshow-dots">
            {carouselImages.map((_, index) => (
              <div
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
              />
            ))}
          </div>

          {/* Stats Overlay */}
          <div className="stats-overlay">
            <div className="stat-item">
              <div className="stat-number">{allMembers.length}</div>
              <div className="stat-label">Total Members</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">{allMembers.filter(m => m.status === 'Active').length}</div>
              <div className="stat-label">Active Members</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInput;