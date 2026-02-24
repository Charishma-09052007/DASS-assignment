import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

const Onboarding = () => {
    const navigate = useNavigate();
    const [interests, setInterests] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const interestsArray = interests.split(',').map(i => i.trim());
            await API.put('/users/interests', { interests: interestsArray });
            navigate('/dashboard');
        } catch (error) {
            console.error('Onboarding failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        navigate('/dashboard');
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
            <h1>Welcome! Tell us your interests</h1>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                    <label>Interests (comma separated):</label>
                    <input
                        type="text"
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        placeholder="coding, music, sports"
                        style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ padding: '10px 20px', marginRight: '10px' }}
                >
                    {loading ? 'Saving...' : 'Save'}
                </button>
                <button 
                    type="button" 
                    onClick={handleSkip}
                    style={{ padding: '10px 20px' }}
                >
                    Skip
                </button>
            </form>
        </div>
    );
};

export default Onboarding;