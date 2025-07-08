import React, { useState, useEffect } from 'react';
import {
  Search, MapPin, Bell, TrendingUp, Wind, Eye, AlertTriangle,
  Leaf, Navigation, Calendar, BarChart3, Settings
} from 'lucide-react';

const AirSense360 = () => {
  const [location, setLocation] = useState('');
  const [currentAQI, setCurrentAQI] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [nearbyRegions, setNearbyRegions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://localhost:5000/api';

  const fetchCurrentAQI = async (searchLocation) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/aqi/current?location=${encodeURIComponent(searchLocation)}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setCurrentAQI(data);
    } catch (error) {
      console.error('Error fetching current AQI:', error);
      setError('Failed to fetch air quality data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchForecast = async (searchLocation) => {
    try {
      const response = await fetch(`${API_BASE_URL}/aqi/forecast?location=${encodeURIComponent(searchLocation)}&days=3`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setForecastData(data.forecast || []);
    } catch (error) {
      console.error('Error fetching forecast:', error);
      setError('Failed to fetch forecast data.');
    }
  };

  const fetchNearbyRegions = async (searchLocation) => {
    try {
      const response = await fetch(`${API_BASE_URL}/aqi/nearby?location=${encodeURIComponent(searchLocation)}&radius=50`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setNearbyRegions(data.nearbyRegions || []);
    } catch (error) {
      console.error('Error fetching nearby regions:', error);
    }
  };

  useEffect(() => {
    const defaultLocation = 'Gurugram, Haryana';
    setLocation(defaultLocation);
    loadAllData(defaultLocation);
  }, []);

  const loadAllData = async (searchLocation) => {
    await Promise.all([
      fetchCurrentAQI(searchLocation),
      fetchForecast(searchLocation),
      fetchNearbyRegions(searchLocation)
    ]);
  };

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    if (aqi <= 300) return 'bg-purple-500';
    return 'bg-red-900';
  };

  const getAQITextColor = (aqi) => {
    if (aqi <= 50) return 'text-green-600';
    if (aqi <= 100) return 'text-yellow-600';
    if (aqi <= 150) return 'text-orange-600';
    if (aqi <= 200) return 'text-red-600';
    if (aqi <= 300) return 'text-purple-600';
    return 'text-red-900';
  };

  const handleSearch = () => {
    if (!location.trim()) return;
    loadAllData(location);
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
            setLocation(locationName);
            loadAllData(locationName);
          } catch (error) {
            console.error('Error getting location:', error);
            setError('Failed to get current location');
            setIsLoading(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Location access denied');
          setIsLoading(false);
        }
      );
    } else {
      setError('Geolocation not supported');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Wind className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">AirSense360</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Bell className="h-6 w-6 text-gray-500 hover:text-blue-600 cursor-pointer" />
              <Settings className="h-6 w-6 text-gray-500 hover:text-blue-600 cursor-pointer" />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['dashboard', 'forecast', 'map', 'alerts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Search'}
            </button>
            <button
              onClick={handleLocationClick}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Current Location
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Current AQI Card */}
            {currentAQI && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Current Air Quality</h2>
                  <span className="text-sm text-gray-500">
                    {currentAQI.location}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getAQIColor(currentAQI.aqi)} text-white mb-4`}>
                      <span className="text-3xl font-bold">{currentAQI.aqi}</span>
                    </div>
                    <h3 className={`text-xl font-semibold ${getAQITextColor(currentAQI.aqi)}`}>
                      {currentAQI.category}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Last updated: {new Date(currentAQI.lastUpdated).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">PM2.5</div>
                      <div className="text-2xl font-bold text-gray-900">{currentAQI.pm25}</div>
                      <div className="text-xs text-gray-500">µg/m³</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">PM10</div>
                      <div className="text-2xl font-bold text-gray-900">{currentAQI.pm10}</div>
                      <div className="text-xs text-gray-500">µg/m³</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">NO2</div>
                      <div className="text-2xl font-bold text-gray-900">{currentAQI.no2}</div>
                      <div className="text-xs text-gray-500">µg/m³</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600">CO</div>
                      <div className="text-2xl font-bold text-gray-900">{currentAQI.co}</div>
                      <div className="text-xs text-gray-500">mg/m³</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Nearby Regions */}
            {nearbyRegions.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Nearby Regions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {nearbyRegions.map((region, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{region.name}</h3>
                        <span className="text-xs text-gray-500">{region.distance}</span>
                      </div>
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getAQIColor(region.aqi)} text-white mb-2`}>
                        <span className="text-sm font-bold">{region.aqi}</span>
                      </div>
                      <p className={`text-sm ${getAQITextColor(region.aqi)}`}>
                        {region.category}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === 'forecast' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Air Quality Forecast</h2>
            {forecastData.length > 0 ? (
              <div className="space-y-4">
                {forecastData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                      <span className="font-medium text-gray-900">{item.time}</span>
                    </div>
                    <div className="flex items-center">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getAQIColor(item.aqi)} text-white mr-4`}>
                        <span className="text-sm font-bold">{item.aqi}</span>
                      </div>
                      <span className={`text-sm ${getAQITextColor(item.aqi)}`}>
                        {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No forecast data available</p>
            )}
          </div>
        )}

        {/* Map Tab */}
        {activeTab === 'map' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Air Quality Map</h2>
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Interactive map coming soon...</p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Air Quality Alerts</h2>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <p className="font-medium text-yellow-800">Moderate Air Quality</p>
                  <p className="text-sm text-yellow-700">Sensitive individuals should limit outdoor activities</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-blue-800">Weather Alert</p>
                  <p className="text-sm text-blue-700">Wind conditions may affect air quality readings</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AirSense360;